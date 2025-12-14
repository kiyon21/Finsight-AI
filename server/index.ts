import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import * as ngrok from 'ngrok';
import { PlaidService } from './services/plaid.service';
import { PlaidController } from './controllers/plaid.controller';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { UserService } from './services/user.service';
import { UserController } from './controllers/user.controller';
import { TransactionService } from './services/transaction.service';
import { TransactionController } from './controllers/transaction.controller';
import { createPlaidRoutes } from './routes/plaid.routes';
import { createAuthRoutes } from './routes/auth.routes';
import { createUserRoutes } from './routes/user.routes';
import { createTransactionRoutes } from './routes/transaction.routes';
import { corsMiddleware } from './middleware/cors.middleware';
import { errorHandler } from './middleware/error.middleware';

dotenv.config();

const app = express();
const PORT = Number.isInteger(Number(process.env.PORT)) ? Number(process.env.PORT) : 8000;

let webhookUrl: string;

// Initialize server with ngrok tunnel
(async () => {
  try {
    webhookUrl = await ngrok.connect(PORT);
    console.log(`[Ngrok] Tunnel running: ${webhookUrl}`);

    // Initialize services and controllers
    const plaidService = new PlaidService(webhookUrl);
    const plaidController = new PlaidController(plaidService);
    
    const authService = new AuthService();
    const authController = new AuthController(authService);
    
    const userService = new UserService();
    const userController = new UserController(userService);

    const transactionService = new TransactionService();
    const transactionController = new TransactionController(transactionService, plaidService);

    // Apply middleware
    app.use(corsMiddleware);
    app.use(bodyParser.json());

    // Register routes
    app.use('/api/plaid', createPlaidRoutes(plaidController));
    app.use('/api/auth', createAuthRoutes(authController));
    app.use('/api/users', createUserRoutes(userController));
    app.use('/api/transactions', createTransactionRoutes(transactionController));

    // Error handling middleware (should be last)
    app.use(errorHandler);

    // Start server
    app.listen(PORT, () => {
      console.log(`[Server] Listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('[Server] Failed to start server:', error);
  }
})();
