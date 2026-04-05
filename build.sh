#!/bin/bash
# FinanceBot Full Setup Script
# Pastikan dijalankan dari folder root FinanceBot

echo "🚀 Mulai setup FinanceBot..."

# 1. Backend setup
echo "📦 Installing backend dependencies..."
cd backend
npm install
echo "✅ Backend dependencies installed."

# 2. Backend build (opsional jika ada build step)
echo "🏗 Building backend..."
# Jika ada transpiler atau build step (misal babel)
# npm run build
echo "✅ Backend build complete."
cd ..

# 3. Web setup
echo "🌐 Installing web dependencies..."
cd web/dashboard
npm install
cd ../..
echo "✅ Web dependencies installed."

# 4. Mobile setup
echo "📱 Installing mobile dependencies..."
cd mobile
npm install
# Jika React Native, install pods untuk iOS (opsional)
# cd ios && pod install && cd ..
cd ..
echo "✅ Mobile dependencies installed."

# 5. Shared modules (jika perlu npm link atau local path)
echo "🔗 Linking shared modules..."
# npm link atau symlink bisa dilakukan jika perlu
echo "✅ Shared modules linked."

# 6. Infra setup
echo "⚙ Setting up infrastructure..."
# Docker build
docker-compose build
echo "✅ Docker containers built."

# 7. Environment
echo "🛠 Creating .env files..."
cp backend/src/config/secrets.local.js backend/src/config/.env
echo "✅ Environment setup complete."

echo "🎉 FinanceBot is ready!"
