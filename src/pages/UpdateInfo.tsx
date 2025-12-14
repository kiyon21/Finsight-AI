import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  VStack,
  HStack,
  Button,
  Input,
  FormControl,
  FormLabel,
  Select,
  useToast,
  Icon,
  Text,
  Card,
  CardBody,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Alert,
  AlertIcon,
  Center,
} from "@chakra-ui/react";
import { AttachmentIcon, AddIcon, DeleteIcon, EditIcon, CheckCircleIcon } from "@chakra-ui/icons";
import { transactionsAPI, goalsAPI, incomeAPI } from "../services/api";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const UpdateInfo = () => {
  const auth = getAuth();
  const user = auth.currentUser;
  const toast = useToast();
  const navigate = useNavigate();

  // CSV Upload State
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processingJobId, setProcessingJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // Goals State
  const [goals, setGoals] = useState<any[]>([]);
  const [newGoal, setNewGoal] = useState({
    goal_name: "",
    goal_type: "",
    target_amount: "",
    target_date: "",
  });
  const [loadingGoals, setLoadingGoals] = useState(false);

  // Income State
  const [incomeSources, setIncomeSources] = useState<any[]>([]);
  const [newIncome, setNewIncome] = useState({
    source_name: "",
    amount: "",
    frequency: "monthly",
  });
  const [loadingIncome, setLoadingIncome] = useState(false);

  // Transactions State
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  useEffect(() => {
    if (user) {
      fetchGoals();
      fetchIncome();
      fetchTransactions();
    }
  }, [user]);

  // CSV Upload Functions
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const pollJobStatus = async (jobId: string) => {
    const maxAttempts = 60;
    let attempts = 0;

    const poll = setInterval(async () => {
      try {
        const status = await transactionsAPI.getJobStatus(jobId);
        setProgress(status.progress || 0);

        if (status.status === "completed") {
          clearInterval(poll);
          setUploading(false);
          setFile(null);
          
          const message = status.modifiedTransactions 
            ? `${status.addedTransactions} new, ${status.modifiedTransactions} updated`
            : `${status.addedTransactions} transactions imported`;
          
          toast({
            title: "Processing complete!",
            description: message,
            status: "success",
            duration: 5000,
          });
          
          // Refresh transactions list if on that tab
          fetchTransactions();
        } else if (status.status === "failed") {
          clearInterval(poll);
          setUploading(false);
          toast({
            title: "Processing failed",
            description: status.error || "An error occurred during processing",
            status: "error",
            duration: 5000,
          });
        }

        attempts++;
        if (attempts >= maxAttempts) {
          clearInterval(poll);
          setUploading(false);
          toast({
            title: "Processing timeout",
            description: "The job is still processing. Please check back later.",
            status: "warning",
            duration: 5000,
          });
        }
      } catch (err) {
        console.error("Error polling job status:", err);
      }
    }, 1000);
  };

  const handleUploadCSV = async () => {
    if (!file || !user) return;

    setUploading(true);
    setProgress(0);

    try {
      const result = await transactionsAPI.uploadCSV(user.uid, file);
      toast({
        title: "Upload accepted!",
        description: "Your file is being processed...",
        status: "info",
        duration: 3000,
      });

      setProcessingJobId(result.jobId);
      await pollJobStatus(result.jobId);
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err.response?.data?.error || "An error occurred",
        status: "error",
        duration: 5000,
      });
      setUploading(false);
    }
  };

  // Goals Functions
  const fetchGoals = async () => {
    if (!user) return;
    setLoadingGoals(true);
    try {
      const data = await goalsAPI.getGoals(user.uid);
      setGoals(data);
    } catch (err) {
      console.error("Error fetching goals:", err);
    } finally {
      setLoadingGoals(false);
    }
  };

  const handleAddGoal = async () => {
    if (!user || !newGoal.goal_name || !newGoal.target_amount) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    try {
      await goalsAPI.addGoal(user.uid, newGoal);
      toast({
        title: "Goal added successfully",
        status: "success",
        duration: 3000,
      });
      setNewGoal({ goal_name: "", goal_type: "", target_amount: "", target_date: "" });
      fetchGoals();
    } catch (err: any) {
      toast({
        title: "Failed to add goal",
        description: err.response?.data?.error || "An error occurred",
        status: "error",
        duration: 5000,
      });
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!user) return;
    try {
      await goalsAPI.deleteGoal(user.uid, goalId);
      toast({
        title: "Goal deleted",
        status: "success",
        duration: 3000,
      });
      fetchGoals();
    } catch (err: any) {
      toast({
        title: "Failed to delete goal",
        description: err.response?.data?.error || "An error occurred",
        status: "error",
        duration: 5000,
      });
    }
  };

  // Income Functions
  const fetchIncome = async () => {
    if (!user) return;
    setLoadingIncome(true);
    try {
      const data = await incomeAPI.getIncomeSources(user.uid);
      setIncomeSources(data);
    } catch (err) {
      console.error("Error fetching income:", err);
    } finally {
      setLoadingIncome(false);
    }
  };

  const handleAddIncome = async () => {
    if (!user || !newIncome.source_name || !newIncome.amount) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    try {
      await incomeAPI.addIncomeSource(user.uid, newIncome);
      toast({
        title: "Income source added successfully",
        status: "success",
        duration: 3000,
      });
      setNewIncome({ source_name: "", amount: "", frequency: "monthly" });
      fetchIncome();
    } catch (err: any) {
      toast({
        title: "Failed to add income source",
        description: err.response?.data?.error || "An error occurred",
        status: "error",
        duration: 5000,
      });
    }
  };

  const handleDeleteIncome = async (incomeId: string) => {
    if (!user) return;
    try {
      await incomeAPI.deleteIncomeSource(user.uid, incomeId);
      toast({
        title: "Income source deleted",
        status: "success",
        duration: 3000,
      });
      fetchIncome();
    } catch (err: any) {
      toast({
        title: "Failed to delete income source",
        description: err.response?.data?.error || "An error occurred",
        status: "error",
        duration: 5000,
      });
    }
  };

  // Transactions Functions
  const fetchTransactions = async () => {
    if (!user) return;
    setLoadingTransactions(true);
    try {
      const data = await transactionsAPI.getTransactions(user.uid, 100); // Get last 100 transactions
      setTransactions(data);
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const formatDate = (dateString: string) => {
    // Parse date as local time to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getTransactionColor = (transaction: any) => {
    // If isExpense flag exists, use it; otherwise check amount
    const isExpense = transaction.isExpense !== undefined 
      ? transaction.isExpense 
      : transaction.amount > 0;
    return isExpense ? "red.500" : "green.500";
  };

  if (!user) {
    return (
      <Container maxW="2xl" py={12}>
        <Alert status="warning">
          <AlertIcon />
          Please log in to update your information
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxW="6xl" py={8}>
      <Heading size="xl" mb={6}>
        Update Your Information
      </Heading>

      <Tabs colorScheme="blue" variant="enclosed">
        <TabList>
          <Tab>Upload Transactions</Tab>
          <Tab>Update Goals</Tab>
          <Tab>Update Income</Tab>
          <Tab>View Transactions</Tab>
        </TabList>

        <TabPanels>
          {/* Upload Transactions Tab */}
          <TabPanel>
            <Card>
              <CardBody>
                <VStack spacing={6} align="stretch">
                  <Box>
                    <Heading size="md" mb={4}>
                      Upload Bank Statement CSV
                    </Heading>
                    <Text color="gray.600" mb={4}>
                      Upload your bank statement to import transactions automatically
                    </Text>
                  </Box>

                  <FormControl>
                    <FormLabel>Select CSV File</FormLabel>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      style={{ display: "none" }}
                      id="file-upload-update"
                    />
                    <label htmlFor="file-upload-update">
                      <Button
                        as="span"
                        leftIcon={<AttachmentIcon />}
                        colorScheme="blue"
                        variant="outline"
                        w="full"
                        cursor="pointer"
                      >
                        Choose File
                      </Button>
                    </label>
                  </FormControl>

                  {file && (
                    <Alert status="success" borderRadius="md">
                      <AlertIcon as={CheckCircleIcon} />
                      <Text fontSize="sm">Selected: {file.name}</Text>
                    </Alert>
                  )}

                  <Button
                    leftIcon={<AttachmentIcon />}
                    onClick={handleUploadCSV}
                    colorScheme="blue"
                    size="lg"
                    isLoading={uploading}
                    isDisabled={!file}
                    loadingText={progress > 0 ? `Processing... ${progress}%` : "Uploading..."}
                  >
                    Upload CSV
                  </Button>

                  <Text fontSize="xs" color="gray.500">
                    Supported format: TD Bank CSV. Your data is encrypted and secure.
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          </TabPanel>

          {/* Update Goals Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Card>
                <CardBody>
                  <Heading size="md" mb={4}>
                    Add New Goal
                  </Heading>
                  <VStack spacing={4}>
                    <FormControl isRequired>
                      <FormLabel>Goal Name</FormLabel>
                      <Input
                        placeholder="e.g., Emergency Fund"
                        value={newGoal.goal_name}
                        onChange={(e) => setNewGoal({ ...newGoal, goal_name: e.target.value })}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Goal Type</FormLabel>
                      <Select
                        value={newGoal.goal_type}
                        onChange={(e) => setNewGoal({ ...newGoal, goal_type: e.target.value })}
                      >
                        <option value="">Select type...</option>
                        <option value="savings">Savings</option>
                        <option value="debt">Debt Payoff</option>
                        <option value="investment">Investment</option>
                        <option value="other">Other</option>
                      </Select>
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>Target Amount ($)</FormLabel>
                      <Input
                        type="number"
                        placeholder="5000"
                        value={newGoal.target_amount}
                        onChange={(e) => setNewGoal({ ...newGoal, target_amount: e.target.value })}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Target Date</FormLabel>
                      <Input
                        type="date"
                        value={newGoal.target_date}
                        onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
                      />
                    </FormControl>

                    <Button
                      leftIcon={<AddIcon />}
                      colorScheme="blue"
                      w="full"
                      onClick={handleAddGoal}
                    >
                      Add Goal
                    </Button>
                  </VStack>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <Heading size="md" mb={4}>
                    Your Goals
                  </Heading>
                  {loadingGoals ? (
                    <Text>Loading...</Text>
                  ) : goals.length === 0 ? (
                    <Text color="gray.500">No goals yet. Add your first goal above!</Text>
                  ) : (
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Name</Th>
                          <Th>Type</Th>
                          <Th isNumeric>Target Amount</Th>
                          <Th>Target Date</Th>
                          <Th>Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {goals.map((goal) => (
                          <Tr key={goal.id}>
                            <Td>{goal.goal_name}</Td>
                            <Td>{goal.goal_type || "N/A"}</Td>
                            <Td isNumeric>${goal.target_amount}</Td>
                            <Td>{goal.target_date || "N/A"}</Td>
                            <Td>
                              <IconButton
                                aria-label="Delete goal"
                                icon={<DeleteIcon />}
                                size="sm"
                                colorScheme="red"
                                variant="ghost"
                                onClick={() => handleDeleteGoal(goal.id)}
                              />
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  )}
                </CardBody>
              </Card>
            </VStack>
          </TabPanel>

          {/* Update Income Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Card>
                <CardBody>
                  <Heading size="md" mb={4}>
                    Add New Income Source
                  </Heading>
                  <VStack spacing={4}>
                    <FormControl isRequired>
                      <FormLabel>Source Name</FormLabel>
                      <Input
                        placeholder="e.g., Salary, Freelance"
                        value={newIncome.source_name}
                        onChange={(e) => setNewIncome({ ...newIncome, source_name: e.target.value })}
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>Amount ($)</FormLabel>
                      <Input
                        type="number"
                        placeholder="5000"
                        value={newIncome.amount}
                        onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })}
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>Frequency</FormLabel>
                      <Select
                        value={newIncome.frequency}
                        onChange={(e) => setNewIncome({ ...newIncome, frequency: e.target.value })}
                      >
                        <option value="weekly">Weekly</option>
                        <option value="bi-weekly">Bi-weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </Select>
                    </FormControl>

                    <Button
                      leftIcon={<AddIcon />}
                      colorScheme="blue"
                      w="full"
                      onClick={handleAddIncome}
                    >
                      Add Income Source
                    </Button>
                  </VStack>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <Heading size="md" mb={4}>
                    Your Income Sources
                  </Heading>
                  {loadingIncome ? (
                    <Text>Loading...</Text>
                  ) : incomeSources.length === 0 ? (
                    <Text color="gray.500">No income sources yet. Add your first one above!</Text>
                  ) : (
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Source Name</Th>
                          <Th isNumeric>Amount</Th>
                          <Th>Frequency</Th>
                          <Th>Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {incomeSources.map((income) => (
                          <Tr key={income.id}>
                            <Td>{income.source_name}</Td>
                            <Td isNumeric>${income.amount}</Td>
                            <Td>{income.frequency}</Td>
                            <Td>
                              <IconButton
                                aria-label="Delete income source"
                                icon={<DeleteIcon />}
                                size="sm"
                                colorScheme="red"
                                variant="ghost"
                                onClick={() => handleDeleteIncome(income.id)}
                              />
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  )}
                </CardBody>
              </Card>
            </VStack>
          </TabPanel>

          {/* View Transactions Tab */}
          <TabPanel>
            <Card>
              <CardBody>
                <HStack justify="space-between" mb={4}>
                  <Heading size="md">Your Transactions</Heading>
                  <Text color="gray.600" fontSize="sm">
                    {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
                  </Text>
                </HStack>

                {loadingTransactions ? (
                  <Center py={8}>
                    <Text>Loading transactions...</Text>
                  </Center>
                ) : transactions.length === 0 ? (
                  <Alert status="info">
                    <AlertIcon />
                    <Box>
                      <Text fontWeight="semibold">No transactions yet</Text>
                      <Text fontSize="sm">
                        Upload a CSV file or connect your bank account to see transactions here.
                      </Text>
                    </Box>
                  </Alert>
                ) : (
                  <Box maxH="600px" overflowY="auto" borderWidth={1} borderRadius="md" borderColor="gray.200">
                    <Table variant="simple" size="sm">
                      <Thead position="sticky" top={0} bg="white" zIndex={1}>
                        <Tr>
                          <Th>Date</Th>
                          <Th>Description</Th>
                          <Th>Category</Th>
                          <Th isNumeric>Amount</Th>
                          <Th isNumeric>Balance</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {transactions.map((transaction, index) => (
                          <Tr key={transaction.id || index} _hover={{ bg: "gray.50" }}>
                            <Td whiteSpace="nowrap">{formatDate(transaction.date)}</Td>
                            <Td>
                              <VStack align="start" spacing={0}>
                                <Text fontWeight="medium" noOfLines={1}>
                                  {transaction.name}
                                </Text>
                                {transaction.merchantName && transaction.merchantName !== transaction.name && (
                                  <Text fontSize="xs" color="gray.500" noOfLines={1}>
                                    {transaction.merchantName}
                                  </Text>
                                )}
                              </VStack>
                            </Td>
                            <Td>
                              <Text fontSize="xs" noOfLines={1}>
                                {transaction.personalFinanceCategory?.primary?.replace(/_/g, ' ') || 
                                 transaction.category?.[0] || 
                                 'Other'}
                              </Text>
                            </Td>
                            <Td isNumeric>
                              <Text 
                                color={getTransactionColor(transaction)} 
                                fontWeight="semibold"
                              >
                                ${transaction.amount?.toFixed(2) || '0.00'}
                              </Text>
                            </Td>
                            <Td isNumeric>
                              <Text fontSize="sm" color="gray.600">
                                {transaction.balance ? `$${transaction.balance.toFixed(2)}` : '-'}
                              </Text>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                )}

                {transactions.length > 0 && (
                  <HStack justify="space-between" mt={4}>
                    <Text fontSize="sm" color="gray.500">
                      Showing {transactions.length} most recent transactions
                    </Text>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={fetchTransactions}
                      isLoading={loadingTransactions}
                    >
                      Refresh
                    </Button>
                  </HStack>
                )}
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Container>
  );
};

export default UpdateInfo;

