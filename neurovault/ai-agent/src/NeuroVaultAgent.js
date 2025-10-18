// ai-agent/src/NeuroVaultAgent.js
/**
 * NeuroVault AI Agent SDK
 * Enables AI agents to store and retrieve memories on blockchain
 */

const axios = require('axios');
const { ethers } = require('ethers');
const { OpenAI } = require('openai');

class NeuroVaultAgent {
  constructor(config) {
    this.did = config.did;
    this.apiUrl = config.apiUrl || 'http://localhost:3001/api';
    this.privateKey = config.privateKey;
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.wallet = new ethers.Wallet(this.privateKey, this.provider);
    
    this.openai = new OpenAI({
      apiKey: config.openaiApiKey
    });
    
    this.memoryCache = [];
    this.conversationHistory = [];
    
    console.log(`✅ NeuroVault Agent initialized: ${this.did}`);
  }

  /**
   * Store a conversation in memory
   */
  async rememberConversation(messages, tags = []) {
    try {
      // Add to conversation history
      this.conversationHistory.push(...messages);
      
      // Generate summary
      const summary = await this._summarizeConversation(messages);
      
      // Create memory object
      const memory = {
        did: this.did,
        content: JSON.stringify(messages),
        memoryType: 'conversation',
        tags: [...tags, 'conversation'],
        metadata: {
          messageCount: messages.length,
          timestamp: Date.now(),
          participants: this._extractParticipants(messages)
        }
      };
      
      // Store in NeuroVault
      const response = await axios.post(`${this.apiUrl}/memory/store`, memory);
      
      // Cache locally
      this.memoryCache.push({
        ...memory,
        vectorId: response.data.vectorId,
        contentHash: response.data.contentHash
      });
      
      console.log(`✅ Conversation memory stored: ${response.data.vectorId}`);
      
      return {
        success: true,
        vectorId: response.data.vectorId,
        contentHash: response.data.contentHash,
        summary: summary
      };
    } catch (error) {
      console.error('Error storing conversation:', error);
      throw error;
    }
  }

  /**
   * Store a learning experience
   */
  async rememberLearning(topic, content, insights = []) {
    try {
      const memory = {
        did: this.did,
        content: JSON.stringify({
          topic,
          content,
          insights,
          learnedAt: Date.now()
        }),
        memoryType: 'learning',
        tags: ['learning', topic.toLowerCase().replace(/\s+/g, '-')],
        metadata: {
          topic,
          insightCount: insights.length
        }
      };
      
      const response = await axios.post(`${this.apiUrl}/memory/store`, memory);
      
      console.log(`✅ Learning memory stored: ${topic}`);
      
      return {
        success: true,
        vectorId: response.data.vectorId,
        contentHash: response.data.contentHash
      };
    } catch (error) {
      console.error('Error storing learning:', error);
      throw error;
    }
  }

  /**
   * Store a decision made by the agent
   */
  async rememberDecision(decision, reasoning, outcome = null) {
    try {
      const memory = {
        did: this.did,
        content: JSON.stringify({
          decision,
          reasoning,
          outcome,
          decidedAt: Date.now()
        }),
        memoryType: 'decision',
        tags: ['decision'],
        metadata: {
          hasOutcome: outcome !== null
        }
      };
      
      const response = await axios.post(`${this.apiUrl}/memory/store`, memory);
      
      console.log(`✅ Decision memory stored`);
      
      return {
        success: true,
        vectorId: response.data.vectorId,
        contentHash: response.data.contentHash
      };
    } catch (error) {
      console.error('Error storing decision:', error);
      throw error;
    }
  }

  /**
   * Recall similar memories based on query
   */
  async recall(query, limit = 5) {
    try {
      const response = await axios.post(`${this.apiUrl}/memory/search`, {
        did: this.did,
        query,
        limit
      });
      
      console.log(`✅ Recalled ${response.data.results.length} relevant memories`);
      
      return response.data.results.map(r => ({
        content: JSON.parse(r.content),
        memoryType: r.memoryType,
        similarity: r.similarity,
        timestamp: r.timestamp
      }));
    } catch (error) {
      console.error('Error recalling memories:', error);
      throw error;
    }
  }

  /**
   * Get all memories
   */
  async getAllMemories(limit = 100) {
    try {
      const response = await axios.get(`${this.apiUrl}/memory/${this.did}`, {
        params: { limit }
      });
      
      return response.data.memories;
    } catch (error) {
      console.error('Error fetching memories:', error);
      throw error;
    }
  }

  /**
   * Get memory statistics
   */
  async getStats() {
    try {
      const response = await axios.get(`${this.apiUrl}/memory/stats/${this.did}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  }

  /**
   * Generate response using conversation history
   */
  async generateResponse(userMessage, systemPrompt = null) {
    try {
      // Recall relevant past memories
      const relevantMemories = await this.recall(userMessage, 3);
      
      // Build context from memories
      let contextPrompt = '';
      if (relevantMemories.length > 0) {
        contextPrompt = '\n\nRelevant past context:\n';
        relevantMemories.forEach((mem, idx) => {
          if (mem.memoryType === 'conversation') {
            contextPrompt += `${idx + 1}. Previous conversation about similar topic\n`;
          } else if (mem.memoryType === 'learning') {
            contextPrompt += `${idx + 1}. Learning: ${mem.content.topic}\n`;
          }
        });
      }
      
      // Generate response with GPT
      const messages = [
        {
          role: 'system',
          content: systemPrompt || `You are an AI assistant with persistent memory. Use your past experiences to provide better responses.${contextPrompt}`
        },
        ...this.conversationHistory.slice(-5), // Last 5 messages
        {
          role: 'user',
          content: userMessage
        }
      ];
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      });
      
      const assistantMessage = response.choices[0].message.content;
      
      // Store this interaction
      await this.rememberConversation([
        { role: 'user', content: userMessage },
        { role: 'assistant', content: assistantMessage }
      ]);
      
      return {
        response: assistantMessage,
        usedMemories: relevantMemories.length,
        confidence: relevantMemories.length > 0 ? 'high' : 'medium'
      };
    } catch (error) {
      console.error('Error generating response:', error);
      throw error;
    }
  }

  /**
   * Verify memory integrity
   */
  async verifyMemory(version, vectorId) {
    try {
      const response = await axios.post(`${this.apiUrl}/memory/verify`, {
        did: this.did,
        version,
        vectorId
      });
      
      return response.data.isValid;
    } catch (error) {
      console.error('Error verifying memory:', error);
      throw error;
    }
  }

  /**
   * Submit self-assessment for reputation
   */
  async submitPerformanceReport(rating, notes) {
    try {
      const response = await axios.post(`${this.apiUrl}/reputation/feedback`, {
        did: this.did,
        isPositive: rating >= 4,
        rating: rating,
        comment: notes
      });
      
      console.log(`✅ Performance report submitted`);
      
      return response.data;
    } catch (error) {
      console.error('Error submitting report:', error);
      throw error;
    }
  }

  /**
   * Get current reputation
   */
  async getReputation() {
    try {
      const response = await axios.get(`${this.apiUrl}/reputation/${this.did}`);
      return response.data.reputation;
    } catch (error) {
      console.error('Error fetching reputation:', error);
      throw error;
    }
  }

  // Private helper methods

  async _summarizeConversation(messages) {
    const conversationText = messages.map(m => 
      `${m.role}: ${m.content}`
    ).join('\n');
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Summarize the following conversation in one concise sentence.'
        },
        {
          role: 'user',
          content: conversationText
        }
      ],
      max_tokens: 100
    });
    
    return response.choices[0].message.content;
  }

  _extractParticipants(messages) {
    const participants = new Set();
    messages.forEach(m => participants.add(m.role));
    return Array.from(participants);
  }

  /**
   * Clear local cache
   */
  clearCache() {
    this.memoryCache = [];
    this.conversationHistory = [];
    console.log('✅ Local cache cleared');
  }
}

module.exports = NeuroVaultAgent;

// ========================================
// Example Usage
// ========================================

/*
const NeuroVaultAgent = require('./NeuroVaultAgent');

// Initialize agent
const agent = new NeuroVaultAgent({
  did: 'did:neurovault:1729234567-abc123',
  apiUrl: 'http://localhost:3001/api',
  privateKey: process.env.AGENT_PRIVATE_KEY,
  rpcUrl: 'https://rpc.qie.network',
  openaiApiKey: process.env.OPENAI_API_KEY
});

// Example 1: Chat with memory
async function chatExample() {
  const result = await agent.generateResponse(
    "What did we discuss about trading strategies last week?"
  );
  
  console.log('Response:', result.response);
  console.log('Used memories:', result.usedMemories);
}

// Example 2: Store learning
async function learningExample() {
  await agent.rememberLearning(
    'Risk Management',
    'Learned the importance of stop-loss orders in volatile markets',
    [
      'Always set stop-loss at 2% below entry',
      'Adjust stop-loss as position becomes profitable',
      'Never risk more than 1% of portfolio on single trade'
    ]
  );
}

// Example 3: Record decision
async function decisionExample() {
  await agent.rememberDecision(
    'Bought 0.5 BTC at $45,000',
    'Technical analysis showed strong support at $44,500. RSI oversold. Volume increasing.',
    { profit: '+$2,500', timestamp: Date.now() + 86400000 }
  );
}

// Example 4: Recall past experiences
async function recallExample() {
  const memories = await agent.recall('bitcoin trading', 5);
  memories.forEach((mem, idx) => {
    console.log(`${idx + 1}. ${mem.memoryType} - ${mem.content}`);
  });
}

// Example 5: Check reputation
async function reputationExample() {
  const rep = await agent.getReputation();
  console.log('Trust Score:', rep.totalScore);
  console.log('Total Interactions:', rep.totalInteractions);
  console.log('Positive Votes:', rep.positiveVotes);
}
*/
