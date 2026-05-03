# Team Task Manager

## Prerequisites
- Node.js 18+
- MongoDB running locally (mongodb://localhost:27017) OR set MONGO_URI in .env

## Setup
1. Clone repo
2. `cp .env.example .env` and fill in values
3. `npm run install:all`
4. `npm run seed`
5. `npm run dev`


## Scripts
- `npm run dev`          → starts client (5173) + server (5000) concurrently
- `npm run seed`         → drops & reseeds MongoDB with demo data
- `npm run build`        → builds React client for production
- `npm run install:all`  → installs root + server + client dependencies
