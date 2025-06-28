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

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const toast = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement authentication logic
    toast({
      title: 'Coming soon',
      description: 'Authentication will be implemented soon!',
      status: 'info',
      duration: 3000,
      isClosable: true,
    })
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
          <form onSubmit={handleSubmit}>
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
