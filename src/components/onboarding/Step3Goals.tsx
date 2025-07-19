import React, { useEffect, useState } from "react";
import type { StepsProps } from "../../pages/Onboarding";
import StepTemplate from "./StepTemplate";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  NumberInput,
  NumberInputField,
  Switch,
  Stack,
  Heading,
  useToast,
  VStack,
  Flex,
  Text,
  Card,
  CardBody,
  HStack,
  IconButton,
} from "@chakra-ui/react";
import { getAuth } from "firebase/auth";
import { addGoal, deleteGoal } from "../../firebase/goalService";
import type { Goal as BaseGoal } from "../../firebase/goalService";
import { collection, doc, getDocs } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { AddIcon, DeleteIcon } from "@chakra-ui/icons";


// constants for goal interface
const goalTypes = [
  { value: "SAVINGS", label: "Savings" },
  { value: "DEBT_REPAYMENT", label: "Debt Repayment" },
  { value: "INVESTMENT", label: "Investment" },
  { value: "PURCHASE", label: "Purchase" },
  { value: "EMERGENCY_FUND", label: "Emergency Fund" },
];

const priorityLevels = [
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
];

// Extend Goal type to include goal_id for Firestore mapping
type Goal = BaseGoal & { goal_id: string };

const Step3Goals = ({ goNext, goBack }: StepsProps) => {
  const auth = getAuth();
  const user = auth.currentUser;
  const toast = useToast();

  const [goal, setGoal] = useState<Goal>({
    goal_id: "",
    goal_name: "",
    goal_type: "",
    goal_description: "",
    target_amount: "",
    current_amount: "",
    target_date: "",
    monthly_contribution: "",
    priority_level: "",
  });

  // if user has set a goal yet
  const [userSetGoal, setUserSetGoal] = useState(false);
  const [userGoals, setUserGoals] = useState<Goal[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setGoal((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (name: string, valueAsString: string, valueAsNumber: number) => {
    setGoal((prev) => ({ ...prev, [name]: valueAsString }));
  };

  useEffect(()=>{
    const fetchUserGoals = async () =>{
      if(!user){
        console.error('User not logged In');
        return;
      }
      try {
        const userId = user.uid;
        const goalsRef = collection(doc(db, 'users', userId), 'goals');
        const snapshot = await getDocs(goalsRef);
        if (snapshot && !snapshot.empty) {
          const goalsList: Goal[] = snapshot.docs.map(doc => ({
            ...(doc.data() as Omit<Goal, 'goal_id'>),
            goal_id: doc.id
          }));
          setUserGoals(goalsList);
          setUserSetGoal(true);
        }
      } catch (error) {
        console.error('error fetching Goals', error);
      }
    }
    fetchUserGoals();
  }, [user]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validation
    if (!goal.goal_name || !goal.goal_type || !goal.target_amount || !goal.target_date || !goal.priority_level) {
      toast({
        title: "Please fill in all required fields.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    // Pass goal data to goNext
    // TODO: Save goal data to context or parent state before proceeding
    try{
      if (user) {
        const goalId = await addGoal(user.uid, goal);
        // Add the new goal to the list with the actual Firestore ID
        const newGoal = { ...goal, goal_id: goalId };
        setUserGoals(prev => [...prev, newGoal]);
      }
      // show toast message
      toast({
        title: 'Goals Set!',
        status: 'info',
        duration: 3000,
        isClosable: true,
      })
      setUserSetGoal(true);
      // Reset form
      setGoal({
        goal_id: "",
        goal_name: "",
        goal_type: "",
        goal_description: "",
        target_amount: "",
        current_amount: "",
        target_date: "",
        monthly_contribution: "",
        priority_level: "",
      });
      setIsAdding(false);
    } catch (err:any) {
      console.log('error adding goal to firestore');
      console.error(err.message);
      toast({
        title: "Error adding goal",
        description: "Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
 
  };
 
  const handleAddAnotherGoal = () => {
    setIsAdding(true);
  };
 
  const handleCancelAdd = () => {
    setIsAdding(false);
    setGoal({
      goal_id: "",
      goal_name: "",
      goal_type: "",
      goal_description: "",
      target_amount: "",
      current_amount: "",
      target_date: "",
      monthly_contribution: "",
      priority_level: "",
    });
  };
 
  const handleDeleteGoal = async (goalId: string) => {
    try {
      if (user) {
        await deleteGoal(user.uid, goalId);
        // Remove from local state
        setUserGoals(prev => prev.filter(g => g.goal_id !== goalId));
        toast({
          title: "Goal Removed",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast({
        title: "Error removing goal",
        description: "Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (!user) return null;

  return !userSetGoal ? (
    <StepTemplate
      title="Set Your First Financial Goal"
      description="Let's start by setting up your first financial goal."
      goNext={goNext}
      goBack={goBack}
      isNextDisabled={false}
    >
      <form onSubmit={handleSubmit}>
        <Stack spacing={{ base: 3, md: 4 }}>
          <FormControl isRequired>
            <FormLabel>Goal Name</FormLabel>
            <Input
              name="goal_name"
              placeholder="e.g. Save for Wedding"
              value={goal.goal_name}
              onChange={handleChange}
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Goal Type</FormLabel>
            <Select
              name="goal_type"
              placeholder="Select type"
              value={goal.goal_type}
              onChange={handleChange}
            >
              {goalTypes.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel>Goal Description</FormLabel>
            <Textarea
              name="goal_description"
              placeholder="Add notes about your goal (optional)"
              value={goal.goal_description}
              onChange={handleChange}
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Target Amount</FormLabel>
            <NumberInput
              min={0}
              value={goal.target_amount}
              onChange={(valueAsString, valueAsNumber) => handleNumberChange("target_amount", valueAsString, valueAsNumber)}
            >
              <NumberInputField name="target_amount" placeholder="e.g. 10000" />
            </NumberInput>
          </FormControl>

          <FormControl>
            <FormLabel>Current Amount</FormLabel>
            <NumberInput
              min={0}
              value={goal.current_amount}
              onChange={(valueAsString, valueAsNumber) => handleNumberChange("current_amount", valueAsString, valueAsNumber)}
            >
              <NumberInputField name="current_amount" placeholder="e.g. 2000" />
            </NumberInput>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Target Date</FormLabel>
            <Input
              name="target_date"
              type="date"
              value={goal.target_date}
              onChange={handleChange}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Monthly Contribution</FormLabel>
            <NumberInput
              min={0}
              value={goal.monthly_contribution}
              onChange={(valueAsString, valueAsNumber) => handleNumberChange("monthly_contribution", valueAsString, valueAsNumber)}
            >
              <NumberInputField name="monthly_contribution" placeholder="e.g. 500" />
            </NumberInput>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Priority Level</FormLabel>
            <Select
              name="priority_level"
              placeholder="Select priority"
              value={goal.priority_level}
              onChange={handleChange}
            >
              {priorityLevels.map((level) => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </Select>
          </FormControl>

        </Stack>
      </form>
    </StepTemplate>
  ) : (
    <StepTemplate
      title="Your Financial Goals"
      description="Manage and add your financial goals."
      goNext={goNext}
      goBack={goBack}
      isNextDisabled={userGoals.length === 0}
    >
      <VStack spacing={4} align="stretch">
        {/* Goals List */}
        <Box>
          <Flex justify="space-between" align="center" mb={4}>
            <Text fontWeight="semibold" color="gray.700">
              Goals ({userGoals.length})
            </Text>
            {!isAdding && (
              <Button
                leftIcon={<AddIcon />}
                colorScheme="teal"
                size="sm"
                onClick={handleAddAnotherGoal}
              >
                Add Another Goal
              </Button>
            )}
          </Flex>
 
        <Stack spacing={4}>
          {userGoals.length === 0 ? (
            <Box p={4} bg="gray.50" borderRadius="md" textAlign="center">No goals found.</Box>
          ) : (
            userGoals.map(goal => (
              <Card key={goal.goal_id} variant="outline" w="100%">
                <CardBody>
                  <Flex justify="space-between" align="center">
                    <Box flex={1}>
                      <Stack direction={{ base: "column", md: "row" }} spacing={4} align="flex-start" justify="space-between">
                        <Box>
                          <Heading size="sm" mb={1}>{goal.goal_name}</Heading>
                          <Box fontSize="sm" color="gray.600">{goal.goal_type}</Box>
                          {goal.goal_description && <Box fontSize="xs" color="gray.500" mt={1}>{goal.goal_description}</Box>}
                        </Box>
                        <Box textAlign={{ base: "left", md: "right" }}>
                          <Box fontWeight="bold">Target: {goal.target_amount}</Box>
                          <Box fontSize="sm">By: {goal.target_date}</Box>
                        </Box>
                      </Stack>
                    </Box>
                    <HStack spacing={2}>
                      <IconButton
                        aria-label="Delete goal"
                        icon={<DeleteIcon />}
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => handleDeleteGoal(goal.goal_id)}
                      />
                    </HStack>
                  </Flex>
                </CardBody>
              </Card>
            ))
          )}
        </Stack>
        </Box>
 
        {/* Add New Goal Form */}
        {isAdding && (
          <Box borderWidth={1} borderRadius="lg" p={6} bg="gray.50">
            <Heading size={{ base: "xs", md: "sm" }} mb={{ base: 2, md: 4 }}>
              Add New Goal
            </Heading>
            <form onSubmit={handleSubmit}>
              <Stack spacing={{ base: 3, md: 4 }}>
                <FormControl isRequired>
                  <FormLabel>Goal Name</FormLabel>
                  <Input
                    name="goal_name"
                    placeholder="e.g. Save for Wedding"
                    value={goal.goal_name}
                    onChange={handleChange}
                  />
                </FormControl>
 
                <FormControl isRequired>
                  <FormLabel>Goal Type</FormLabel>
                  <Select
                    name="goal_type"
                    placeholder="Select type"
                    value={goal.goal_type}
                    onChange={handleChange}
                  >
                    {goalTypes.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </Select>
                </FormControl>
 
                <FormControl>
                  <FormLabel>Goal Description</FormLabel>
                  <Textarea
                    name="goal_description"
                    placeholder="Add notes about your goal (optional)"
                    value={goal.goal_description}
                    onChange={handleChange}
                  />
                </FormControl>
 
                <FormControl isRequired>
                  <FormLabel>Target Amount</FormLabel>
                  <NumberInput
                    min={0}
                    value={goal.target_amount}
                    onChange={(valueAsString, valueAsNumber) => handleNumberChange("target_amount", valueAsString, valueAsNumber)}
                  >
                    <NumberInputField name="target_amount" placeholder="e.g. 10000" />
                  </NumberInput>
                </FormControl>
 
                <FormControl>
                  <FormLabel>Current Amount</FormLabel>
                  <NumberInput
                    min={0}
                    value={goal.current_amount}
                    onChange={(valueAsString, valueAsNumber) => handleNumberChange("current_amount", valueAsString, valueAsNumber)}
                  >
                    <NumberInputField name="current_amount" placeholder="e.g. 2000" />
                  </NumberInput>
                </FormControl>
 
                <FormControl isRequired>
                  <FormLabel>Target Date</FormLabel>
                  <Input
                    name="target_date"
                    type="date"
                    value={goal.target_date}
                    onChange={handleChange}
                  />
                </FormControl>
 
                <FormControl>
                  <FormLabel>Monthly Contribution</FormLabel>
                  <NumberInput
                    min={0}
                    value={goal.monthly_contribution}
                    onChange={(valueAsString, valueAsNumber) => handleNumberChange("monthly_contribution", valueAsString, valueAsNumber)}
                  >
                    <NumberInputField name="monthly_contribution" placeholder="e.g. 500" />
                  </NumberInput>
                </FormControl>
 
                <FormControl isRequired>
                  <FormLabel>Priority Level</FormLabel>
                  <Select
                    name="priority_level"
                    placeholder="Select priority"
                    value={goal.priority_level}
                    onChange={handleChange}
                  >
                    {priorityLevels.map((level) => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </Select>
                </FormControl>
 
                <HStack spacing={4} justify="flex-end">
                  <Button variant="outline" onClick={handleCancelAdd} fontSize={{ base: "sm", md: "md" }} px={{ base: 4, md: 8 }}>
                    Cancel
                  </Button>
                  <Button colorScheme="teal" type="submit" fontSize={{ base: "sm", md: "md" }} px={{ base: 4, md: 8 }}>
                    Add Goal
                  </Button>
                </HStack>
              </Stack>
            </form>
          </Box>
        )}
 
      </VStack>
    </StepTemplate>
  );
};

export default Step3Goals;