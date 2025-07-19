import React from "react";
import { useEffect, useState } from "react";
import axios from "axios";
import { usePlaidLink } from "react-plaid-link";
import { getAuth } from "firebase/auth";
import { doc, updateDoc, query,collection, where,getDocs } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import StepTemplate from "./StepTemplate";
import type { StepsProps } from "./StepTemplate";
import { Button, Alert, AlertDescription, Box, Stack, Text, AlertIcon, VStack } from "@chakra-ui/react";
import { LinkIcon } from "@chakra-ui/icons";



axios.defaults.baseURL = "http://localhost:8000"


const Step2PlaidUpload = ({goNext, goBack}: StepsProps) => {

    const [linkToken, setLinkToken] = useState('');
    const [publicToken, setPublicToken] = useState('');
    const [bankConnected, setBankConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
      async function fetch(){

        const response = await axios.post("/create_link_token");
        setLinkToken(await response.data.link_token);
        console.log("response ", (await response).data);

      }
      async function fetchUserData(){      
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;
  
        const q = query(collection(db, 'users'), where('uid', '==', user.uid));
        const querySnapshot = await getDocs(q);
        let accessToken = '';
        if(!querySnapshot.empty){
          const userData = querySnapshot.docs[0].data();
          accessToken = userData.accessToken;
        }
        if(accessToken != ''){
          setBankConnected(true);
        } else {
          setBankConnected(false);
        }
      }
      fetchUserData();
      if(!bankConnected) fetch();
    },[]);

    // runs after publicToken set
    useEffect(() => {

      async function fetchData(){
        // retrieve acccessToken
        let accessToken = await axios.post('/exchange_public_token',{public_token: publicToken});
        console.log('access token ', accessToken.data);

        // set current users bank account access token
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;

        const userRef = doc(db, "users", user.uid);
        try {
            await updateDoc(userRef, {
            accessToken: accessToken.data.accessToken,
          });

        setBankConnected(true);
        } catch (err: any){
            console.log(err.message);
        }
        // const auth = await axios.post('/auth', {access_token: accessToken.data.accessToken});
        // console.log('auth data', auth.data);
      }
  
      fetchData();
    }, [publicToken]);

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
          )}
        </VStack>
      </StepTemplate>
    );

};

export default Step2PlaidUpload;