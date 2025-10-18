// backend/src/routes/agentRoutes.js
const express = require('express');
const router = express.Router();
const getBlockchainService = require('../services/blockchain');
const getVectorStore = require('../services/vectorStore');

/**
 * POST /api/agents/create
 * Create a new AI agent
 */
router.post('/create', async (req, res) => {
  try {
    const { agentType, modelVersion, metadata, ownerAddress } = req.body;
    
    if (!agentType || !modelVersion || !ownerAddress) {
      return res.status(400).json({ 
        error: 'Missing required fields: agentType, modelVersion, ownerAddress' 
      });
    }
    
    const blockchain = getBlockchainService();
    
    // Generate unique DID
    const did = blockchain.generateDID();
    
    // Store metadata in IPFS or centralized storage
    const metadataURI = metadata ? `ipfs://metadata/${did}` : '';
    
    // Create agent on blockchain
    const result = await blockchain.createAgent(
      did,
      agentType,
      modelVersion,
      metadataURI,
      ownerAddress
    );
    
    res.json({
      success: true,
      did: did,
      transaction: result.transactionHash,
      blockNumber: result.blockNumber
    });
  } catch (error) {
    console.error('Error creating agent:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/agents/:did
 * Get agent details
 */
router.get('/:did', async (req, res) => {
  try {
    const { did } = req.params;
    const blockchain = getBlockchainService();
    
    const agent = await blockchain.getAgent(did);
    const stats = await blockchain.getMemoryStats(did);
    const reputation = await blockchain.getReputation(did);
    const trustLevel = await blockchain.getTrustLevel(did);
    
    res.json({
      agent,
      stats,
      reputation,
      trustLevel
    });
  } catch (error) {
    console.error('Error fetching agent:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/agents/owner/:address
 * Get all agents owned by an address
 */
router.get('/owner/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const blockchain = getBlockchainService();
    
    const dids = await blockchain.getOwnerAgents(address);
    
    // Fetch details for each agent
    const agents = await Promise.all(
      dids.map(async (did) => {
        const agent = await blockchain.getAgent(did);
        const reputation = await blockchain.getReputation(did);
        return { ...agent, reputation };
      })
    );
    
    res.json({ agents });
  } catch (error) {
    console.error('Error fetching owner agents:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

module.exports = router3;
