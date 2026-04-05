#!/bin/bash
# =============================================
# FinanceBot Supervisor
# =============================================
# Manage all FinanceBot services: start, stop, restart, status
# =============================================

LOG_DIR="logs"
mkdir -p $LOG_DIR

BACKEND_LOG="$LOG_DIR/backend.log"
WORKER_LOG="$LOG_DIR/worker.log"
WEB_LOG="$LOG_DIR/web.log"
MOBILE_LOG="$LOG_DIR/mobile.log"
LOGGER_LOG="$LOG_DIR/logger.log"
METRICS_LOG="$LOG_DIR/metrics.log"
SENTRY_LOG="$LOG_DIR/sentry.log"

function start_services() {
    echo "🚀 Starting FinanceBot services..."

    # Backend
    echo "🟢 Starting backend..."
    cd backend
    nohup node src/server.js > "../$BACKEND_LOG" 2>&1 &
    cd ..

    # Queue worker
    echo "🟢 Starting queue worker..."
    cd backend/src/queue
    nohup node worker.js > "../../../$WORKER_LOG" 2>&1 &
    cd ../../..

    # Web Dashboard
    echo "🟢 Starting web dashboard..."
    cd web/dashboard
    nohup npm start > "../../$WEB_LOG" 2>&1 &
    cd ../../

    # Mobile (React Native)
    echo "🟢 Starting mobile app..."
    cd mobile
    nohup npx react-native start > "../$MOBILE_LOG" 2>&1 &
    cd ..

    # Monitoring
    echo "🟢 Starting monitoring..."
    cd backend/src/monitoring
    nohup node logger.js > "../../../$LOGGER_LOG" 2>&1 &
    nohup node metrics.js > "../../../$METRICS_LOG" 2>&1 &
    nohup node sentry.js > "../../../$SENTRY_LOG" 2>&1 &
    cd ../../..

    echo "✅ All services started!"
}

function stop_services() {
    echo "🛑 Stopping FinanceBot services..."
    pkill -f "node src/server.js"
    pkill -f "node worker.js"
    pkill -f "npm start"
    pkill -f "react-native start"
    pkill -f "node logger.js"
    pkill -f "node metrics.js"
    pkill -f "node sentry.js"
    echo "✅ All services stopped!"
}

function status_services() {
    echo "📊 FinanceBot services status:"
    ps aux | grep -E "node src/server.js|node worker.js|npm start|react-native start|node logger.js|node metrics.js|node sentry.js" | grep -v grep
}

function restart_services() {
    echo "🔄 Restarting FinanceBot services..."
    stop_services
    sleep 2
    start_services
}

case "$1" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    status)
        status_services
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac
