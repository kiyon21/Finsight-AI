import { Box, Flex, Link, Heading, Button, HStack } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase/firebase'
import { useNavigate } from 'react-router-dom'

const Navbar = () => {

  const {currentUser} = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  }

  return (
    <Box bg="gray.800" px={4} py={4} boxShadow="md">
      <Flex maxW="1200px" mx="auto" justify="space-between" align="center">
        <Heading size="md" color="white">
          <Link as={RouterLink} to="/" _hover={{ textDecoration: 'none' }}>
            Finsight AI
          </Link>
        </Heading>
        <HStack spacing={8}>
          <Link as={RouterLink} to="/" color="white" _hover={{ color: 'blue.300' }}>
            Home
          </Link>
          <Link as={RouterLink} to="/dashboard" color="white" _hover={{ color: 'blue.300' }}>
            Dashboard
          </Link>
          <Link as={RouterLink} to="/analysis" color="white" _hover={{ color: 'blue.300' }}>
            Analysis
          </Link>
          <Button as={RouterLink} to="/auth" colorScheme="blue" size="sm" onClick={currentUser ? handleLogout : () => navigate('/auth')}>
            {currentUser ? "Log Out" : "Sign In"}
          </Button>
        </HStack>
      </Flex>
    </Box>
  )
}

export default Navbar 