// backend/src/services/blockchain.js
const { ethers } = require('ethers');
const AIIdentityABI = require('../contracts/AIIdentity.json');
const MemoryVaultABI = require('../contracts/MemoryVault.json');
const ReputationOracleABI = require('../contracts/ReputationOracle.json');

class BlockchainService {
  constructor() {
    // Initialize provider (QIE Network)
    this.provider = new ethers.JsonRpcProvider(
      process.env.QIE_RPC_URL || 'https://rpc.qie.network'
    );
    
    // Initialize wallet for backend operations
    this.wallet = new ethers.Wallet(
      process.env.PRIVATE_KEY,
      this.provider
    );
    
    // Initialize contracts
    this.identityContract = new ethers.Contract(
      process.env.AI_IDENTITY_ADDRESS,
      AIIdentityABI,
      this.wallet
    );
    
    this.memoryVault = new ethers.Contract(
      process.env.MEMORY_VAULT_ADDRESS,
      MemoryVaultABI,
      this.wallet
    );
    
    this.reputationOracle = new ethers.Contract(
      process.env.REPUTATION_ORACLE_ADDRESS,
      ReputationOracleABI,
      this.wallet
    );
    
    console.log('✅ Blockchain service initialized');
  }
  
  // ============ AI Identity Methods ============
  
  async createAgent(did, agentType, modelVersion, metadataURI, userAddress) {
    try {
      const tx = await this.identityContract.createAgent(
        did,
        agentType,
        modelVersion,
        metadataURI
      );
      
      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        did: did
      };
    } catch (error) {
      console.error('Error creating agent:', error);
      throw new Error(`Failed to create agent: ${error.message}`);
    }
  }
  
  async getAgent(did) {
    try {
      const agent = await this.identityContract.getAgent(did);
      
      return {
        did: agent.did,
        owner: agent.owner,
        agentType: agent.agentType,
        modelVersion: agent.modelVersion,
        createdAt: Number(agent.createdAt),
        lastActive: Number(agent.lastActive),
        isActive: agent.isActive,
        metadataURI: agent.metadataURI
      };
    } catch (error) {
      console.error('Error fetching agent:', error);
      throw new Error(`Failed to fetch agent: ${error.message}`);
    }
  }
  
  async getOwnerAgents(ownerAddress) {
    try {
      const dids = await this.identityContract.getOwnerAgents(ownerAddress);
      return dids;
    } catch (error) {
      console.error('Error fetching owner agents:', error);
      throw new Error(`Failed to fetch owner agents: ${error.message}`);
    }
  }
  
  async updateAgentActivity(did) {
    try {
      const tx = await this.identityContract.updateActivity(did);
      await tx.wait();
      return { success: true };
    } catch (error) {
      console.error('Error updating activity:', error);
      throw new Error(`Failed to update activity: ${error.message}`);
    }
  }
  
  // ============ Memory Vault Methods ============
  
  async storeMemory(did, contentHash, memoryType, summary, vectorDBId, isEncrypted, tags) {
    try {
      const tx = await this.memoryVault.storeMemory(
        did,
        contentHash,
        memoryType,
        summary,
        vectorDBId,
        isEncrypted,
        tags
      );
      
      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Error storing memory:', error);
      throw new Error(`Failed to store memory: ${error.message}`);
    }
  }
  
  async getAgentMemories(did) {
    try {
      const memories = await this.memoryVault.getAgentMemories(did);
      
      return memories.map(mem => ({
        did: mem.did,
        contentHash: mem.contentHash,
        memoryType: mem.memoryType,
        summary: mem.summary,
        timestamp: Number(mem.timestamp),
        version: Number(mem.version),
        vectorDBId: mem.vectorDBId,
        isEncrypted: mem.isEncrypted,
        tags: mem.tags
      }));
    } catch (error) {
      console.error('Error fetching memories:', error);
      throw new Error(`Failed to fetch memories: ${error.message}`);
    }
  }
  
  async getMemory(did, version) {
    try {
      const memory = await this.memoryVault.getMemory(did, version);
      
      return {
        did: memory.did,
        contentHash: memory.contentHash,
        memoryType: memory.memoryType,
        summary: memory.summary,
        timestamp: Number(memory.timestamp),
        version: Number(memory.version),
        vectorDBId: memory.vectorDBId,
        isEncrypted: memory.isEncrypted,
        tags: memory.tags
      };
    } catch (error) {
      console.error('Error fetching memory:', error);
      throw new Error(`Failed to fetch memory: ${error.message}`);
    }
  }
  
  async verifyMemory(did, version, providedHash) {
    try {
      const isValid = await this.memoryVault.verifyMemory(did, version, providedHash);
      return { isValid };
    } catch (error) {
      console.error('Error verifying memory:', error);
      throw new Error(`Failed to verify memory: ${error.message}`);
    }
  }
  
  async getMemoryStats(did) {
    try {
      const stats = await this.memoryVault.getStats(did);
      
      return {
        totalMemories: Number(stats.totalMemories),
        lastUpdate: Number(stats.lastUpdate),
        storageUsed: Number(stats.storageUsed)
      };
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw new Error(`Failed to fetch stats: ${error.message}`);
    }
  }
  
  async grantReadAccess(did, granteeAddress) {
    try {
      const tx = await this.memoryVault.grantReadAccess(did, granteeAddress);
      await tx.wait();
      return { success: true };
    } catch (error) {
      console.error('Error granting access:', error);
      throw new Error(`Failed to grant access: ${error.message}`);
    }
  }
  
  // ============ Reputation Methods ============
  
  async submitFeedback(did, isPositive, rating, comment) {
    try {
      const tx = await this.reputationOracle.submitFeedback(
        did,
        isPositive,
        rating,
        comment
      );
      
      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt.hash
      };
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw new Error(`Failed to submit feedback: ${error.message}`);
    }
  }
  
  async updateReputationScore(did) {
    try {
      const tx = await this.reputationOracle.updateScore(did);
      await tx.wait();
      return { success: true };
    } catch (error) {
      console.error('Error updating score:', error);
      throw new Error(`Failed to update score: ${error.message}`);
    }
  }
  
  async getReputation(did) {
    try {
      const rep = await this.reputationOracle.getReputation(did);
      
      return {
        totalScore: Number(rep.totalScore),
        interactionQuality: Number(rep.interactionQuality),
        consistency: Number(rep.consistency),
        transparency: Number(rep.transparency),
        experience: Number(rep.experience),
        totalInteractions: Number(rep.totalInteractions),
        positiveVotes: Number(rep.positiveVotes),
        negativeVotes: Number(rep.negativeVotes),
        lastUpdated: Number(rep.lastUpdated)
      };
    } catch (error) {
      console.error('Error fetching reputation:', error);
      throw new Error(`Failed to fetch reputation: ${error.message}`);
    }
  }
  
  async getTrustLevel(did) {
    try {
      const level = await this.reputationOracle.getTrustLevel(did);
      return level;
    } catch (error) {
      console.error('Error fetching trust level:', error);
      throw new Error(`Failed to fetch trust level: ${error.message}`);
    }
  }
  
  async getFeedback(did) {
    try {
      const feedbacks = await this.reputationOracle.getFeedback(did);
      
      return feedbacks.map(fb => ({
        user: fb.user,
        did: fb.did,
        isPositive: fb.isPositive,
        rating: Number(fb.rating),
        comment: fb.comment,
        timestamp: Number(fb.timestamp)
      }));
    } catch (error) {
      console.error('Error fetching feedback:', error);
      throw new Error(`Failed to fetch feedback: ${error.message}`);
    }
  }
  
  // ============ Utility Methods ============
  
  async getGasPrice() {
    try {
      const feeData = await this.provider.getFeeData();
      return feeData.gasPrice;
    } catch (error) {
      console.error('Error fetching gas price:', error);
      return null;
    }
  }
  
  async getBlockNumber() {
    try {
      return await this.provider.getBlockNumber();
    } catch (error) {
      console.error('Error fetching block number:', error);
      return null;
    }
  }
  
  generateDID() {
    // Generate unique DID using timestamp and random string
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    return `did:neurovault:${timestamp}-${randomStr}`;
  }
  
  hashContent(content) {
    // Generate SHA-256 hash
    return ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(content)));
  }
}

// Singleton instance
let blockchainServiceInstance = null;

const getBlockchainService = () => {
  if (!blockchainServiceInstance) {
    blockchainServiceInstance = new BlockchainService();
  }
  return blockchainServiceInstance;
};

module.exports = getBlockchainService;
