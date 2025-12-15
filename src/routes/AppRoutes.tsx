import { Spinner, Center, Box } from "@chakra-ui/react";
import { useAuth } from "../context/AuthContext";
import { Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import Navbar from "../components/Navbar";
import Dashboard from "../pages/Dashboard";
import UploadTransactions from "../pages/UploadTransactions";
import UpdateInfo from "../pages/UpdateInfo";
import Transactions from "../pages/Transactions";
import Auth from "../pages/Auth";
import LandingPage from "../pages/LandingPage";
import Onboarding from "../pages/Onboarding";
import AIInsights from "../pages/AIInsights";

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
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/upload-transactions"
            element={
              <PrivateRoute>
                <UploadTransactions />
              </PrivateRoute>
            }
          />
          <Route
            path="/onboarding"
            element={
              <PrivateRoute>
                <Onboarding />
              </PrivateRoute>
            }
          />
          <Route
            path="/updateInfo"
            element={
              <PrivateRoute>
                <UpdateInfo />
              </PrivateRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <PrivateRoute>
                <Transactions />
              </PrivateRoute>
            }
          />
          <Route
            path="/ai-insights"
            element={
              <PrivateRoute>
                <AIInsights />
              </PrivateRoute>
            }
          />
          {/* Redirect old /home route to /dashboard */}
          <Route path="/home" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Box>
    </Box>
  );
}
