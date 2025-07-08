import { useState } from 'react'
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  Divider,
  useToast,
  InputGroup,
  InputRightElement,
  IconButton,
} from '@chakra-ui/react'
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons'
import { auth, googleProvider } from '../firebase/firebase'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  signInWithPopup
} from "firebase/auth";
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, getDoc, addDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const toast = useToast()
  const navigate = useNavigate();


  // handles creating account
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // check if password and confirm password match
      if (password !== confirmPassword) {
        toast({
          title: 'Passwords do not match',
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
        return
      }
      // create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // add user to firestore
      try{
        await addDoc(collection(db, 'users', user.uid), {
          uid: user.uid,
          email: email,
          hasCompletedOnboarding: false,
          createdAt: new Date().toISOString(),
        })
        // show toast message
        toast({
          title: 'Account Created!',
          description: 'Please log in to continue to Finsight AI',
          status: 'info',
          duration: 3000,
          isClosable: true,
        })
      } catch (err:any) {
        console.log('error adding user to firestore');
        console.error(err.message);
      }

      // login user
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/onboarding');
    }
    catch (err:any) {
      console.log('error creating user');
      console.error(err.message)
    }

  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement authentication logic
    try {
      // sign in with email and password
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      // show toast message
      toast({
        title: 'Log In Successful!',
        status: 'info',
        duration: 3000,
        isClosable: true,
      })
      const q = query(collection(db, 'users'), where('uid', '==', user.uid));
      const querySnapshot = await getDocs(q);
      let hasCompletedOnboarding = false;
      if(!querySnapshot.empty){
        const userData = querySnapshot.docs[0].data();
        hasCompletedOnboarding = userData.hasCompletedOnboarding;
      }
      if(hasCompletedOnboarding){
        navigate('/home');
      } else {
        navigate('/onboarding');
      }
    } catch (err:any) {
      console.log('error signing in');
      console.error(err.message);
    }
  }

  const handleGoogleSignIn = () => {
    // TODO: Implement Google sign-in
    toast({
      title: 'Coming soon',
      description: 'Google sign-in will be implemented soon!',
      status: 'info',
      duration: 3000,
      isClosable: true,
    })
  }

  return (
    <Container maxW="md" py={12}>
      <VStack spacing={8}>
        <Heading size="xl">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </Heading>
        <Box w="100%" p={8} borderWidth={1} borderRadius="lg" boxShadow="lg">
          <form onSubmit={isLogin ? handleSubmit : handleCreateAccount}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Password</FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                      variant="ghost"
                      onClick={() => setShowPassword(!showPassword)}
                    />
                  </InputRightElement>
                </InputGroup>
                </FormControl>
                {!isLogin && (
                <FormControl isRequired>
                  <FormLabel>Confirm Password</FormLabel>
                <InputGroup>
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      icon={showConfirmPassword ? <ViewOffIcon /> : <ViewIcon />}
                      variant="ghost"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    />
                  </InputRightElement>
                </InputGroup>
                </FormControl>
                )}
              <Button
                type="submit"
                colorScheme="blue"
                width="100%"
                size="lg"
              >
                {isLogin ? 'Sign In' : 'Create Account'}
              </Button>
            </VStack>
          </form>

          <Divider my={6} />

          <VStack spacing={4}>
            <Button
              width="100%"
              variant="outline"
              onClick={handleGoogleSignIn}
              leftIcon={
                <img
                  src="https://www.google.com/favicon.ico"
                  alt="Google"
                  width="20"
                  height="20"
                />
              }
            >
              Continue with Google
            </Button>

            <Text textAlign="center" mt={4}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <Button
                variant="link"
                colorScheme="blue"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? 'Create one' : 'Sign in'}
              </Button>
            </Text>
          </VStack>
        </Box>
      </VStack>
    </Container>
  )
}

export default Auth
