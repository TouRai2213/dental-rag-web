#!/bin/bash

# Dental RAG Web Services Stop Script
# Stops both frontend and backend services

set -e

echo "🛑 Stopping Dental RAG Web Services..."
echo "===================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to stop service by PID file
stop_service() {
    local service_name=$1
    local pid_file=$2

    echo -e "${BLUE}🔄 Stopping $service_name...${NC}"

    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            echo "Stopping $service_name (PID: $pid)"
            kill -TERM "$pid" 2>/dev/null || true

            # Wait for graceful shutdown
            local count=0
            while kill -0 "$pid" 2>/dev/null && [ $count -lt 10 ]; do
                sleep 1
                count=$((count + 1))
            done

            # Force kill if still running
            if kill -0 "$pid" 2>/dev/null; then
                echo "Force killing $service_name (PID: $pid)"
                kill -KILL "$pid" 2>/dev/null || true
            fi

            echo -e "${GREEN}✅ $service_name stopped${NC}"
        else
            echo -e "${YELLOW}⚠️  $service_name PID not found or already stopped${NC}"
        fi

        # Remove PID file
        rm -f "$pid_file"
    else
        echo -e "${YELLOW}⚠️  No PID file found for $service_name${NC}"
    fi
}

# Function to kill processes on specific ports
kill_port_processes() {
    local port=$1
    local service_name=$2

    echo -e "${BLUE}🔍 Checking for processes on port $port ($service_name)...${NC}"

    local pids=$(netstat -tlnp 2>/dev/null | grep ":$port " | awk '{print $7}' | cut -d'/' -f1 | grep -v '-' | sort -u)

    if [ -n "$pids" ]; then
        echo -e "${YELLOW}Found processes on port $port:${NC}"
        netstat -tlnp 2>/dev/null | grep ":$port "

        for pid in $pids; do
            if [ "$pid" != "" ] && [ "$pid" != "-" ]; then
                echo "Killing process $pid on port $port"
                kill -TERM "$pid" 2>/dev/null || true
                sleep 1
                # Force kill if still running
                if kill -0 "$pid" 2>/dev/null; then
                    kill -KILL "$pid" 2>/dev/null || true
                fi
            fi
        done
        echo -e "${GREEN}✅ Processes on port $port stopped${NC}"
    else
        echo -e "${GREEN}✅ No processes found on port $port${NC}"
    fi
}

# Stop services using PID files
stop_service "Frontend" "./logs/frontend.pid"
stop_service "Backend" "./logs/backend.pid"

echo ""
echo -e "${BLUE}🔍 Double-checking ports...${NC}"

# Also kill any remaining processes on our ports
kill_port_processes "3000" "Frontend"
kill_port_processes "8002" "Backend"

echo ""
echo -e "${GREEN}🎉 All services stopped successfully!${NC}"
echo "=================================="

# Clean up log files if they exist
if [ -d "./logs" ]; then
    echo -e "${BLUE}📄 Log files preserved in ./logs/${NC}"
    echo "• Frontend log: ./logs/frontend.log"
    echo "• Backend log:  ./logs/backend.log"
    echo ""
    echo -e "${YELLOW}💡 To clear logs: rm -rf ./logs${NC}"
fi

echo -e "${BLUE}🚀 To start services again: ./start-services.sh${NC}"