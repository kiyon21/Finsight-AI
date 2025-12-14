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
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';

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

      // Validate password length
      if (password.length < 6) {
        toast({
          title: 'Password too short',
          description: 'Password must be at least 6 characters',
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
        return
      }

      // Create user via backend (handles Auth + Firestore + auto sign-in)
      await authService.register(email, password);
      
      // show toast message
      toast({
        title: 'Account Created!',
        description: 'Welcome to Finsight AI',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })

      navigate('/onboarding');
    }
    catch (err:any) {
      console.error('Registration error:', err);
      
      // Handle specific error messages
      let errorMessage = 'Unable to create account';
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }

      toast({
        title: 'Registration Failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // sign in with email and password
      const user = await authService.login(email, password);
      
      // show toast message
      toast({
        title: 'Log In Successful!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })

      // Get user data from backend
      const userData = await authService.getUserData(user.uid);
      
      if(userData.hasCompletedOnboarding){
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    } catch (err:any) {
      console.log('error signing in');
      console.error(err.message);
      toast({
        title: 'Login Failed',
        description: err.message || 'Invalid credentials',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      const user = await authService.loginWithGoogle();
      
      toast({
        title: 'Google Sign In Successful!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })

      // Get user data from backend
      const userData = await authService.getUserData(user.uid);
      
      if(userData.hasCompletedOnboarding){
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    } catch (err:any) {
      console.error('Google sign-in error:', err);
    toast({
        title: 'Google Sign In Failed',
        description: err.message || 'Unable to sign in with Google',
        status: 'error',
      duration: 3000,
      isClosable: true,
    })
    }
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
