import React, { useEffect, useState } from "react";
import type { StepsProps } from "../../pages/Onboarding";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  NumberInput,
  NumberInputField,
  Switch,
  Stack,
  Heading,
  useToast,
  Textarea,
  Text,
  Divider,
  VStack,
  HStack,
  IconButton,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { AddIcon, DeleteIcon, EditIcon } from "@chakra-ui/icons";
import { getAuth } from "firebase/auth";
import { addIncomeSource, deleteIncomeSource } from "../../firebase/incomeService";
import type { IncomeSourceData } from "../../firebase/incomeService";
import { collection, doc, getDocs } from "firebase/firestore";
import { db } from "../../firebase/firebase";

const incomeTypes = [
  { value: "Salary", label: "Salary" },
  { value: "Freelance", label: "Freelance" },
  { value: "Passive", label: "Passive Income" },
  { value: "Benefits", label: "Benefits" },
  { value: "Other", label: "Other" },
];

const frequencies = [
  { value: "Weekly", label: "Weekly" },
  { value: "Biweekly", label: "Bi-weekly" },
  { value: "Monthly", label: "Monthly" },
  { value: "Yearly", label: "Yearly" },
  { value: "OneTime", label: "One Time" },
  { value: "Irregular", label: "Irregular" },
];

const stabilities = [
  { value: "Stable", label: "Stable" },
  { value: "Seasonal", label: "Seasonal" },
  { value: "Irregular", label: "Irregular" },
];

const confidenceRatings = [
  { value: 1, label: "1 - Very Uncertain" },
  { value: 2, label: "2 - Uncertain" },
  { value: 3, label: "3 - Neutral" },
  { value: 4, label: "4 - Confident" },
  { value: 5, label: "5 - Very Confident" },
];

const currencies = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
  { value: "CAD", label: "CAD (C$)" },
  { value: "AUD", label: "AUD (A$)" },
];


const Step4Income = ({ goNext, goBack }: StepsProps) => {
  const auth = getAuth();
  const user = auth.currentUser;
  const toast = useToast();

  const [incomeSources, setIncomeSources] = useState<IncomeSourceData[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const emptyIncomeSource: IncomeSourceData = {
    id: "",
    sourceName: "",
    type: "",
    amount: "",
    currency: "USD",
    frequency: "",
    startDate: "",
    endDate: "",
    isTaxed: false,
    estimatedTaxRate: "",
    stability: "",
    confidenceRating: "",
    notes: "",
    isPrimary: false,
  };

  const [currentIncomeSource, setCurrentIncomeSource] = useState<IncomeSourceData>(emptyIncomeSource);

  useEffect(()=>{
    const fetchIncomeSources = async () =>{
      if(!user){
        console.error('User not logged In');
        return;
      }
      try {
        const userId = user.uid;
        const goalsRef = collection(doc(db, 'users', userId), 'income');
        const snapshot = await getDocs(goalsRef);
        if (snapshot && !snapshot.empty) {
          const goalsList: IncomeSourceData[] = snapshot.docs.map(doc => ({
            ...(doc.data() as Omit<IncomeSourceData, 'income_id'>),
            income_id: doc.id
          }));
          setIncomeSources(goalsList);
        }
      } catch (error) {
        console.error('error fetching Goals', error);
      }
    }
    fetchIncomeSources();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentIncomeSource((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (name: string, valueAsString: string, valueAsNumber: number) => {
    setCurrentIncomeSource((prev) => ({ ...prev, [name]: valueAsString }));
  };

  const handleSwitch = (name: string, checked: boolean) => {
    setCurrentIncomeSource((prev) => ({ ...prev, [name]: checked }));
  };

  const handleAddIncomeSource = () => {
    if (incomeSources.length >= 10) {
      toast({
        title: "Maximum income sources reached",
        description: "You can add up to 10 income sources.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Validation
    if (!currentIncomeSource.sourceName || !currentIncomeSource.type || !currentIncomeSource.amount || 
        !currentIncomeSource.frequency || !currentIncomeSource.startDate || !currentIncomeSource.stability) {
      toast({
        title: "Please fill in all required fields.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const newIncomeSource = {
      ...currentIncomeSource,
      id: editingId || Date.now().toString(),
    };

    if (editingId) {
      // Update existing
      setIncomeSources(prev => prev.map(source => 
        source.id === editingId ? newIncomeSource : source
      ));
      setEditingId(null);
    } else {
      // Add new
      setIncomeSources(prev => [...prev, newIncomeSource]);
    }

    setCurrentIncomeSource(emptyIncomeSource);
    setIsAdding(false);

    toast({
      title: editingId ? "Income Source Updated!" : "Income Source Added!",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const handleEdit = (incomeSource: IncomeSourceData) => {
    setCurrentIncomeSource(incomeSource);
    setEditingId(incomeSource.id);
    setIsAdding(true);
  };

  const handleDelete = async (incomeId: string) => {
        try {
          if (user) {
            await deleteIncomeSource(user.uid, incomeId);
            // Remove from local state
            setIncomeSources(prev => prev.filter(source => source.id !== incomeId));

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

  const handleCancel = () => {
    setCurrentIncomeSource(emptyIncomeSource);
    setEditingId(null);
    setIsAdding(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (incomeSources.length === 0) {
      toast({
        title: "Please add at least one income source.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }


        // Save each income source to db
        try{
          if(!user) return;
          incomeSources.forEach( async (incomeSource) => {
            if (user) await addIncomeSource(user.uid,incomeSource);
            // show toast message
            toast({
              title: 'Goals Set!',
              status: 'info',
              duration: 3000,
              isClosable: true,
            })
          });
        } catch (err:any) {
          console.log('error adding goal to firestore');
          console.error(err.message);
        }
        goNext();

    // TODO: Save income sources data to Firebase or context
    toast({
      title: "Income Sources Saved!",
      status: "success",
      duration: 3000,
      isClosable: true,
    });

    goNext();
  };

  if (!user) return null;

  return (
    <Box maxW={{ base: "100%", md: "4xl" }} mx="auto" mt={{ base: 4, md: 8 }} p={{ base: 2, md: 8 }} borderWidth={1} borderRadius="lg" boxShadow="lg" bg="white" w="100%">
      <Heading size={{ base: "sm", md: "md" }} mb={{ base: 4, md: 6 }} textAlign="left">Manage Your Income Sources</Heading>
      <VStack spacing={{ base: 4, md: 6 }} align="stretch" w="100%">
        {/* Income Sources List */}
        <Box>
          <Flex justify="space-between" align="center" mb={4}>
            <Text fontWeight="semibold" color="gray.700">
              Income Sources ({incomeSources.length}/10)
            </Text>
            {!isAdding && incomeSources.length < 10 && (
              <Button
                leftIcon={<AddIcon />}
                colorScheme="teal"
                size="sm"
                onClick={() => setIsAdding(true)}
              >
                Add Income Source
              </Button>
            )}
          </Flex>

          {incomeSources.length === 0 && !isAdding && (
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Text>No income sources added yet. Click "Add Income Source" to get started.</Text>
            </Alert>
          )}

          <VStack spacing={3} align="stretch" w="100%">
            {incomeSources.map((source) => (
              <Card key={source.id} variant="outline" w="100%">
                <CardBody>
                  <Flex justify="space-between" align="center">
                    <Box flex={1}>
                      <HStack spacing={2} mb={2}>
                        <Text fontWeight="semibold">{source.sourceName}</Text>
                        {source.isPrimary && (
                          <Badge colorScheme="green" size="sm">Primary</Badge>
                        )}
                        <Badge colorScheme="blue" size="sm">{source.type}</Badge>
                      </HStack>
                      <Text fontSize="sm" color="gray.600">
                        {source.amount} {source.currency} • {source.frequency} • {source.stability}
                      </Text>
                      {source.notes && (
                        <Text fontSize="sm" color="gray.500" mt={1}>
                          {source.notes}
                        </Text>
                      )}
                    </Box>
                    <HStack spacing={2}>
                      <IconButton
                        aria-label="Edit income source"
                        icon={<EditIcon />}
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(source)}
                      />
                      <IconButton
                        aria-label="Delete income source"
                        icon={<DeleteIcon />}
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => handleDelete(source.id)}
                      />
                    </HStack>
                  </Flex>
                </CardBody>
              </Card>
            ))}
          </VStack>
        </Box>

        {/* Add/Edit Form */}
        {isAdding && (
          <Box borderWidth={1} borderRadius="lg" p={6} bg="gray.50">
            <Heading size={{ base: "xs", md: "sm" }} mb={{ base: 2, md: 4 }}>
              {editingId ? "Edit Income Source" : "Add New Income Source"}
            </Heading>
            <form onSubmit={(e) => { e.preventDefault(); handleAddIncomeSource(); }}>
              <Stack spacing={6}>
                {/* Responsive: stack vertically on mobile, horizontally on desktop */}
                {/* Basic Information */}
                <Box>
                  <Text fontWeight="semibold" mb={4} color="gray.700">Basic Information</Text>
                  <Stack spacing={4}>
                    <FormControl isRequired>
                      <FormLabel>Income Source Name</FormLabel>
                      <Input
                        name="sourceName"
                        placeholder="e.g. Full-time Job, Freelance Work, Rental Income"
                        value={currentIncomeSource.sourceName}
                        onChange={handleChange}
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>Income Type</FormLabel>
                      <Select
                        name="type"
                        placeholder="Select income type"
                        value={currentIncomeSource.type}
                        onChange={handleChange}
                      >
                        {incomeTypes.map((type) => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </Select>
                    </FormControl>

                    <Stack direction={{ base: "column", md: "row" }} spacing={4}>
                      <FormControl isRequired>
                        <FormLabel>Amount</FormLabel>
                        <NumberInput
                          min={0}
                          value={currentIncomeSource.amount}
                          onChange={(valueAsString, valueAsNumber) => handleNumberChange("amount", valueAsString, valueAsNumber)}
                        >
                          <NumberInputField name="amount" placeholder="e.g. 5000" />
                        </NumberInput>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Currency</FormLabel>
                        <Select
                          name="currency"
                          value={currentIncomeSource.currency}
                          onChange={handleChange}
                        >
                          {currencies.map((currency) => (
                            <option key={currency.value} value={currency.value}>{currency.label}</option>
                          ))}
                        </Select>
                      </FormControl>
                    </Stack>

                    <FormControl isRequired>
                      <FormLabel>Frequency</FormLabel>
                      <Select
                        name="frequency"
                        placeholder="Select frequency"
                        value={currentIncomeSource.frequency}
                        onChange={handleChange}
                      >
                        {frequencies.map((freq) => (
                          <option key={freq.value} value={freq.value}>{freq.label}</option>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>
                </Box>

                <Divider />

                {/* Timeline */}
                <Box>
                  <Text fontWeight="semibold" mb={4} color="gray.700">Timeline</Text>
                  <Stack spacing={4}>
                    <FormControl isRequired>
                      <FormLabel>Start Date</FormLabel>
                      <Input
                        name="startDate"
                        type="date"
                        value={currentIncomeSource.startDate}
                        onChange={handleChange}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>End Date (Optional)</FormLabel>
                      <Input
                        name="endDate"
                        type="date"
                        value={currentIncomeSource.endDate}
                        onChange={handleChange}
                      />
                    </FormControl>
                  </Stack>
                </Box>

                <Divider />

                {/* Tax Information */}
                <Box>
                  <Text fontWeight="semibold" mb={4} color="gray.700">Tax Information</Text>
                  <Stack spacing={4}>
                    <FormControl display="flex" alignItems="center">
                      <FormLabel htmlFor="isTaxed" mb="0">
                        Is this income taxed?
                      </FormLabel>
                      <Switch
                        id="isTaxed"
                        isChecked={currentIncomeSource.isTaxed}
                        onChange={(e) => handleSwitch("isTaxed", e.target.checked)}
                        colorScheme="teal"
                      />
                    </FormControl>

                    {currentIncomeSource.isTaxed && (
                      <FormControl>
                        <FormLabel>Estimated Tax Rate (%)</FormLabel>
                        <NumberInput
                          min={0}
                          max={100}
                          value={currentIncomeSource.estimatedTaxRate}
                          onChange={(valueAsString, valueAsNumber) => handleNumberChange("estimatedTaxRate", valueAsString, valueAsNumber)}
                        >
                          <NumberInputField name="estimatedTaxRate" placeholder="e.g. 25" />
                        </NumberInput>
                      </FormControl>
                    )}
                  </Stack>
                </Box>

                <Divider />

                {/* Stability & Confidence */}
                <Box>
                  <Text fontWeight="semibold" mb={4} color="gray.700">Stability & Confidence</Text>
                  <Stack spacing={4}>
                    <FormControl isRequired>
                      <FormLabel>Income Stability</FormLabel>
                      <Select
                        name="stability"
                        placeholder="Select stability level"
                        value={currentIncomeSource.stability}
                        onChange={handleChange}
                      >
                        {stabilities.map((stab) => (
                          <option key={stab.value} value={stab.value}>{stab.label}</option>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Confidence Rating</FormLabel>
                      <Select
                        name="confidenceRating"
                        placeholder="How confident are you in this income?"
                        value={currentIncomeSource.confidenceRating}
                        onChange={handleChange}
                      >
                        {confidenceRatings.map((rating) => (
                          <option key={rating.value} value={rating.value}>{rating.label}</option>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl display="flex" alignItems="center">
                      <FormLabel htmlFor="isPrimary" mb="0">
                        Primary Income Source
                      </FormLabel>
                      <Switch
                        id="isPrimary"
                        isChecked={currentIncomeSource.isPrimary}
                        onChange={(e) => handleSwitch("isPrimary", e.target.checked)}
                        colorScheme="teal"
                      />
                    </FormControl>
                  </Stack>
                </Box>

                <Divider />

                {/* Notes */}
                <Box>
                  <FormControl>
                    <FormLabel>Additional Notes</FormLabel>
                    <Textarea
                      name="notes"
                      placeholder="Any additional information about this income source..."
                      value={currentIncomeSource.notes}
                      onChange={handleChange}
                      rows={3}
                    />
                  </FormControl>
                </Box>

                <HStack spacing={4} justify="flex-end">
                  <Button variant="outline" onClick={handleCancel} fontSize={{ base: "sm", md: "md" }} px={{ base: 4, md: 8 }}>
                    Cancel
                  </Button>
                  <Button colorScheme="teal" type="submit" fontSize={{ base: "sm", md: "md" }} px={{ base: 4, md: 8 }}>
                    {editingId ? "Update" : "Add"} Income Source
                  </Button>
                </HStack>
              </Stack>
            </form>
          </Box>
        )}

        {/* Navigation */}
        <Stack direction="row" spacing={4} pt={4} justify="flex-end">
          <Button variant="outline" onClick={goBack} fontSize={{ base: "sm", md: "md" }} px={{ base: 4, md: 8 }}>
            Back
          </Button>
          <Button colorScheme="teal" onClick={goNext} isDisabled={incomeSources.length === 0} fontSize={{ base: "sm", md: "md" }} px={{ base: 4, md: 8 }}>
            Next
          </Button>
        </Stack>
      </VStack>
    </Box>
  );
};

export default Step4Income;