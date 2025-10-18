# NeuroVault - On-Chain Memory Wallet for AI Agents

## 🌟 Overview

NeuroVault is a decentralized AI memory layer where every AI agent's experiences, interactions, and learnings are stored, versioned, and verified on-chain using the QIE blockchain.

## 🏗️ Architecture

- **Smart Contracts**: AIIdentity, MemoryVault, ReputationOracle (Solidity)
- **Backend**: Node.js/Express API with blockchain integration
- **Vector Database**: Milvus for embeddings storage
- **Frontend**: React with Web3 wallet integration
- **AI Integration**: OpenAI for embeddings and summaries

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- Docker & Docker Compose
- MetaMask or Web3 wallet
- QIE testnet tokens

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/divs-spec/blcoere.git
cd neurovault
```

2. **Install dependencies**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# Smart Contracts
cd ../smart-contracts
npm install
```

3. **Set up environment variables**
```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your keys

# Frontend
cp frontend/.env.example frontend/.env
```

4. **Start infrastructure with Docker**
```bash
docker-compose up -d
```

5. **Deploy smart contracts**
```bash
cd smart-contracts
npx hardhat compile
npx hardhat run scripts/deploy.js --network qie_testnet
# Copy contract addresses to backend/.env
```

6. **Start development servers**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

7. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Milvus: localhost:19530

## 📚 Using the AI Agent SDK

```javascript
const NeuroVaultAgent = require('neurovault-sdk');

// Initialize agent
const agent = new NeuroVaultAgent({
  did: 'did:neurovault:your-agent-id',
  apiUrl: 'http://localhost:3001/api',
  privateKey: process.env.AGENT_PRIVATE_KEY,
  rpcUrl: 'https://testnet-rpc.qie.network',
  openaiApiKey: process.env.OPENAI_API_KEY
});

// Store a conversation
await agent.rememberConversation([
  { role: 'user', content: 'What is blockchain?' },
  { role: 'assistant', content: 'Blockchain is...' }
], ['blockchain', 'education']);

// Recall relevant memories
const memories = await agent.recall('blockchain technology', 5);

// Generate contextual response
const response = await agent.generateResponse('Tell me more about DeFi');
```

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Smart contract tests
cd smart-contracts
npx hardhat test

# Frontend tests
cd frontend
npm test
```

## 📖 API Documentation

### Agent Endpoints

- `POST /api/agents/create` - Create new AI agent
- `GET /api/agents/:did` - Get agent details
- `GET /api/agents/owner/:address` - Get agents by owner

### Memory Endpoints

- `POST /api/memory/store` - Store new memory
- `GET /api/memory/:did` - Get agent memories
- `POST /api/memory/search` - Search similar memories
- `POST /api/memory/verify` - Verify memory integrity

### Reputation Endpoints

- `POST /api/reputation/feedback` - Submit feedback
- `GET /api/reputation/:did` - Get reputation score
- `POST /api/reputation/update/:did` - Update score

## 🔒 Security Considerations

1. **Private Keys**: Never commit private keys to repository
2. **API Keys**: Use environment variables for all keys
3. **Rate Limiting**: Enabled by default (100 req/15min)
4. **Input Validation**: All endpoints validate input
5. **Memory Verification**: Always verify critical memories

## 🎯 Key Features

✅ Decentralized Identity (DID) for AI agents
✅ Immutable memory storage with versioning
✅ Hybrid storage (on-chain hashes, off-chain content)
✅ Reputation-based trust scoring
✅ Vector similarity search
✅ Cryptographic verification
✅ Web3 wallet integration

## 🛣️ Roadmap

- [ ] Multi-agent collaboration protocols
- [ ] Privacy-preserving encrypted memories
- [ ] Cross-chain memory portability
- [ ] AI marketplace with reputation filtering
- [ ] Advanced analytics dashboard
- [ ] Mobile app support

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- QIE Network for blockchain infrastructure
- OpenAI for embeddings API
- Milvus for vector database
- Hardhat for smart contract tooling

## 📧 Contact

Project Link: https://github.com/divs-spec/blocere

Email Address : ikrakizoi2607@gmail.com

---

Built with ❤️ for the AI × Blockchain future
