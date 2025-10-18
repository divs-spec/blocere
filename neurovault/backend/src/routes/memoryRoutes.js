// backend/src/routes/memoryRoutes.js

const express2 = require('express');
const router2 = express2.Router();
const getBlockchainService2 = require('../services/blockchain');
const getVectorStore2 = require('../services/vectorStore');

/**
 * POST /api/memory/store
 * Store a new memory
 */
router2.post('/store', async (req, res) => {
  try {
    const { 
      did, 
      content, 
      memoryType, 
      tags, 
      isEncrypted,
      metadata 
    } = req.body;
    
    if (!did || !content || !memoryType) {
      return res.status(400).json({ 
        error: 'Missing required fields: did, content, memoryType' 
      });
    }
    
    const blockchain = getBlockchainService2();
    const vectorStore = getVectorStore2();
    
    // Generate summary
    const summary = await vectorStore.summarizeConversation([
      { role: 'assistant', content: content }
    ]);
    
    // Store in vector database
    const vectorResult = await vectorStore.storeMemory(
      did,
      content,
      memoryType,
      metadata || {}
    );
    
    // Generate hash of embedding
    const contentHash = blockchain.hashContent(vectorResult.embedding);
    
    // Store hash on blockchain
    const blockchainResult = await blockchain.storeMemory(
      did,
      contentHash,
      memoryType,
      summary.substring(0, 500), // Max length
      vectorResult.id,
      isEncrypted || false,
      tags || []
    );
    
    res.json({
      success: true,
      vectorId: vectorResult.id,
      transaction: blockchainResult.transactionHash,
      contentHash: contentHash
    });
  } catch (error) {
    console.error('Error storing memory:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/memory/:did
 * Get all memories for an agent
 */
router2.get('/:did', async (req, res) => {
  try {
    const { did } = req.params;
    const { limit, offset } = req.query;
    
    const blockchain = getBlockchainService2();
    const vectorStore = getVectorStore2();
    
    // Get on-chain memory hashes
    const onChainMemories = await blockchain.getAgentMemories(did);
    
    // Get off-chain memory content
    const offChainMemories = await vectorStore.getAgentMemories(
      did,
      parseInt(limit) || 50,
      parseInt(offset) || 0
    );
    
    // Combine data
    const memories = onChainMemories.map((onChain, index) => {
      const offChain = offChainMemories.find(
        oc => oc.id === onChain.vectorDBId
      );
      
      return {
        version: onChain.version,
        summary: onChain.summary,
        memoryType: onChain.memoryType,
        timestamp: onChain.timestamp,
        tags: onChain.tags,
        contentHash: onChain.contentHash,
        isEncrypted: onChain.isEncrypted,
        content: offChain ? offChain.content : null,
        verified: true
      };
    });
    
    res.json({ memories });
  } catch (error) {
    console.error('Error fetching memories:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/memory/search
 * Search similar memories
 */
router2.post('/search', async (req, res) => {
  try {
    const { did, query, limit } = req.body;
    
    if (!did || !query) {
      return res.status(400).json({ 
        error: 'Missing required fields: did, query' 
      });
    }
    
    const vectorStore = getVectorStore2();
    
    const results = await vectorStore.searchSimilarMemories(
      did,
      query,
      limit || 10
    );
    
    res.json({ results });
  } catch (error) {
    console.error('Error searching memories:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/memory/verify
 * Verify memory integrity
 */
router2.post('/verify', async (req, res) => {
  try {
    const { did, version, vectorId } = req.body;
    
    if (!did || !version || !vectorId) {
      return res.status(400).json({ 
        error: 'Missing required fields: did, version, vectorId' 
      });
    }
    
    const blockchain = getBlockchainService2();
    const vectorStore = getVectorStore2();
    
    // Get memory from vector DB
    const memory = await vectorStore.getMemoryById(vectorId);
    
    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }
    
    // Generate embedding and hash
    const embedding = await vectorStore.generateEmbedding(memory.content);
    const computedHash = blockchain.hashContent(embedding);
    
    // Verify on blockchain
    const verifyResult = await blockchain.verifyMemory(
      did,
      version,
      computedHash
    );
    
    res.json({
      isValid: verifyResult.isValid,
      computedHash: computedHash,
      memory: memory
    });
  } catch (error) {
    console.error('Error verifying memory:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/memory/stats/:did
 * Get memory statistics
 */
router2.get('/stats/:did', async (req, res) => {
  try {
    const { did } = req.params;
    
    const blockchain = getBlockchainService2();
    const vectorStore = getVectorStore2();
    
    const blockchainStats = await blockchain.getMemoryStats(did);
    const vectorStats = await vectorStore.getMemoryStats(did);
    
    res.json({
      blockchain: blockchainStats,
      vector: vectorStats,
      syncStatus: {
        inSync: blockchainStats.totalMemories === vectorStats.totalMemories
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router2;
