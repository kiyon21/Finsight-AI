import React from 'react';
import { useEffect, useState } from 'react';
import { Box, Heading, Text, Container, VStack, Button } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { authAPI } from '../services/api';

const LandingPage = () => {
  const navigate = useNavigate();
  const [hasCompletedOnboarding, sethasCompletedOnboarding] = useState(false);

  useEffect(()=>{
    async function fetchOnboarding() {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      try {
        const userData = await authAPI.getUserData(user.uid);
        if(userData.hasCompletedOnboarding){
          sethasCompletedOnboarding(true)
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
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
          hasCompletedOnboarding ? navigate('/dashboard') : navigate('/onboarding')
        }}>
          Get Started
        </Button>
      </VStack>
    </Container>
  )
}

export default LandingPage 