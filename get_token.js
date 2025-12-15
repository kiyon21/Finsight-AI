// get_token.js
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Get Firebase config from environment variables
const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_MESSAGING_SENDER_ID || "788528500958",
    appId: process.env.VITE_APP_ID,
    measurementId: process.env.VITE_MEASUREMENT_ID || "G-WC97821145"
};

// Validate required config
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
    console.error('Error: Missing required Firebase configuration.');
    console.error('Please make sure your .env file contains:');
    console.error('  VITE_FIREBASE_API_KEY');
    console.error('  VITE_AUTH_DOMAIN');
    console.error('  VITE_FIREBASE_PROJECT_ID');
    console.error('  VITE_STORAGE_BUCKET');
    console.error('  VITE_APP_ID');
    process.exit(1);
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Get credentials from command line arguments or use defaults
const email = process.argv[2] || 'kiyonfarokhi@hotmail.com';
const password = process.argv[3] || 'password';

console.log(`Signing in as: ${email}`);
console.log('Getting Firebase ID token...\n');

// Sign in with credentials
signInWithEmailAndPassword(auth, email, password)
  .then((userCredential) => {
    return userCredential.user.getIdToken();
  })
  .then((token) => {
    console.log('='.repeat(60));
    console.log('Firebase ID Token:');
    console.log('='.repeat(60));
    console.log(token);
    console.log('='.repeat(60));
    console.log('\nUse this in your API request:');
    console.log(`Authorization: Bearer ${token}`);
    console.log('\nExample curl command:');
    console.log(`curl -X POST http://localhost:8001/api/ai/quick-insight/ \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -H "Authorization: Bearer ${token.substring(0, 50)}..." \\`);
    console.log(`  -d '{"user_id": "YOUR_USER_ID"}'`);
  })
  .catch((error) => {
    console.error('Error:', error.message);
    if (error.code === 'auth/user-not-found') {
      console.error('\nUser not found. Make sure the email is correct.');
    } else if (error.code === 'auth/wrong-password') {
      console.error('\nWrong password. Please check your credentials.');
    } else if (error.code === 'auth/invalid-email') {
      console.error('\nInvalid email format.');
    }
    process.exit(1);
  });