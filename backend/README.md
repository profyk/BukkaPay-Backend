# BukkaPay Backend

Express.js REST API backend for BukkaPay wallet application with PostgreSQL database.

## Tech Stack

- **Node.js** - Runtime
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **PostgreSQL** - Database
- **Drizzle ORM** - Type-safe database toolkit
- **Stripe** - Payment processing
- **Supabase** - Authentication & database

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL database

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database and API credentials
```

### Development

```bash
# Start development server with hot reload
npm run dev

# Type check
npm run type-check
```

### Production Build

```bash
# Build TypeScript to JavaScript
npm run build

# Start production server
npm start
```

## Project Structure

```
backend/
├── db/                  # Database connection and client
├── shared/              # Shared schema and types
├── dist/                # Compiled JavaScript (generated)
├── index.ts            # Express server entry point
├── routes.ts           # API route definitions
├── storage.ts          # Database repository layer
├── auth.ts             # Authentication logic
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
└── .env.example        # Environment template
```

## API Endpoints

All endpoints require Bearer token authentication in the `Authorization` header.

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Wallet & Cards
- `GET /api/cards` - Get user's wallet cards
- `POST /api/cards` - Create new card
- `PATCH /api/cards/:id/balance` - Update card balance

### Transactions
- `GET /api/transactions` - Get transaction history
- `POST /api/transactions` - Create transaction

### Transfers & Payments
- `POST /api/transfer` - Transfer between users
- `POST /api/receive` - Receive payment

## Database Schema

Database schema is defined in `shared/schema.ts` using Drizzle ORM.

Tables include:
- users
- wallet_cards
- transactions
- contacts
- payment_requests
- merchants
- properties & tenants (rental system)
- gift_cards
- contributions
- And more...

## Environment Variables

Required for local development and Railway deployment:

```
DATABASE_URL              # PostgreSQL connection string
EXTERNAL_DATABASE_URL     # Alternative database URL (Neon)
SUPABASE_URL             # Supabase project URL
SUPABASE_ANON_KEY        # Supabase anonymous key
STRIPE_SECRET_KEY        # Stripe secret key
PORT                     # Server port (default: 5000)
NODE_ENV                 # Environment (development/production)
```

## Deployment

### Railway

1. Connect GitHub repository
2. Set environment variables in Railway dashboard
3. Deploy automatically on push

Build command: `npm run build`
Start command: `npm start`

## License

MIT
