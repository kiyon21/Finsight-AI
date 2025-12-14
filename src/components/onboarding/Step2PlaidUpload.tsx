import React from "react";
import { useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { getAuth } from "firebase/auth";
import StepTemplate from "./StepTemplate";
import type { StepsProps } from "./StepTemplate";
import { Button, Alert, AlertDescription, Box, Stack, Text, AlertIcon, VStack } from "@chakra-ui/react";
import { LinkIcon } from "@chakra-ui/icons";
import { plaidAPI, authAPI } from "../../services/api";


const Step2PlaidUpload = ({goNext, goBack}: StepsProps) => {

    const [linkToken, setLinkToken] = useState('');
    const [publicToken, setPublicToken] = useState('');
    const [bankConnected, setBankConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
      async function fetch(){
        const linkToken = await plaidAPI.createLinkToken();
        setLinkToken(linkToken);
      }
      
      async function fetchUserData(){      
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;
  
        try {
          const userData = await authAPI.getUserData(user.uid);
          const accessToken = userData.accessToken || '';
          
        if(accessToken != ''){
          setBankConnected(true);
        } else {
            setBankConnected(false);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setBankConnected(false);
        }
      }
      
      fetchUserData();
      if(!bankConnected) fetch();
    },[]);

    // runs after publicToken set
    useEffect(() => {
      async function fetchData(){
        if (!publicToken) return;
        
        // retrieve accessToken
        const response = await plaidAPI.exchangePublicToken(publicToken);
        console.log('access token: ', response.accessToken);

        // set current users bank account access token
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;

        try {
          await authAPI.updatePlaidToken(user.uid, response.accessToken);
        setBankConnected(true);
        } catch (err: any){
          console.error('Error updating Plaid token:', err.message);
        }
      }
  
      if (!bankConnected && publicToken) fetchData();
    }, [publicToken, bankConnected]);

    const { open, ready } = usePlaidLink({
      token: linkToken,
      onSuccess: (public_token, metadata) => {
        setPublicToken(public_token);
        console.log('success', public_token, metadata);
      },
    });

    return (
      <StepTemplate
        title="Connect Your Bank Account"
        description="Let's securely connect your financial accounts using Plaid."
        goNext={goNext}
        goBack={goBack}
        isNextDisabled={!bankConnected}
      >
        <VStack spacing={6} align="stretch" py={{ base: 4, md: 6 }}>
          <Text color="gray.600" mb={4} fontSize={{ base: "sm", md: "md" }}>
            We use Plaid to securely connect to thousands of banks. Your credentials are never stored on our servers.
          </Text>
          {/* Error handling can be added here with Chakra's Alert if needed */}
          {bankConnected ? (
            <Alert status="success" borderRadius="md" fontSize={{ base: "sm", md: "md" }}>
              <AlertIcon />
              <Box>
                <Text fontWeight="medium" fontSize={{ base: "md", md: "lg" }}>Successfully connected!</Text>
                <Text fontSize={{ base: "xs", md: "sm" }} color="gray.600">
                  Your accounts have been linked. Click Next to continue.
                </Text>
              </Box>
            </Alert>
          ) : (
            <Stack spacing={3}>
            <Button
              w="full"
              variant="outline"
              onClick={() => open()}
              isDisabled={!ready}
              leftIcon={<LinkIcon />}
              fontSize={{ base: "sm", md: "md" }}
              py={{ base: 5, md: 6 }}
            >
              {!ready ? "Connecting..." : "Connect with Plaid"}
            </Button>
              <Button
                w="full"
                variant="ghost"
                onClick={goNext}
                fontSize={{ base: "sm", md: "md" }}
                color="gray.600"
              >
                Skip for now
              </Button>
            </Stack>
          )}
        </VStack>
      </StepTemplate>
    );

};

export default Step2PlaidUpload;