import { Navigate } from "react-router-dom";
import {useAuth} from '../context/AuthContext'
import { Center, Spinner, VStack } from "@chakra-ui/react";


export default function PrivateRoute ({children}: {children: JSX.Element} ) {
    const {currentUser, loading} = useAuth();

    // check if still loading
    if (loading) {
        return (
          <Center h="100vh">
            <VStack spacing={4}>
              <Spinner size="xl" />
              <h1>Checking login status...</h1>
            </VStack>
          </Center>
        );
      }
    

    return currentUser ? children : <Navigate to="/" />
}
