# Real-Time Bidding System

A complete, production-grade Real-Time Bidding (RTB) system built with:
- **Frontend**: React (Vite) + Tailwind CSS + Socket.io Client
- **Backend**: Node.js + Express + PostgreSQL + Redis + Socket.io
- **Concurrency**: Guaranteed safe bidding via **PostgreSQL Row-Level Locks** (`SELECT ... FOR UPDATE`).
- **Real-Time**: Low-latency Socket.io integrated with Redis Pub/Sub for horizontal scalability.

## Prerequisites
- Docker
- Docker Compose

## Quick Start (Run Locally)

1. **Start the system**:
   ```bash
   docker-compose up --build
   ```

2. **Access the Application**:
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:5000](http://localhost:5000)

3. **Seed the Database**:
   Open a new terminal and run:
   ```bash
   docker-compose exec backend npm run seed
   ```
   *(This creates the default Admin and Dealer test accounts).*

## Test Accounts

- **Admin Account**: 
  - Email: `admin@example.com`
  - Password: `password`
- **Dealer Accounts**: 
  - Email: `dealer@example.com` / `dealer2@example.com`
  - Password: `password`

## How to Test Real-Time Concurrency

1. Open **[localhost:3000](http://localhost:3000)** and log in as an **Admin** (`admin@example.com`).
2. Create a new auction (e.g., "Vintage Watch", Start Price: $100) and click **Start Auction**.
3. Open two separate **Incognito windows** (or different browsers).
4. Log into window #1 as `dealer@example.com` and window #2 as `dealer2@example.com`.
5. Both dealers click on the active auction to join the live room.
6. Submit bids simultaneously from both windows. 
7. **Observation**: 
   - The PostgreSQL row-level lock ensures that no race conditions occur. 
   - Only valid bids higher than the *dynamic* current price will be accepted.
   - The UI updates instantly via `Socket.io` broadcasting.

## API Documentation

### Auth
- `POST /api/auth/register` - Create user `(name, email, password, role)`
- `POST /api/auth/login` - Login user `(email, password)` -> Returns JWT

### Auctions
- `GET /api/auctions` - List auctions
- `GET /api/auctions/:id` - Get auction details & latest bids
- `POST /api/auctions` - Create auction (Admin only)
- `POST /api/auctions/:id/start` - Start auction (Admin only)
- `POST /api/auctions/:id/close` - Close auction (Admin only)

### Bidding (Concurrency Safe)
- `POST /api/auctions/:id/bid` - Place a bid (Dealer only). Requires `{ amount }`.

## Architecture Details
- **Transaction Safety**: The `/bid` endpoint initiates a `BEGIN` transaction, selects the auction row `FOR UPDATE`, validates the status and amount, inserts the bid, updates the price, and `COMMIT`s.
- **Microservices Ready**: Redis is used as a Pub/Sub adapter for Socket.io, allowing you to run multiple backend instances behind a load balancer without dropping websocket messages.
