import React from "react";
import { Button, Card, CardHeader, CardBody, CardFooter, Heading, Text, Stack, Box } from "@chakra-ui/react";

// Define StepsProps here to avoid import errors
export interface StepsProps {
  goNext: () => void;
  goBack?: () => void;
}

interface StepTemplateProps extends StepsProps {
  title: string;
  description?: string;
  showBackButton?: boolean;
  nextButtonText?: string;
  backButtonText?: string;
  isNextDisabled?: boolean;
}

const StepTemplate: React.FC<StepTemplateProps & { children?: React.ReactNode }> = ({
  title,
  description,
  children,
  goNext,
  goBack,
  showBackButton = true,
  nextButtonText = "Next",
  backButtonText = "Back",
  isNextDisabled = false,
}) => {
  return (
    <Card maxW={{ base: "100%", md: "4xl" }} mx="auto" my={{ base: 4, md: 8 }} w="100%">
      <CardHeader>
        <Heading size={{ base: "md", md: "lg" }} mb={2}>{title}</Heading>
        {description && <Text color="gray.600" fontSize={{ base: "sm", md: "md" }}>{description}</Text>}
      </CardHeader>
      
      <CardBody>
        {children}
      </CardBody>
      
      <CardFooter>
        <Stack direction="row" spacing={4} w="100%" justify="space-between">
          {goBack && showBackButton ? (
            <Button 
              variant="outline" 
              onClick={goBack}
              fontSize={{ base: "sm", md: "md" }}
              px={{ base: 4, md: 8 }}
            >
              {backButtonText}
            </Button>
          ) : <Box />}
        
        <Button 
          onClick={goNext} 
          isDisabled={isNextDisabled}
          colorScheme="teal"
          fontSize={{ base: "sm", md: "md" }}
          px={{ base: 4, md: 8 }}
        >
          {nextButtonText}
        </Button>
        </Stack>
      </CardFooter>
    </Card>
  );
};

export default StepTemplate;