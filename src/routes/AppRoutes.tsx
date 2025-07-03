import { Spinner, Center, Box } from "@chakra-ui/react";
import { useAuth } from "../context/AuthContext";
import { Routes, Route } from "react-router-dom";
import PrivateRoute from "../routes/PrivateRoute";
import Navbar from "../components/Navbar";
import Home from "../pages/Home";
import Auth from "../pages/Auth";
import LandingPage from "../pages/LandingPage";

export default function AppRoutes() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Box minH="100vh">
      <Navbar />
      <Box p={4}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/home"
            element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            }
          />
        </Routes>
      </Box>
    </Box>
  );
}
