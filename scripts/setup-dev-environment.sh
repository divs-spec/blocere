// ========================================
// scripts/setup-dev-environment.sh
// ========================================

#!/bin/bash

echo "🚀 Setting up NeuroVault Development Environment"
echo "================================================"

# Check prerequisites
echo "\n1️⃣  Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js >= 18.0.0"
    exit 1
fi
echo "✅ Node.js $(node --version)"

if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker"
    exit 1
fi
echo "✅ Docker $(docker --version)"

# Install dependencies
echo "\n2️⃣  Installing dependencies..."

cd backend && npm install && cd ..
cd frontend && npm install && cd ..
cd smart-contracts && npm install && cd ..
cd ai-agent && npm install && cd ..

echo "✅ Dependencies installed"

# Setup environment files
echo "\n3️⃣  Setting up environment files..."

if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "⚠️  Please edit backend/.env with your keys"
fi

if [ ! -f frontend/.env ]; then
    cp frontend/.env.example frontend/.env
fi

echo "✅ Environment files created"

# Start Docker services
echo "\n4️⃣  Starting Docker services (Milvus, etcd, MinIO)..."
docker-compose up -d

echo "⏳ Waiting for services to be ready..."
sleep 15

# Check if services are running
if docker ps | grep -q milvus; then
    echo "✅ Milvus is running"
else
    echo "❌ Milvus failed to start"
    exit 1
fi

# Compile smart contracts
echo "\n5️⃣  Compiling smart contracts..."
cd smart-contracts
npx hardhat compile
cd ..
echo "✅ Smart contracts compiled"

# Run tests
echo "\n6️⃣  Running tests..."
cd smart-contracts
npx hardhat test
cd ..
echo "✅ Tests passed"

echo "\n================================================"
echo "🎉 Development environment setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env with your API keys"
echo "2. Deploy contracts: cd smart-contracts && npx hardhat run scripts/deploy.js --network qie_testnet"
echo "3. Update backend/.env with deployed contract addresses"
echo "4. Start backend: cd backend && npm run dev"
echo "5. Start frontend: cd frontend && npm start"
echo ""
echo "📚 Documentation: README.md"
echo "🎬 Run demo: node demo/complete-demo.js"
echo "================================================"
