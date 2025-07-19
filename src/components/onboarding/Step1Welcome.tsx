import React from "react";
import StepTemplate from "./StepTemplate";
import type { StepsProps } from "./StepTemplate";
import { Box, Text, VStack, Icon } from "@chakra-ui/react";
import { StarIcon } from "@chakra-ui/icons";

const Step1Welcome: React.FC<StepsProps> = ({ goNext }) => {
  return (
    <StepTemplate
      title="Welcome to Finsight AI!"
      description="Let's get you set up in just a few steps."
      goNext={goNext}
      showBackButton={false}
      nextButtonText="Get Started"
    >
      <VStack spacing={6} align="center" py={8}>
        <Text color="gray.600" fontSize={{ base: "md", md: "lg" }} textAlign="center" maxW="600px">
          This onboarding process will help you set up your account and customize your experience.
        </Text>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          p={{ base: 6, md: 8 }}
        >
          <Box
            rounded="full"
            bg="blue.50"
            p={{ base: 8, md: 12 }}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Icon as={StarIcon} w={{ base: 12, md: 16 }} h={{ base: 12, md: 16 }} color="blue.500" />
          </Box>
        </Box>
      </VStack>
    </StepTemplate>
  );
};

export default Step1Welcome;