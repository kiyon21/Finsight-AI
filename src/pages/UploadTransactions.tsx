import React, { useState } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Button,
  useToast,
  Icon,
  Alert,
  AlertIcon,
  Card,
  CardBody,
} from "@chakra-ui/react";
import { AttachmentIcon, CheckCircleIcon } from "@chakra-ui/icons";
import { transactionsAPI } from "../services/api";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const UploadTransactions = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processingJobId, setProcessingJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const toast = useToast();
  const auth = getAuth();
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const pollJobStatus = async (jobId: string) => {
    const maxAttempts = 60; // Poll for up to 60 seconds
    let attempts = 0;

    const poll = setInterval(async () => {
      try {
        const status = await transactionsAPI.getJobStatus(jobId);
        
        setProgress(status.progress || 0);

        if (status.status === 'completed') {
          clearInterval(poll);
          
          const message = status.modifiedTransactions 
            ? `${status.addedTransactions} new, ${status.modifiedTransactions} updated`
            : `${status.addedTransactions} transactions imported`;
          
          toast({
            title: 'Processing complete!',
            description: message,
            status: 'success',
            duration: 5000,
          });
          
          // Navigate to dashboard after successful processing
          setTimeout(() => {
            navigate('/dashboard');
          }, 1500);
        } else if (status.status === 'failed') {
          clearInterval(poll);
          setUploading(false);
          toast({
            title: 'Processing failed',
            description: status.error || 'An error occurred during processing',
            status: 'error',
            duration: 5000,
          });
        }

        attempts++;
        if (attempts >= maxAttempts) {
          clearInterval(poll);
          setUploading(false);
          toast({
            title: 'Processing timeout',
            description: 'The job is still processing. Please check back later.',
            status: 'warning',
            duration: 5000,
          });
        }
      } catch (err) {
        console.error('Error polling job status:', err);
      }
    }, 1000); // Poll every second
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: 'No file selected',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      toast({
        title: 'Please log in',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const result = await transactionsAPI.uploadCSV(user.uid, file);
      
      toast({
        title: 'Upload accepted!',
        description: 'Your file is being processed...',
        status: 'info',
        duration: 3000,
      });

      // Start polling for job status
      setProcessingJobId(result.jobId);
      await pollJobStatus(result.jobId);
      
    } catch (err: any) {
      toast({
        title: 'Upload failed',
        description: err.response?.data?.error || 'An error occurred',
        status: 'error',
        duration: 5000,
      });
      console.error(err);
      setUploading(false);
    }
  };

  return (
    <Container maxW="2xl" py={12}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading size="xl" mb={4}>
            Upload Your Transactions
          </Heading>
          <Text color="gray.600" fontSize="lg">
            Get started by uploading your bank statement CSV file
          </Text>
        </Box>

        <Alert status="info" borderRadius="lg">
          <AlertIcon />
          <Box>
            <Text fontWeight="semibold">No transactions found</Text>
            <Text fontSize="sm">
              Upload a CSV file to see your financial insights, or connect your bank account through Plaid.
            </Text>
          </Box>
        </Alert>

        <Card variant="outline" boxShadow="lg">
          <CardBody>
            <VStack spacing={6}>
              <Icon as={AttachmentIcon} w={16} h={16} color="blue.500" />
              
              <VStack spacing={2}>
                <Text fontWeight="semibold" fontSize="lg">
                  Upload Bank Statement
                </Text>
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  Accepted format: CSV (TD Bank format)
                </Text>
              </VStack>

              <Box w="full">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button
                    as="span"
                    leftIcon={<AttachmentIcon />}
                    colorScheme="blue"
                    variant="outline"
                    w="full"
                    cursor="pointer"
                  >
                    Choose File
                  </Button>
                </label>
              </Box>

              {file && (
                <Alert status="success" borderRadius="md">
                  <AlertIcon as={CheckCircleIcon} />
                  <Text fontSize="sm">Selected: {file.name}</Text>
                </Alert>
              )}

              <Button
                leftIcon={<AttachmentIcon />}
                onClick={handleUpload}
                colorScheme="blue"
                size="lg"
                w="full"
                isLoading={uploading}
                isDisabled={!file}
                loadingText={progress > 0 ? `Processing... ${progress}%` : 'Uploading...'}
              >
                Upload & Continue
              </Button>

              <Text fontSize="xs" color="gray.500" textAlign="center">
                Your data is encrypted and secure. We never store your credentials.
              </Text>
            </VStack>
          </CardBody>
        </Card>

        <Button
          variant="link"
          colorScheme="gray"
          onClick={() => navigate('/dashboard')}
        >
          Skip for now
        </Button>
      </VStack>
    </Container>
  );
};

export default UploadTransactions;

