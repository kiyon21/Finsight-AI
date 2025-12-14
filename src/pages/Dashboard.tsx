import React, { useState, useEffect } from "react";
import {
  Box,
  SimpleGrid,
  GridItem,
  Heading,
  Text,
  Flex,
  HStack,
  VStack,
  Icon,
  Button,
  Tag,
  useColorModeValue,
  Spinner,
  Center,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import {
  CheckCircleIcon,
  InfoOutlineIcon,
  ArrowDownIcon,
  ArrowUpIcon,
} from "@chakra-ui/icons";
import { getAuth } from "firebase/auth";
import { transactionsAPI, goalsAPI, incomeAPI, authAPI } from "../services/api";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const auth = getAuth();
  const user = auth.currentUser;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [spendingSummary, setSpendingSummary] = useState<Record<string, number>>({});
  const [totalSpending, setTotalSpending] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [goals, setGoals] = useState<any[]>([]);
  const [incomeSources, setIncomeSources] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>(null);

  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch all data in parallel
      const [txns, userData, goalsData, incomeData] = await Promise.all([
        transactionsAPI.getTransactions(user.uid, 100), // Get last 100 transactions
        authAPI.getUserData(user.uid),
        goalsAPI.getGoals(user.uid),
        incomeAPI.getIncomeSources(user.uid),
      ]);

      setTransactions(txns);
      setUserData(userData);
      setGoals(goalsData);
      setIncomeSources(incomeData);

      // If no transactions, redirect to upload page
      if (!txns || txns.length === 0) {
        navigate('/upload-transactions');
        return;
      }

      // Calculate spending summary and total
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      
      // Get spending summary for all time (for top categories)
      const allTimeSummary = await transactionsAPI.getSpendingSummary(user.uid);
      
      // Get current month's total spending
      const currentMonthTotal = await transactionsAPI.getTotalSpending(
        user.uid, 
        `${currentMonth}-01`, 
        `${currentMonth}-31`
      );

      // Calculate this month's earnings from transactions
      const currentMonthTransactions = txns.filter(t => 
        t.date.startsWith(currentMonth)
      );
      const monthlyEarnings = currentMonthTransactions.reduce((sum, t) => {
        const isIncome = t.isExpense !== undefined ? !t.isExpense : t.amount <= 0;
        return sum + (isIncome && t.amount > 0 ? t.amount : 0);
      }, 0);

      setSpendingSummary(allTimeSummary);
      setTotalSpending(currentMonthTotal.total || 0);
      setTotalEarnings(monthlyEarnings);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Center h="calc(100vh - 100px)">
        <Spinner size="xl" />
      </Center>
    );
  }

  // Calculate totals
  const totalIncome = incomeSources.reduce((sum, source) => {
    const amount = parseFloat(source.amount) || 0;
    return sum + amount;
  }, 0);

  // Use balance from user data (updated from CSV uploads)
  const balance = userData?.balance || 0;
  
  // Get most recent balance update date from user data
  const balanceUpdatedDate = userData?.balanceUpdated;
  const formattedDate = balanceUpdatedDate 
    ? (() => {
        // Parse date as local time to avoid timezone issues
        const [year, month, day] = balanceUpdatedDate.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      })()
    : 'N/A';

  // Get top spending categories
  const topCategories = Object.entries(spendingSummary)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 3);

  return (
    <Box maxW="7xl" mx="auto" py={8} px={{ base: 2, md: 8 }}>
      <Heading size="lg" mb={6}>Dashboard</Heading>
      
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        {/* Financial Summary */}
        <GridItem colSpan={{ base: 1, md: 2 }}>
          <Box bg={cardBg} borderWidth={1} borderColor={border} borderRadius="lg" p={6} boxShadow="md">
            <HStack justify="space-between" align="flex-start" mb={2} flexWrap="wrap" gap={2}>
              <Heading size="md" display="flex" alignItems="center">
                <Icon as={InfoOutlineIcon} mr={2} color="blue.400" />
                Current Financial Summary
              </Heading>
              <VStack align="end" spacing={0}>
                <Tag colorScheme="green" size="lg" px={4} py={1} borderRadius="full">
                  Active <CheckCircleIcon ml={2} />
                </Tag>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Updated: {formattedDate}
                </Text>
              </VStack>
            </HStack>
            <Flex wrap="wrap" gap={8} mt={4}>
              <VStack align="start" spacing={1} minW="180px">
                <Text fontWeight="bold">Balance:</Text>
                <Text fontSize="2xl" color="blue.500">${balance.toFixed(2)}</Text>
              </VStack>
              <VStack align="start" spacing={1} minW="180px">
                <Text fontWeight="bold">This Month's Spending:</Text>
                <Text fontSize="2xl" color="red.400">${totalSpending.toFixed(2)}</Text>
              </VStack>
              <VStack align="start" spacing={1} minW="180px">
                <Text fontWeight="bold">This Month's Earnings:</Text>
                <Text fontSize="2xl" color="green.500">${totalEarnings.toFixed(2)}</Text>
              </VStack>
              <VStack align="start" spacing={1} minW="180px">
                <Text fontWeight="bold">Active Goals:</Text>
                <Text fontSize="lg">{goals.length} goal{goals.length !== 1 ? 's' : ''}</Text>
              </VStack>
              <VStack align="start" spacing={1} minW="180px">
                <Text fontWeight="bold">Income Sources:</Text>
                <Text fontSize="lg">{incomeSources.length} source{incomeSources.length !== 1 ? 's' : ''}</Text>
              </VStack>
            </Flex>
          </Box>
        </GridItem>

        {/* Bank Connection Status */}
        <GridItem>
          <Box bg={cardBg} borderWidth={1} borderColor={border} borderRadius="lg" p={6} boxShadow="md" h="100%">
            <Heading size="sm" mb={4} display="flex" alignItems="center">
              <Icon as={CheckCircleIcon} mr={2} color={userData?.accessToken ? "green.400" : "gray.400"} />
              Bank Connection Status
            </Heading>
            {userData?.accessToken ? (
              <>
                <Text mb={2} color="green.600" fontWeight="bold">
                  Connected via Plaid
                </Text>
                <Text fontSize="sm" color="gray.500">Automatic sync enabled</Text>
              </>
            ) : (
              <>
                <Text mb={2} color="gray.600">
                  Not connected
                </Text>
                <Button size="sm" colorScheme="blue" variant="outline">
                  Connect Bank
                </Button>
              </>
            )}
          </Box>
        </GridItem>

        {/* Transaction Stats */}
        <GridItem>
          <Box bg={cardBg} borderWidth={1} borderColor={border} borderRadius="lg" p={6} boxShadow="md" h="100%">
            <Heading size="sm" mb={4} display="flex" alignItems="center">
              <Icon as={InfoOutlineIcon} mr={2} color="blue.400" />
              Transaction Summary
            </Heading>
            <VStack align="start" spacing={2}>
              <HStack><Text>Total Transactions:</Text><Text fontWeight="bold">{transactions.length}</Text></HStack>
              <HStack><Text>This Month:</Text><Text fontWeight="bold">{transactions.filter(t => t.date.startsWith(new Date().toISOString().slice(0, 7))).length}</Text></HStack>
            </VStack>
          </Box>
        </GridItem>

        {/* Top Spending Categories */}
        <GridItem>
          <Box bg={cardBg} borderWidth={1} borderColor={border} borderRadius="lg" p={6} boxShadow="md" h="100%">
            <Heading size="sm" mb={4} display="flex" alignItems="center">
              <Icon as={ArrowDownIcon} mr={2} color="red.400" />
              Top Spending Categories
            </Heading>
            <VStack align="start" spacing={2} w="full">
              {topCategories.length > 0 ? (
                topCategories.map(([category, amount]) => (
                  <HStack key={category} justify="space-between" w="full">
                    <Text fontWeight="medium">{category}</Text>
                    <Text color="red.400" fontWeight="bold">${(amount as number).toFixed(2)}</Text>
                  </HStack>
                ))
              ) : (
                <Text fontSize="sm" color="gray.500">No spending data yet</Text>
              )}
            </VStack>
          </Box>
        </GridItem>

        {/* Income Snapshot */}
        <GridItem>
          <Box bg={cardBg} borderWidth={1} borderColor={border} borderRadius="lg" p={6} boxShadow="md" h="100%">
            <Heading size="sm" mb={4} display="flex" alignItems="center">
              <Icon as={ArrowUpIcon} mr={2} color="green.400" />
              Income
            </Heading>
            <VStack align="start" spacing={2}>
              <HStack><Text>Total Income:</Text><Text color="green.500">${totalIncome.toFixed(2)}</Text></HStack>
              <HStack><Text>Net (Income - Spending):</Text><Text color={totalIncome - totalSpending >= 0 ? "green.500" : "red.400"}>${(totalIncome - totalSpending).toFixed(2)}</Text></HStack>
            </VStack>
          </Box>
        </GridItem>

        {/* Goals Summary */}
        {goals.length > 0 && (
          <GridItem colSpan={{ base: 1, md: 2 }}>
            <Box bg={cardBg} borderWidth={1} borderColor={border} borderRadius="lg" p={6} boxShadow="md">
              <Heading size="sm" mb={4}>Your Financial Goals</Heading>
              <VStack align="start" spacing={3}>
                {goals.slice(0, 3).map((goal, index) => (
                  <Box key={index} w="full" p={3} bg="gray.50" borderRadius="md">
                    <HStack justify="space-between">
                      <Text fontWeight="semibold">{goal.goal_name}</Text>
                      <Text fontSize="sm" color="gray.600">{goal.goal_type}</Text>
                    </HStack>
                    <HStack justify="space-between" mt={1}>
                      <Text fontSize="sm">Target: ${goal.target_amount}</Text>
                      <Text fontSize="sm" color="gray.500">By {goal.target_date}</Text>
                    </HStack>
                  </Box>
                ))}
                {goals.length > 3 && (
                  <Text fontSize="sm" color="gray.500">+ {goals.length - 3} more goals</Text>
                )}
              </VStack>
            </Box>
          </GridItem>
        )}
      </SimpleGrid>
    </Box>
  );
};

export default Dashboard;

