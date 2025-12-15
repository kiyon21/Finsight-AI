# Server Architecture

This server follows a clean architecture pattern with separation of concerns.

## Folder Structure

```
server/
├── config/           # Configuration files
│   ├── firebase.config.ts
│   └── plaid.config.ts
├── controllers/      # Request/Response handlers
│   ├── auth.controller.ts
│   ├── plaid.controller.ts
│   └── user.controller.ts
├── middleware/       # Express middleware
│   ├── cors.middleware.ts
│   └── error.middleware.ts
├── routes/          # Route definitions
│   ├── auth.routes.ts
│   ├── plaid.routes.ts
│   └── user.routes.ts
├── services/        # Business logic
│   ├── auth.service.ts
│   ├── plaid.service.ts
│   └── user.service.ts
├── types/           # TypeScript type definitions
│   ├── admin.d.ts
│   └── index.ts
└── index.ts         # Server entry point
```

## Layers

### Config (`/config`)
Contains configuration for external services and dependencies.
- **firebase.config.ts**: Firebase Admin SDK configuration
- **plaid.config.ts**: Plaid API client configuration
- **redis.config.ts**: Redis client configuration for caching
- **rabbitmq.config.ts**: RabbitMQ connection configuration

### Services (`/services`)
Contains business logic and external API interactions.
- **auth.service.ts**: User authentication and management (Firebase Admin)
- **plaid.service.ts**: Plaid-related business logic (tokens, accounts, transactions)
- **user.service.ts**: User data management (goals, income sources)
- **transaction.service.ts**: Transaction data management (CRUD operations, analytics)
- **ai-insight.service.ts**: AI insight storage and retrieval
- **cache.service.ts**: Redis caching layer for improved performance

### Controllers (`/controllers`)
Handles HTTP requests and responses. Controllers call services and return responses.
- **auth.controller.ts**: Authentication endpoints (register, login verification, user data)
- **plaid.controller.ts**: Plaid integration endpoints
- **user.controller.ts**: User data endpoints (goals, income)

### Middleware (`/middleware`)
Express middleware for cross-cutting concerns.
- **cors.middleware.ts**: CORS configuration
- **error.middleware.ts**: Global error handling

### Routes (`/routes`)
Defines API endpoints and maps them to controllers.
- **auth.routes.ts**: `/api/auth` - Authentication routes
- **plaid.routes.ts**: `/api/plaid` - Plaid integration routes
- **user.routes.ts**: `/api/users` - User data routes

### Types (`/types`)
Shared TypeScript interfaces and types.
- **admin.d.ts**: Firebase Admin type declarations
- **index.ts**: Shared interfaces

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - **Create new user account** (Creates Firebase Auth user + Firestore profile, returns custom token)
- `POST /initialize-profile` - Initialize Firestore profile for existing Auth user (Google sign-in)
- `GET /user/:uid` - Get user profile data
- `PUT /user/:uid` - Update user profile
- `POST /user/plaid-token` - Update user's Plaid access token
- `POST /user/complete-onboarding` - Mark user onboarding as complete
- `POST /verify-token` - Verify Firebase ID token
- `DELETE /user/:uid` - Delete user account

**Registration Flow:**
1. Frontend calls `POST /auth/register` with email & password
2. Backend creates user in Firebase Auth using Admin SDK
3. Backend creates Firestore user document
4. Backend generates & returns custom token
5. Frontend signs in with custom token automatically

### User Data (`/api/users`)
**Goals:**
- `POST /:uid/goals` - Create new goal
- `GET /:uid/goals` - Get all user goals
- `PUT /:uid/goals/:goalId` - Update goal
- `DELETE /:uid/goals/:goalId` - Delete goal

**Income:**
- `POST /:uid/income` - Add income source
- `GET /:uid/income` - Get all income sources
- `PUT /:uid/income/:incomeId` - Update income source
- `DELETE /:uid/income/:incomeId` - Delete income source

### Transactions (`/api/transactions`)
**Transaction Management:**
- `POST /:uid/transactions` - Add single transaction
- `GET /:uid/transactions` - Get all transactions from BOTH collections (supports limit, startDate, endDate query params)
- `GET /:uid/transactions/category/:category` - Get transactions by category
- `PUT /:uid/transactions/:transactionId` - Update transaction
- `DELETE /:uid/transactions/:transactionId` - Delete transaction
- `DELETE /:uid/transactions` - Delete all transactions

**Analytics:**
- `GET /:uid/spending/summary` - Get spending summary by category
- `GET /:uid/spending/total` - Get total spending for period

**Data Sources:**
- `POST /:uid/transactions/sync-plaid` - Sync transactions from Plaid (saves to `plaidTransactions` collection)
- `POST /:uid/transactions/upload-csv` - Upload CSV bank statement (async processing via RabbitMQ)

**Job Management:**
- `GET /jobs/:jobId` - Get job status
- `GET /:uid/jobs` - Get user's processing jobs

**Collections:**
- `plaidTransactions` - Transactions synced from Plaid
- `uploadedTransactions` - Transactions uploaded via CSV files
- Both collections are merged when fetching via GET endpoints

**Async Processing:**
- CSV uploads are processed asynchronously using RabbitMQ
- Jobs are tracked in Firestore `jobs` collection
- Worker process consumes jobs from queue
- Frontend polls job status for progress updates

### Plaid Integration (`/api/plaid`)
- `POST /link/token/create` - Create Plaid Link token
- `POST /create_link_token` - Create simple link token
- `POST /exchange_public_token` - Exchange public token
- `POST /accounts/get` - Get linked accounts
- `POST /auth` - Get account authentication data
- `POST /transactions/enrich` - Enrich transaction data
- `POST /sandbox/item/fire_webhook` - Fire sandbox webhook
- `POST /webhook` - Plaid webhook handler

## Data Models

### User Document
Stored in Firestore: `users/{uid}`

```typescript
{
  uid: string;
  email: string;
  hasCompletedOnboarding: boolean;
  createdAt: string;
  accessToken?: string;        // Plaid access token
  balance?: number;            // Current account balance
  balanceUpdated?: string;     // Date of most recent transaction (ISO format)
}
```

**Balance Tracking:**
- Updated automatically when CSV is uploaded
- Extracted from first entry (most recent transaction) in CSV
- Date reflects the transaction date from CSV

## Architecture Benefits

- **Separation of Concerns**: Each layer has a single responsibility
- **Security**: Firebase operations moved to server-side with Admin SDK
- **Testability**: Services and controllers can be easily unit tested
- **Maintainability**: Easy to find and modify specific functionality
- **Scalability**: Simple to add new features without cluttering code
- **Type Safety**: Full TypeScript support with proper types

## Adding New Features

1. **Add business logic** → Create/update service in `/services`
2. **Add request handler** → Create/update controller in `/controllers`
3. **Add endpoint** → Create/update routes in `/routes`
4. **Add middleware** → Create middleware in `/middleware`
5. **Add configuration** → Update or create config in `/config`

## Example Flow

```
Client Request (Frontend)
    ↓
API Route (e.g., /api/auth/register)
    ↓
Route Handler (auth.routes.ts)
    ↓
Controller (auth.controller.ts)
    ↓
Service (auth.service.ts)
    ↓
External API/Database (Firebase Admin, Firestore)
    ↓
Response back through layers to client
```

## Caching with Redis

The server uses Redis to cache frequently accessed data, reducing Firebase reads and improving response times.

### Setup

1. **Install Redis** (if not already installed):
   ```bash
   # macOS
   brew install redis
   brew services start redis
   
   # Linux
   sudo apt-get install redis-server
   sudo systemctl start redis
   ```

2. **Configure Redis URL** (optional):
   Add to your `.env` file:
   ```env
   REDIS_URL=redis://localhost:6379
   ```
   Defaults to `redis://localhost:6379` if not specified.

### Cached Data

The following data is cached with automatic invalidation:
- **Transactions**: Cached for 30 minutes
- **Spending summaries**: Cached for 30 minutes
- **User data**: Cached for 1 hour
- **Goals**: Cached for 1 hour
- **Income sources**: Cached for 1 hour
- **AI insights**: Cached for 1 hour

### Cache Invalidation

Cache is automatically invalidated when data changes:
- Adding/updating/deleting transactions
- Adding/updating/deleting goals
- Adding/updating/deleting income sources
- Saving new AI insights
- Updating user data

### Graceful Degradation

If Redis is unavailable, the server continues to function normally by fetching directly from Firebase. Cache failures are logged but don't interrupt requests.

## Security Notes

- All Firebase operations use Firebase Admin SDK (server-side only)
- User authentication state managed client-side with Firebase Auth
- Data operations require valid user context
- Plaid webhooks secured with ngrok tunnel in development
- Environment variables used for sensitive configuration

