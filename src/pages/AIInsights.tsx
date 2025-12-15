import React, { useState, useEffect } from "react";
import {
  Box,
  SimpleGrid,
  GridItem,
  Heading,
  Text,
  HStack,
  VStack,
  Icon,
  Button,
  useColorModeValue,
  Badge,
  UnorderedList,
  ListItem,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Divider,
} from "@chakra-ui/react";
import {
  StarIcon,
  ViewIcon,
} from "@chakra-ui/icons";
import { getAuth } from "firebase/auth";
import { aiAPI, pageCacheAPI } from "../services/api";

// Helper function to parse and format insights
const formatInsights = (insights: any): string => {
  if (!insights) return '';
  if (typeof insights === 'string') {
    return insights;
  }
  if (typeof insights === 'object') {
    if (insights.analysis) return insights.analysis;
    if (insights.summary) return insights.summary;
    if (insights.text) return insights.text;
    return JSON.stringify(insights, null, 2);
  }
  return String(insights);
};

// Enhanced parser for structured text with tables, lists, and sections
const parseStructuredText = (text: string) => {
  if (!text) return [];
  
  const sections: Array<{
    type: 'heading' | 'paragraph' | 'list' | 'table' | 'text';
    content: any;
    level?: number;
  }> = [];
  
  const lines = text.split('\n');
  let currentParagraph: string[] = [];
  let currentList: string[] = [];
  let currentTable: string[][] = [];
  let inTable = false;
  
  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      sections.push({
        type: 'paragraph',
        content: currentParagraph.join(' ').trim()
      });
      currentParagraph = [];
    }
  };
  
  const flushList = () => {
    if (currentList.length > 0) {
      sections.push({
        type: 'list',
        content: currentList
      });
      currentList = [];
    }
  };
  
  const flushTable = () => {
    if (currentTable.length > 0) {
      sections.push({
        type: 'table',
        content: currentTable
      });
      currentTable = [];
      inTable = false;
    }
  };
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      flushParagraph();
      flushList();
      flushTable();
      continue;
    }
    
    // Check for headings (markdown style or numbered)
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    const numberedHeadingMatch = line.match(/^(\d+)\.\s+(.+)$/);
    
    if (headingMatch) {
      flushParagraph();
      flushList();
      flushTable();
      sections.push({
        type: 'heading',
        content: headingMatch[2],
        level: headingMatch[1].length
      });
      continue;
    }
    
    if (numberedHeadingMatch && numberedHeadingMatch[2].length > 20) {
      flushParagraph();
      flushList();
      flushTable();
      sections.push({
        type: 'heading',
        content: numberedHeadingMatch[2],
        level: 2
      });
      continue;
    }
    
    // Check for table (contains | or multiple spaces/tabs)
    const hasPipe = line.includes('|');
    const hasMultipleSpaces = /\s{2,}/.test(line);
    
    if (hasPipe || (hasMultipleSpaces && line.split(/\s{2,}/).length >= 2)) {
      flushParagraph();
      flushList();
      
      if (hasPipe) {
        const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
        if (cells.length >= 2) {
          inTable = true;
          currentTable.push(cells);
          continue;
        }
      } else {
        const cells = line.split(/\s{2,}/).map(cell => cell.trim()).filter(cell => cell);
        if (cells.length >= 2) {
          inTable = true;
          currentTable.push(cells);
          continue;
        }
      }
    }
    
    if (inTable && (!hasPipe && !hasMultipleSpaces)) {
      flushTable();
    }
    
    // Check for list items
    const listMatch = line.match(/^[-*•]\s+(.+)$/) || line.match(/^\d+[.)]\s+(.+)$/);
    if (listMatch) {
      flushParagraph();
      flushTable();
      currentList.push(listMatch[1]);
      continue;
    }
    
    // Regular text
    if (inTable) {
      flushTable();
    }
    flushList();
    currentParagraph.push(line);
  }
  
  flushParagraph();
  flushList();
  flushTable();
  
  return sections;
};

// Component to render formatted insights
const RenderInsights = ({ insights }: { insights: any }) => {
  const formatted = formatInsights(insights);
  const sections = parseStructuredText(formatted);
  
  // Helper to render text with bold markdown (**text**)
  const renderTextWithBold = (text: string, keyPrefix: string = '') => {
    const parts: (string | JSX.Element)[] = [];
    const regex = /\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      parts.push(
        <Text as="span" key={`${keyPrefix}-bold-${key++}`} fontWeight="bold">
          {match[1]}
        </Text>
      );
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    return parts.length > 0 ? parts : [text];
  };
  
  if (sections.length === 0) {
    return (
      <Text fontSize="sm" whiteSpace="pre-wrap" color="gray.700">
        {formatted || 'No insights available'}
      </Text>
    );
  }

  return (
    <VStack align="stretch" spacing={4}>
      {sections.map((section, idx) => {

        if (section.type === 'heading') {
          const HeadingComponent = section.level === 1 ? Heading : 
                                   section.level === 2 ? Heading : 
                                   Heading;
          return (
            <HeadingComponent 
              key={idx} 
              size={section.level === 1 ? "sm" : section.level === 2 ? "xs" : "xs"}
              mt={idx > 0 ? 4 : 0}
              mb={2}
              color="gray.700"
            >
              {renderTextWithBold(section.content, `heading-${idx}`)}
            </HeadingComponent>
          );
        }
        
        if (section.type === 'list') {
          return (
            <UnorderedList key={idx} spacing={2}>
              {section.content.map((item: string, i: number) => (
                <ListItem key={i} fontSize="sm" color="gray.700">
                  {renderTextWithBold(item, `list-${idx}-${i}`)}
                </ListItem>
              ))}
            </UnorderedList>
          );
        }
        
        if (section.type === 'table') {
          if (section.content.length === 0) return null;
          
          const headers = section.content[0];
          const rows = section.content.slice(1);
          
          return (
            <Box key={idx} overflowX="auto" my={2}>
              <Table variant="simple" size="sm">
                {headers.length > 0 && (
                  <Thead>
                    <Tr>
                      {headers.map((header: string, i: number) => (
                        <Th key={i} fontSize="xs" color="gray.600">
                          {header}
                        </Th>
                      ))}
                    </Tr>
                  </Thead>
                )}
                <Tbody>
                  {rows.map((row: string[], i: number) => (
                    <Tr key={i}>
                      {row.map((cell: string, j: number) => (
                        <Td key={j} fontSize="sm" color="gray.700">
                          {renderTextWithBold(cell, `table-${idx}-${i}-${j}`)}
                        </Td>
                      ))}
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          );
        }
        
        if (section.type === 'paragraph' || section.type === 'text') {
          return (
            <Text key={idx} fontSize="sm" color="gray.700" lineHeight="1.6">
              {renderTextWithBold(section.content, `para-${idx}`)}
            </Text>
          );
        }
        
        return null;
      })}
    </VStack>
  );
};

const AIInsights = () => {
  const auth = getAuth();
  const user = auth.currentUser;

  const [quickInsight, setQuickInsight] = useState<any>(null);
  const [quickInsightLoading, setQuickInsightLoading] = useState(false);
  const [spendingAnalysis, setSpendingAnalysis] = useState<any>(null);
  const [spendingAnalysisLoading, setSpendingAnalysisLoading] = useState(false);
  const [savingsAdvice, setSavingsAdvice] = useState<any>(null);
  const [savingsAdviceLoading, setSavingsAdviceLoading] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");

  // Load latest insights from cache when user is available
  useEffect(() => {
    const loadLatestInsights = async () => {
      if (!user) return;

      try {
        // Load cached AI insights data
        const insightsData = await pageCacheAPI.getAIInsightsData(user.uid);
        
        if (insightsData.quickInsight) {
          setQuickInsight(insightsData.quickInsight);
      }
        if (insightsData.spendingAnalysis) {
          setSpendingAnalysis(insightsData.spendingAnalysis);
      }
        if (insightsData.savingsAdvice) {
          setSavingsAdvice(insightsData.savingsAdvice);
        }
        if (insightsData.analysisHistory) {
          setAnalysisHistory(insightsData.analysisHistory);
        }
      } catch (error) {
        console.error('Error loading AI insights:', error);
      } finally {
        setHistoryLoading(false);
      }
    };

    loadLatestInsights();
  }, [user]);

  // AI Insight handlers
  const handleQuickInsight = async () => {
    if (!user) return;
    setQuickInsightLoading(true);
    try {
      const result = await aiAPI.getQuickInsight(user.uid);
      setQuickInsight(result);
      // Reload cached data (bypass cache to get fresh data)
      const insightsData = await pageCacheAPI.getAIInsightsData(user.uid, true);
      if (insightsData.quickInsight) setQuickInsight(insightsData.quickInsight);
      if (insightsData.analysisHistory) setAnalysisHistory(insightsData.analysisHistory);
    } catch (error) {
      console.error('Error fetching quick insight:', error);
    } finally {
      setQuickInsightLoading(false);
    }
  };

  const handleSpendingAnalysis = async () => {
    if (!user) return;
    setSpendingAnalysisLoading(true);
    try {
      const result = await aiAPI.getFinancialInsights(user.uid, 'spending_analysis');
      setSpendingAnalysis(result);
      // Reload cached data (bypass cache to get fresh data)
      const insightsData = await pageCacheAPI.getAIInsightsData(user.uid, true);
      if (insightsData.spendingAnalysis) setSpendingAnalysis(insightsData.spendingAnalysis);
      if (insightsData.analysisHistory) setAnalysisHistory(insightsData.analysisHistory);
    } catch (error) {
      console.error('Error fetching spending analysis:', error);
    } finally {
      setSpendingAnalysisLoading(false);
    }
  };


  const handleSavingsAdvice = async () => {
    if (!user) return;
    setSavingsAdviceLoading(true);
    try {
      const result = await aiAPI.getFinancialInsights(user.uid, 'savings_advice');
      setSavingsAdvice(result);
      // Reload cached data (bypass cache to get fresh data)
      const insightsData = await pageCacheAPI.getAIInsightsData(user.uid, true);
      if (insightsData.savingsAdvice) setSavingsAdvice(insightsData.savingsAdvice);
      if (insightsData.analysisHistory) setAnalysisHistory(insightsData.analysisHistory);
    } catch (error) {
      console.error('Error fetching savings advice:', error);
    } finally {
      setSavingsAdviceLoading(false);
    }
  };

  const handleLoadHistory = async () => {
    if (!user) return;
    setHistoryLoading(true);
    try {
      // Reload cached data (bypass cache to get fresh data)
      const insightsData = await pageCacheAPI.getAIInsightsData(user.uid, true);
      if (insightsData.analysisHistory) {
        setAnalysisHistory(insightsData.analysisHistory);
      }
    } catch (error) {
      console.error('Error fetching analysis history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <Box maxW="7xl" mx="auto" py={8} px={{ base: 2, md: 8 }}>
      <Heading size="lg" mb={6} display="flex" alignItems="center">
        <Icon as={StarIcon} mr={2} color="purple.400" />
        AI-Powered Financial Insights
      </Heading>

      <VStack align="stretch" spacing={6}>
        {/* Quick Insight Section - Full Width Row */}
        <Box bg={cardBg} borderWidth={1} borderColor={border} borderRadius="lg" p={6} boxShadow="md">
          <HStack justify="space-between" mb={4}>
            <Heading size="md" display="flex" alignItems="center">
              <Icon as={StarIcon} mr={2} color="purple.400" />
              Quick Insight
            </Heading>
            <Button
              colorScheme="purple"
              onClick={handleQuickInsight}
              isLoading={quickInsightLoading}
              loadingText="Analyzing..."
              leftIcon={<StarIcon />}
            >
              Generate Quick Insight
            </Button>
          </HStack>
          {quickInsight ? (
            <Box>
              {quickInsight.summary && (
                <Box mb={6} p={4} bg="purple.50" borderRadius="md">
                  <Heading size="sm" mb={3}>Financial Summary</Heading>
                  <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                    <Box>
                      <Text fontSize="xs" color="gray.600">Total Income</Text>
                      <Text fontWeight="bold" color="green.600" fontSize="xl">
                        ${(quickInsight.summary.total_income || 0).toFixed(2)}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="gray.600">Total Expenses</Text>
                      <Text fontWeight="bold" color="red.600" fontSize="xl">
                        ${(quickInsight.summary.total_expenses || 0).toFixed(2)}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="gray.600">Net Income</Text>
                      <Text fontWeight="bold" color={(quickInsight.summary.net_income || 0) >= 0 ? "green.600" : "red.600"} fontSize="xl">
                        ${(quickInsight.summary.net_income || 0).toFixed(2)}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="gray.600">Goals</Text>
                      <Text fontWeight="bold" fontSize="xl">{quickInsight.summary.goals_count || 0}</Text>
                    </Box>
                  </SimpleGrid>
                </Box>
              )}
              {quickInsight.ai_insights && (
                <Box mb={4}>
                  <RenderInsights insights={quickInsight.ai_insights} />
                </Box>
              )}
              {quickInsight.recommendations && quickInsight.recommendations.length > 0 && (
                <Box mb={4}>
                  <Heading size="sm" mb={3}>Recommendations</Heading>
                  <UnorderedList spacing={2}>
                    {quickInsight.recommendations.map((rec: string, idx: number) => (
                      <ListItem key={idx} fontSize="sm" color="gray.700">{rec}</ListItem>
                    ))}
                  </UnorderedList>
                </Box>
              )}
              {quickInsight.spending_by_category && Object.keys(quickInsight.spending_by_category).length > 0 && (
                <Box>
                  <Heading size="sm" mb={3}>Spending by Category</Heading>
                  <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
                    {Object.entries(quickInsight.spending_by_category)
                      .sort(([, a]: [string, any], [, b]: [string, any]) => b - a)
                      .map(([cat, amount]: [string, any]) => (
                      <Box key={cat} p={3} bg="gray.50" borderRadius="md">
                        <Text fontSize="xs" color="gray.600" mb={1}>{cat.replace(/_/g, ' ')}</Text>
                        <Text fontSize="lg" fontWeight="bold" color="red.600">${amount?.toFixed(2) || '0.00'}</Text>
                      </Box>
                    ))}
                  </SimpleGrid>
                </Box>
              )}
            </Box>
          ) : (
            <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
              No quick insight available. Click "Generate Quick Insight" to create one.
            </Text>
          )}
        </Box>

        {/* Spending Analysis Section - Full Width Row */}
        <Box bg={cardBg} borderWidth={1} borderColor={border} borderRadius="lg" p={6} boxShadow="md">
          <HStack justify="space-between" mb={4}>
            <Heading size="md" color="blue.400">Spending Analysis</Heading>
            <Button
              colorScheme="blue"
              onClick={handleSpendingAnalysis}
              isLoading={spendingAnalysisLoading}
              loadingText="Analyzing..."
            >
              Analyze Spending
            </Button>
          </HStack>
          {spendingAnalysis ? (
            <Box>
              {spendingAnalysis.insights && (
                <Box>
                  <RenderInsights insights={spendingAnalysis.insights} />
                </Box>
              )}
              {spendingAnalysis.recommendations && spendingAnalysis.recommendations.length > 0 && (
                <Box mt={4}>
                  <Heading size="sm" mb={3}>Recommendations</Heading>
                  <UnorderedList spacing={2}>
                    {spendingAnalysis.recommendations.map((rec: string, idx: number) => (
                      <ListItem key={idx} fontSize="sm" color="gray.700">{rec}</ListItem>
                    ))}
                  </UnorderedList>
                </Box>
              )}
            </Box>
          ) : (
            <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
              No spending analysis available. Click "Analyze Spending" to generate one.
            </Text>
          )}
        </Box>

        {/* Savings Advice Section - Full Width Row */}
        <Box bg={cardBg} borderWidth={1} borderColor={border} borderRadius="lg" p={6} boxShadow="md">
          <HStack justify="space-between" mb={4}>
            <Heading size="md" color="teal.400">Savings Advice</Heading>
            <Button
              colorScheme="teal"
              onClick={handleSavingsAdvice}
              isLoading={savingsAdviceLoading}
              loadingText="Analyzing..."
            >
              Get Advice
            </Button>
          </HStack>
          {savingsAdvice ? (
            <Box>
              {/* Handle insights - could be string or object */}
              {savingsAdvice.insights && (
                <Box mb={4}>
                  {typeof savingsAdvice.insights === 'object' && savingsAdvice.insights.analysis ? (
                    <RenderInsights insights={savingsAdvice.insights.analysis} />
                  ) : typeof savingsAdvice.insights === 'object' && savingsAdvice.insights.advice ? (
                    <RenderInsights insights={savingsAdvice.insights.advice} />
                  ) : (
                    <RenderInsights insights={savingsAdvice.insights} />
                  )}
                </Box>
              )}
              
              {/* Display actionable tips if available in insights object */}
              {savingsAdvice.insights && typeof savingsAdvice.insights === 'object' && savingsAdvice.insights.actionable_tips && (
                <Box mb={4}>
                  <Heading size="sm" mb={3}>Actionable Tips</Heading>
                  <UnorderedList spacing={2}>
                    {(Array.isArray(savingsAdvice.insights.actionable_tips) 
                      ? savingsAdvice.insights.actionable_tips 
                      : []).map((tip: string, idx: number) => (
                      <ListItem key={idx} fontSize="sm" color="gray.700">{tip}</ListItem>
                    ))}
                  </UnorderedList>
                </Box>
              )}

              {/* Display top categories if available */}
              {savingsAdvice.insights && typeof savingsAdvice.insights === 'object' && savingsAdvice.insights.top_categories && (
                <Box mb={4}>
                  <Heading size="sm" mb={3}>Top Spending Categories</Heading>
                  <SimpleGrid columns={{ base: 2, md: 3 }} spacing={3}>
                    {Object.entries(savingsAdvice.insights.top_categories)
                      .sort(([, a]: [string, any], [, b]: [string, any]) => b - a)
                      .map(([cat, amount]: [string, any]) => (
                      <Box key={cat} p={3} bg="teal.50" borderRadius="md" borderWidth={1} borderColor="teal.200">
                        <Text fontSize="xs" color="gray.600" mb={1} fontWeight="medium">{cat.replace(/_/g, ' ')}</Text>
                        <Text fontSize="lg" fontWeight="bold" color="teal.600">${amount?.toFixed(2) || '0.00'}</Text>
                      </Box>
                    ))}
                  </SimpleGrid>
                </Box>
              )}

              {/* Display recommendations */}
              {savingsAdvice.recommendations && savingsAdvice.recommendations.length > 0 && (
                <Box mt={4}>
                  <Heading size="sm" mb={3}>Recommendations</Heading>
                  <UnorderedList spacing={2}>
                    {savingsAdvice.recommendations.map((rec: string, idx: number) => (
                      <ListItem key={idx} fontSize="sm" color="gray.700">{rec}</ListItem>
                    ))}
                  </UnorderedList>
                </Box>
              )}
            </Box>
          ) : (
            <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
              No savings advice available. Click "Get Advice" to generate one.
            </Text>
          )}
        </Box>

        {/* Analysis History Section - Full Width Row */}
        <Box bg={cardBg} borderWidth={1} borderColor={border} borderRadius="lg" p={6} boxShadow="md">
          <HStack justify="space-between" mb={4}>
            <Heading size="md" display="flex" alignItems="center">
              <Icon as={ViewIcon} mr={2} color="blue.400" />
              Analysis History
            </Heading>
            <Button
              size="sm"
              colorScheme="gray"
              onClick={handleLoadHistory}
              isLoading={historyLoading}
              loadingText="Loading..."
            >
              Refresh
            </Button>
          </HStack>
          {analysisHistory.length > 0 ? (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {analysisHistory.map((analysis: any) => (
                <Box
                  key={analysis.id}
                  p={4}
                  borderWidth={1}
                  borderColor={border}
                  borderRadius="md"
                  bg={useColorModeValue("gray.50", "gray.700")}
                >
                  <HStack justify="space-between" mb={2}>
                    <Badge colorScheme="purple">{analysis.analysis_type?.replace(/_/g, ' ')}</Badge>
                    <Text fontSize="xs" color="gray.500">
                      {new Date(analysis.created_at).toLocaleDateString()}
                    </Text>
                  </HStack>
                  {analysis.result && (
                    <Box mt={2}>
                      <Text fontSize="xs" color="gray.600" noOfLines={3}>
                        {typeof analysis.result === 'string' 
                          ? analysis.result 
                          : JSON.stringify(analysis.result, null, 2).substring(0, 150) + '...'}
                      </Text>
                    </Box>
                  )}
                </Box>
              ))}
            </SimpleGrid>
          ) : (
            <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
              No analysis history yet. Generate insights to see them here.
            </Text>
          )}
        </Box>
      </VStack>
    </Box>
  );
};

export default AIInsights;
