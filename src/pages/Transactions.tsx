import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Select,
  useToast,
  Card,
  CardBody,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Alert,
  AlertIcon,
  Center,
  Spinner,
  Badge,
  InputGroup,
  InputLeftElement,
  Input,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { transactionsAPI } from "../services/api";
import { getAuth } from "firebase/auth";

const Transactions = () => {
  const auth = getAuth();
  const user = auth.currentUser;
  const toast = useToast();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all"); // all, expense, income

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  useEffect(() => {
    filterTransactions();
  }, [searchTerm, categoryFilter, typeFilter, transactions]);

  const fetchTransactions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await transactionsAPI.getTransactions(user.uid, 500); // Get last 500 transactions
      // Sort by date, most recent first
      const sortedData = data.sort((a: any, b: any) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      setTransactions(sortedData);
      setFilteredTransactions(sortedData);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      toast({
        title: "Error loading transactions",
        description: "Failed to fetch transactions",
        status: "error",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.merchantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        (t) => t.personalFinanceCategory?.primary === categoryFilter
      );
    }

    // Type filter (expense/income)
    if (typeFilter === "expense") {
      filtered = filtered.filter((t) => {
        const isExpense = t.isExpense !== undefined ? t.isExpense : t.amount > 0;
        return isExpense;
      });
    } else if (typeFilter === "income") {
      filtered = filtered.filter((t) => {
        const isExpense = t.isExpense !== undefined ? t.isExpense : t.amount > 0;
        return !isExpense;
      });
    }

    setFilteredTransactions(filtered);
  };

  const formatDate = (dateString: string) => {
    // Parse date as local time to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getTransactionColor = (transaction: any) => {
    const isExpense =
      transaction.isExpense !== undefined
        ? transaction.isExpense
        : transaction.amount > 0;
    return isExpense ? "red.500" : "green.500";
  };

  const getTransactionSign = (transaction: any) => {
    const isExpense =
      transaction.isExpense !== undefined
        ? transaction.isExpense
        : transaction.amount > 0;
    return isExpense ? "-" : "+";
  };

  // Get unique categories for filter
  const categories = Array.from(
    new Set(
      transactions
        .map((t) => t.personalFinanceCategory?.primary)
        .filter((c) => c)
    )
  ).sort();

  if (!user) {
    return (
      <Container maxW="6xl" py={12}>
        <Alert status="warning">
          <AlertIcon />
          Please log in to view your transactions
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Center h="calc(100vh - 100px)">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Container maxW="7xl" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="xl" mb={2}>
            All Transactions
          </Heading>
          <Text color="gray.600">
            {filteredTransactions.length} of {transactions.length} transaction
            {transactions.length !== 1 ? "s" : ""}
          </Text>
        </Box>

        {/* Filters */}
        <Card>
          <CardBody>
            <HStack spacing={4} flexWrap="wrap">
              {/* Search */}
              <InputGroup maxW="300px">
                <InputLeftElement>
                  <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>

              {/* Type Filter */}
              <Select
                maxW="200px"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="expense">Expenses</option>
                <option value="income">Income</option>
              </Select>

              {/* Category Filter */}
              <Select
                maxW="250px"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat?.replace(/_/g, " ")}
                  </option>
                ))}
              </Select>

              {/* Clear Filters */}
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setCategoryFilter("all");
                  setTypeFilter("all");
                }}
              >
                Clear Filters
              </Button>

              {/* Refresh */}
              <Button
                colorScheme="blue"
                variant="outline"
                onClick={fetchTransactions}
                isLoading={loading}
              >
                Refresh
              </Button>
            </HStack>
          </CardBody>
        </Card>

        {/* Transactions Table */}
        {filteredTransactions.length === 0 ? (
          <Alert status="info">
            <AlertIcon />
            <Box>
              <Text fontWeight="semibold">No transactions found</Text>
              <Text fontSize="sm">
                {transactions.length === 0
                  ? "Upload a CSV file or connect your bank account to see transactions."
                  : "Try adjusting your filters to see more results."}
              </Text>
            </Box>
          </Alert>
        ) : (
          <Card>
            <CardBody p={0}>
              <Box maxH="600px" overflowY="auto">
                <Table variant="simple" size="sm">
                  <Thead position="sticky" top={0} bg="white" zIndex={1}>
                    <Tr>
                      <Th>Date</Th>
                      <Th>Description</Th>
                      <Th>Category</Th>
                      <Th>Type</Th>
                      <Th isNumeric>Amount</Th>
                      <Th isNumeric>Balance</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredTransactions.map((transaction, index) => {
                      const isExpense =
                        transaction.isExpense !== undefined
                          ? transaction.isExpense
                          : transaction.amount > 0;
                      
                      return (
                        <Tr key={transaction.id || index} _hover={{ bg: "gray.50" }}>
                          <Td whiteSpace="nowrap">
                            {formatDate(transaction.date)}
                          </Td>
                          <Td maxW="300px">
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="medium" noOfLines={1}>
                                {transaction.name}
                              </Text>
                              {transaction.merchantName &&
                                transaction.merchantName !== transaction.name && (
                                  <Text fontSize="xs" color="gray.500" noOfLines={1}>
                                    {transaction.merchantName}
                                  </Text>
                                )}
                            </VStack>
                          </Td>
                          <Td>
                            <Badge colorScheme="blue" fontSize="xs">
                              {transaction.personalFinanceCategory?.primary?.replace(
                                /_/g,
                                " "
                              ) ||
                                transaction.category?.[0] ||
                                "Other"}
                            </Badge>
                          </Td>
                          <Td>
                            <Badge
                              colorScheme={isExpense ? "red" : "green"}
                              variant="subtle"
                            >
                              {isExpense ? "Expense" : "Income"}
                            </Badge>
                          </Td>
                          <Td isNumeric>
                            <Text
                              color={getTransactionColor(transaction)}
                              fontWeight="bold"
                            >
                              {getTransactionSign(transaction)}$
                              {transaction.amount?.toFixed(2) || "0.00"}
                            </Text>
                          </Td>
                          <Td isNumeric>
                            <Text fontSize="sm" color="gray.600">
                              {transaction.balance
                                ? `$${transaction.balance.toFixed(2)}`
                                : "-"}
                            </Text>
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </Box>
            </CardBody>
          </Card>
        )}

        {/* Summary */}
        {filteredTransactions.length > 0 && (
          <Card>
            <CardBody>
              <HStack justify="space-around" flexWrap="wrap" spacing={4}>
                <VStack>
                  <Text fontSize="sm" color="gray.600">
                    Total Transactions
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold">
                    {filteredTransactions.length}
                  </Text>
                </VStack>
                <VStack>
                  <Text fontSize="sm" color="gray.600">
                    Total Expenses
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold" color="red.500">
                    $
                    {filteredTransactions
                      .filter((t) => {
                        const isExpense =
                          t.isExpense !== undefined ? t.isExpense : t.amount > 0;
                        return isExpense;
                      })
                      .reduce((sum, t) => sum + (t.amount || 0), 0)
                      .toFixed(2)}
                  </Text>
                </VStack>
                <VStack>
                  <Text fontSize="sm" color="gray.600">
                    Total Income
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold" color="green.500">
                    $
                    {filteredTransactions
                      .filter((t) => {
                        const isExpense =
                          t.isExpense !== undefined ? t.isExpense : t.amount > 0;
                        return !isExpense;
                      })
                      .reduce((sum, t) => sum + (t.amount || 0), 0)
                      .toFixed(2)}
                  </Text>
                </VStack>
              </HStack>
            </CardBody>
          </Card>
        )}
      </VStack>
    </Container>
  );
};

export default Transactions;

