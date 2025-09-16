#!/bin/bash

# Dental RAG Web Services Startup Script
# Starts both frontend (port 3000) and backend (port 8002) services

set -e

echo "🚀 Starting Dental RAG Web Services..."
echo "=================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if port is available
check_port() {
    local port=$1
    if netstat -tlnp 2>/dev/null | grep -q ":$port "; then
        echo -e "${RED}❌ Port $port is already in use${NC}"
        echo "Processes using port $port:"
        netstat -tlnp 2>/dev/null | grep ":$port "
        return 1
    else
        echo -e "${GREEN}✅ Port $port is available${NC}"
        return 0
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    echo -e "${YELLOW}🔄 Attempting to stop services on port $port...${NC}"

    # Find and kill processes using the port
    local pids=$(netstat -tlnp 2>/dev/null | grep ":$port " | awk '{print $7}' | cut -d'/' -f1 | grep -v '-' | sort -u)

    if [ -n "$pids" ]; then
        for pid in $pids; do
            if [ "$pid" != "" ] && [ "$pid" != "-" ]; then
                echo "Killing process $pid on port $port"
                kill -TERM "$pid" 2>/dev/null || true
                sleep 2
                # Force kill if still running
                if kill -0 "$pid" 2>/dev/null; then
                    kill -KILL "$pid" 2>/dev/null || true
                fi
            fi
        done
        sleep 3
    fi
}

# Function to start backend service
start_backend() {
    echo -e "${BLUE}🔧 Starting Backend Service (Port 8002)...${NC}"

    # Check if Python virtual environment exists
    if [ ! -d "./backend/venv" ] && [ ! -f "./backend/requirements.txt" ]; then
        echo -e "${RED}❌ Backend requirements not found${NC}"
        return 1
    fi

    # Start backend in background
    cd backend
    echo "Starting backend server..."
    nohup python main.py > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..

    echo "Backend PID: $BACKEND_PID"
    echo $BACKEND_PID > ./logs/backend.pid

    # Wait a moment and check if backend started
    sleep 5
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${GREEN}✅ Backend started successfully${NC}"
        return 0
    else
        echo -e "${RED}❌ Backend failed to start${NC}"
        return 1
    fi
}

# Function to start frontend service
start_frontend() {
    echo -e "${BLUE}🌐 Starting Frontend Service (Port 3000)...${NC}"

    # Check if node_modules exists
    if [ ! -d "./node_modules" ]; then
        echo -e "${YELLOW}📦 Installing dependencies...${NC}"
        npm install
    fi

    # Start frontend in background
    echo "Starting frontend server..."
    nohup npm run start > ./logs/frontend.log 2>&1 &
    FRONTEND_PID=$!

    echo "Frontend PID: $FRONTEND_PID"
    echo $FRONTEND_PID > ./logs/frontend.pid

    # Wait a moment and check if frontend started
    sleep 8
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${GREEN}✅ Frontend started successfully${NC}"
        return 0
    else
        echo -e "${RED}❌ Frontend failed to start${NC}"
        return 1
    fi
}

# Function to check service health
check_health() {
    echo -e "${BLUE}🔍 Checking service health...${NC}"

    # Check backend health
    echo "Checking backend (http://localhost:8002/health)..."
    if curl -f -s "http://localhost:8002/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is healthy${NC}"
    else
        echo -e "${YELLOW}⚠️  Backend health check failed (may still be starting)${NC}"
    fi

    # Check frontend health
    echo "Checking frontend (http://localhost:3000)..."
    if curl -f -s "http://localhost:3000" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend is healthy${NC}"
    else
        echo -e "${YELLOW}⚠️  Frontend health check failed (may still be starting)${NC}"
    fi
}

# Create logs directory
mkdir -p logs

# Main execution
echo -e "${BLUE}📊 Checking current port status...${NC}"

# Check ports and offer to kill existing processes
if ! check_port 8002; then
    read -p "Kill existing processes on port 8002? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill_port 8002
    else
        echo -e "${RED}❌ Cannot start backend - port 8002 is in use${NC}"
        exit 1
    fi
fi

if ! check_port 3000; then
    read -p "Kill existing processes on port 3000? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill_port 3000
    else
        echo -e "${RED}❌ Cannot start frontend - port 3000 is in use${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${BLUE}🚀 Starting services...${NC}"

# Start backend
if start_backend; then
    echo ""
    # Start frontend
    if start_frontend; then
        echo ""
        echo -e "${GREEN}🎉 All services started successfully!${NC}"
        echo "=================================="
        echo -e "${BLUE}📋 Service Information:${NC}"
        echo "• Frontend: http://localhost:3000"
        echo "• Backend:  http://localhost:8002"
        echo "• Backend Health: http://localhost:8002/health"
        echo ""
        echo -e "${BLUE}📄 Log files:${NC}"
        echo "• Frontend: ./logs/frontend.log"
        echo "• Backend:  ./logs/backend.log"
        echo ""
        echo -e "${BLUE}🛑 To stop services:${NC}"
        echo "• Run: ./stop-services.sh"
        echo "• Or kill PIDs manually:"
        echo "  - Frontend PID: $(cat ./logs/frontend.pid 2>/dev/null || echo 'N/A')"
        echo "  - Backend PID:  $(cat ./logs/backend.pid 2>/dev/null || echo 'N/A')"

        # Wait a bit then check health
        echo ""
        echo -e "${YELLOW}⏳ Waiting 10 seconds before health check...${NC}"
        sleep 10
        check_health

    else
        echo -e "${RED}❌ Frontend failed to start${NC}"
        # Kill backend if frontend failed
        if [ -f "./logs/backend.pid" ]; then
            BACKEND_PID=$(cat ./logs/backend.pid)
            kill $BACKEND_PID 2>/dev/null || true
        fi
        exit 1
    fi
else
    echo -e "${RED}❌ Backend failed to start${NC}"
    exit 1
fi