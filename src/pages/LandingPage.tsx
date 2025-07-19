import React from 'react';
import { useEffect, useState } from 'react';
import { Box, Heading, Text, Container, VStack, Button } from '@chakra-ui/react';
import {  useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { doc, setDoc, getDoc, addDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';


const LandingPage = () => {
  const navigate = useNavigate();
  const [hasCompletedOnboarding, sethasCompletedOnboarding] = useState(false);

  useEffect(()=>{
    async function fetchOnboarding() {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const q = query(collection(db, 'users'), where('uid', '==', user.uid));
      const querySnapshot = await getDocs(q);
      let hasCompletedOnboarding = false;
      if(!querySnapshot.empty){
        const userData = querySnapshot.docs[0].data();
        hasCompletedOnboarding = userData.hasCompletedOnboarding;
      }
      if(hasCompletedOnboarding){
        sethasCompletedOnboarding(true)
      }
    }
    fetchOnboarding();
  },[]);


  return (
    <Container maxW="1200px" py={8} px={4}>
      <VStack spacing={12} align="center" py={16}>
        <Heading 
          as="h1" 
          size="3xl" 
          bgGradient="linear(to-r, blue.400, purple.500)" 
          bgClip="text"
          textAlign="center"
          lineHeight="1.2"
        >
          Welcome to Finsight AI
        </Heading>
        <Text fontSize="2xl" color="gray.600" textAlign="center" maxW="800px">
          Your intelligent financial companion for smarter investment decisions
        </Text>
        <Button size="lg" colorScheme="blue" px={8} onClick={()=>{
          hasCompletedOnboarding ? navigate('/home') : navigate('/onboarding')
        }}>
          Get Started
        </Button>
      </VStack>
    </Container>
  )
}

export default LandingPage 