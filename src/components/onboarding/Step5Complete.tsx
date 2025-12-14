import React from "react";
import type { StepsProps } from "../../pages/Onboarding";
import StepTemplate from "./StepTemplate";
import { getAuth } from "firebase/auth";
import { authAPI } from "../../services/api";
import { useNavigate } from "react-router-dom";
import { Box, Text, VStack, Icon, Alert, AlertIcon, useToast } from "@chakra-ui/react";
import { CheckCircleIcon } from "@chakra-ui/icons";

const Step5Complete = ({goNext, goBack}: StepsProps) => {

    const navigate = useNavigate();
    const toast = useToast();

    const handleFinish = async () => {
        
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;

        try {
            await authAPI.completeOnboarding(user.uid);
            navigate('/dashboard');
        } catch (err: any){
            console.error('Error completing onboarding:', err);
            toast({
              title: "Error completing onboarding",
              description: "Please try again.",
              status: "error",
              duration: 3000,
              isClosable: true,
            });
        }
    }

    return (
        <StepTemplate
          title="Onboarding Complete!"
          description="Congratulations! You've successfully set up your financial profile."
          goNext={handleFinish}
          goBack={goBack}
          nextButtonText="Get Started"
          backButtonText="Back"
        >
          <VStack spacing={6} align="center" py={8}>
            <Alert status="success" borderRadius="lg" fontSize={{ base: "sm", md: "md" }}>
              <AlertIcon />
              <Box>
                <Text fontWeight="medium" fontSize={{ base: "md", md: "lg" }}>
                  Profile Setup Complete!
                </Text>
                <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600">
                  Your financial goals and income sources have been saved successfully.
                </Text>
              </Box>
            </Alert>
            
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              p={{ base: 6, md: 8 }}
            >
              <Box
                rounded="full"
                bg="green.50"
                p={{ base: 8, md: 12 }}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Icon as={CheckCircleIcon} w={{ base: 12, md: 16 }} h={{ base: 12, md: 16 }} color="green.500" />
              </Box>
            </Box>
            
            <Text color="gray.600" fontSize={{ base: "md", md: "lg" }} textAlign="center" maxW="600px">
              You're all set! Click "Get Started" to begin exploring your personalized financial insights and start working towards your goals.
            </Text>
          </VStack>
        </StepTemplate>
      );
};

export default Step5Complete;