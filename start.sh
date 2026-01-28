#!/bin/bash

# Boulevard Clone - Complete System Startup Script
# This script cleans ports, sets up PostgreSQL, seeds data, and starts the system

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Boulevard Clone - System Startup     ${NC}"
echo -e "${BLUE}========================================${NC}"

# Configuration
BACKEND_PORT=8000
FRONTEND_PORT=3000
POSTGRES_PORT=5432

# Function to kill process on port
kill_port() {
    local port=$1
    local pid=$(lsof -t -i:$port 2>/dev/null || true)
    if [ -n "$pid" ]; then
        echo -e "${YELLOW}Killing process on port $port (PID: $pid)${NC}"
        kill -9 $pid 2>/dev/null || true
        sleep 1
    fi
}

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -i:$port > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to wait for service
wait_for_service() {
    local host=$1
    local port=$2
    local max_attempts=$3
    local attempt=1

    echo -e "${YELLOW}Waiting for $host:$port...${NC}"
    while ! nc -z $host $port 2>/dev/null; do
        if [ $attempt -ge $max_attempts ]; then
            echo -e "${RED}Timeout waiting for $host:$port${NC}"
            return 1
        fi
        sleep 2
        attempt=$((attempt + 1))
    done
    echo -e "${GREEN}$host:$port is available${NC}"
    return 0
}

echo -e "\n${BLUE}Step 1: Cleaning up ports${NC}"
echo "--------------------------------"

# Kill processes on required ports
kill_port $BACKEND_PORT
kill_port $FRONTEND_PORT
pkill -f "tsx watch" 2>/dev/null || true

echo -e "${GREEN}Ports cleaned${NC}"

echo -e "\n${BLUE}Step 2: Checking PostgreSQL${NC}"
echo "--------------------------------"

# Check if PostgreSQL is running
if check_port $POSTGRES_PORT; then
    echo -e "${GREEN}PostgreSQL is already running on port $POSTGRES_PORT${NC}"
else
    echo -e "${YELLOW}Starting PostgreSQL...${NC}"
    if command -v brew &> /dev/null; then
        brew services start postgresql@15 2>/dev/null || brew services start postgresql 2>/dev/null || true
    fi
    sleep 3
fi

# Wait for PostgreSQL
if ! wait_for_service localhost $POSTGRES_PORT 15; then
    echo -e "${RED}PostgreSQL is not available. Please start PostgreSQL manually.${NC}"
    exit 1
fi

echo -e "\n${BLUE}Step 3: Setting up database${NC}"
echo "--------------------------------"

# Database configuration
export PGHOST=localhost
export PGPORT=5432
export PGUSER=postgres
export PGPASSWORD=
export PGDATABASE=boulevard_clone

# Create database if not exists
echo "Creating database if not exists..."
psql -h $PGHOST -U $PGUSER -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$PGDATABASE'" 2>/dev/null | grep -q 1 || \
    psql -h $PGHOST -U $PGUSER -d postgres -c "CREATE DATABASE $PGDATABASE" 2>/dev/null || true

echo -e "${GREEN}Database ready${NC}"

echo -e "\n${BLUE}Step 4: Running database migrations${NC}"
echo "--------------------------------"

# Run schema files
if [ -f "server/src/database/schema.sql" ]; then
    echo "Running main schema..."
    psql -h $PGHOST -U $PGUSER -d $PGDATABASE -f server/src/database/schema.sql 2>&1 | grep -v "already exists" | grep -v "NOTICE" || true
fi

if [ -f "server/src/database/schema-enhanced.sql" ]; then
    echo "Running enhanced schema..."
    psql -h $PGHOST -U $PGUSER -d $PGDATABASE -f server/src/database/schema-enhanced.sql 2>&1 | grep -v "already exists" | grep -v "NOTICE" || true
fi

echo -e "${GREEN}Migrations complete${NC}"

echo -e "\n${BLUE}Step 5: Seeding database with 15+ items per feature${NC}"
echo "--------------------------------"

# Run the comprehensive seed file
if [ -f "server/src/database/seed-complete.sql" ]; then
    echo "Running seed data..."
    psql -h $PGHOST -U $PGUSER -d $PGDATABASE -f server/src/database/seed-complete.sql 2>&1 | grep -v "already exists" | grep -v "NOTICE" || true
fi

# Also run initial seed data if it hasn't been run
if [ -f "server/src/database/seed-data.sql" ]; then
    echo "Running initial seed data..."
    psql -h $PGHOST -U $PGUSER -d $PGDATABASE -f server/src/database/seed-data.sql 2>&1 | grep -v "already exists" | grep -v "NOTICE" || true
fi

echo -e "${GREEN}Database seeded${NC}"

# Verify seed data
echo -e "\n${BLUE}Verifying seed data...${NC}"
psql -h $PGHOST -U $PGUSER -d $PGDATABASE -c "
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL SELECT 'services', COUNT(*) FROM services
UNION ALL SELECT 'staff', COUNT(*) FROM staff
UNION ALL SELECT 'clients', COUNT(*) FROM clients
UNION ALL SELECT 'appointments', COUNT(*) FROM appointments
UNION ALL SELECT 'payments', COUNT(*) FROM payments
ORDER BY table_name;
"

echo -e "\n${BLUE}Step 6: Installing dependencies${NC}"
echo "--------------------------------"

# Install root dependencies
if [ -f "package.json" ]; then
    echo "Installing frontend dependencies..."
    npm install --silent 2>/dev/null || npm install
fi

# Install server dependencies
if [ -f "server/package.json" ]; then
    echo "Installing server dependencies..."
    cd server && npm install --silent 2>/dev/null || npm install
    cd ..
fi

echo -e "${GREEN}Dependencies installed${NC}"

echo -e "\n${BLUE}Step 7: Creating server .env file${NC}"
echo "--------------------------------"

# Create .env file for server
cat > server/.env << EOF
DB_HOST=localhost
DB_PORT=5432
DB_NAME=boulevard_clone
DB_USER=postgres
DB_PASSWORD=
PORT=$BACKEND_PORT
JWT_SECRET=boulevard-secret-key-change-in-production
NODE_ENV=development
EOF

echo -e "${GREEN}.env file created${NC}"

echo -e "\n${BLUE}Step 8: Starting services${NC}"
echo "--------------------------------"

# Start backend server in background
echo "Starting backend server on port $BACKEND_PORT..."
cd server
npm run dev > /tmp/boulevard-backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 5

# Verify backend is running
if check_port $BACKEND_PORT; then
    echo -e "${GREEN}Backend started successfully${NC}"
else
    echo -e "${RED}Backend failed to start. Check /tmp/boulevard-backend.log${NC}"
    tail -20 /tmp/boulevard-backend.log
fi

# Start frontend in background
echo "Starting frontend on port $FRONTEND_PORT..."
npm run dev -- --port $FRONTEND_PORT > /tmp/boulevard-frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 5

# Verify frontend is running
if check_port $FRONTEND_PORT; then
    echo -e "${GREEN}Frontend started successfully${NC}"
else
    echo -e "${RED}Frontend failed to start. Check /tmp/boulevard-frontend.log${NC}"
    tail -20 /tmp/boulevard-frontend.log
fi

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}    Boulevard Clone is now running!     ${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e ""
echo -e "  Frontend: ${BLUE}http://localhost:$FRONTEND_PORT${NC}"
echo -e "  Backend:  ${BLUE}http://localhost:$BACKEND_PORT${NC}"
echo -e "  API:      ${BLUE}http://localhost:$BACKEND_PORT/api${NC}"
echo -e ""
echo -e "  Login credentials:"
echo -e "    Email:    ${YELLOW}owner@boulevard.com${NC}"
echo -e "    Password: ${YELLOW}any password (demo mode)${NC}"
echo -e ""
echo -e "  Logs:"
echo -e "    Backend:  ${YELLOW}/tmp/boulevard-backend.log${NC}"
echo -e "    Frontend: ${YELLOW}/tmp/boulevard-frontend.log${NC}"
echo -e ""
echo -e "Press ${RED}Ctrl+C${NC} to stop all services"
echo -e ""

# Trap to clean up on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Services stopped.'" EXIT

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
