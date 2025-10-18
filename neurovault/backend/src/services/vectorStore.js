// backend/src/services/vectorStore.js
const { OpenAI } = require('openai');
const { MilvusClient } = require('@zilliz/milvus2-sdk-node');

class VectorStoreService {
  constructor() {
    // Initialize OpenAI for embeddings
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    // Initialize Milvus client
    this.milvusClient = new MilvusClient({
      address: process.env.MILVUS_ADDRESS || 'localhost:19530',
      username: process.env.MILVUS_USERNAME,
      password: process.env.MILVUS_PASSWORD
    });
    
    this.collectionName = 'ai_memories';
    this.dimension = 1536; // OpenAI embedding dimension
    
    this.initialized = false;
    this.initialize();
  }
  
  async initialize() {
    try {
      // Check if collection exists
      const hasCollection = await this.milvusClient.hasCollection({
        collection_name: this.collectionName
      });
      
      if (!hasCollection.value) {
        await this.createCollection();
      }
      
      // Load collection
      await this.milvusClient.loadCollection({
        collection_name: this.collectionName
      });
      
      this.initialized = true;
      console.log('✅ Vector store initialized');
    } catch (error) {
      console.error('Error deleting memories:', error);
      throw new Error(`Failed to delete memories: ${error.message}`);
    }
  }
  
  /**
   * Get memory statistics
   */
  async getMemoryStats(did) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      const queryResult = await this.milvusClient.query({
        collection_name: this.collectionName,
        filter: `did == "${did}"`,
        output_fields: ['timestamp', 'memory_type']
      });
      
      const memories = queryResult.data;
      const typeCount = {};
      
      memories.forEach(mem => {
        typeCount[mem.memory_type] = (typeCount[mem.memory_type] || 0) + 1;
      });
      
      return {
        totalMemories: memories.length,
        byType: typeCount,
        oldestMemory: memories.length > 0 ? 
          Math.min(...memories.map(m => parseInt(m.timestamp))) : null,
        newestMemory: memories.length > 0 ? 
          Math.max(...memories.map(m => parseInt(m.timestamp))) : null
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      throw new Error(`Failed to get stats: ${error.message}`);
    }
  }
  
  /**
   * Summarize conversation using OpenAI
   */
  async summarizeConversation(messages) {
    try {
      const conversationText = messages.map(m => 
        `${m.role}: ${m.content}`
      ).join('\n');
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Summarize the following conversation in 2-3 concise sentences, capturing key topics and decisions.'
          },
          {
            role: 'user',
            content: conversationText
          }
        ],
        max_tokens: 150
      });
      
      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error summarizing conversation:', error);
      throw new Error(`Failed to summarize: ${error.message}`);
    }
  }
}

// Singleton instance
let vectorStoreInstance = null;

const getVectorStore = () => {
  if (!vectorStoreInstance) {
    vectorStoreInstance = new VectorStoreService();
  }
  return vectorStoreInstance;
};

module.exports = getVectorStore; initializing vector store:', error);
      throw error;
    }
  }
  
  async createCollection() {
    try {
      // Create collection schema
      await this.milvusClient.createCollection({
        collection_name: this.collectionName,
        fields: [
          {
            name: 'id',
            data_type: 5, // VARCHAR
            is_primary_key: true,
            max_length: 100
          },
          {
            name: 'did',
            data_type: 5, // VARCHAR
            max_length: 100
          },
          {
            name: 'embedding',
            data_type: 101, // FLOAT_VECTOR
            dim: this.dimension
          },
          {
            name: 'content',
            data_type: 5, // VARCHAR
            max_length: 65535
          },
          {
            name: 'memory_type',
            data_type: 5, // VARCHAR
            max_length: 50
          },
          {
            name: 'timestamp',
            data_type: 5, // INT64
          },
          {
            name: 'metadata',
            data_type: 5, // VARCHAR (JSON string)
            max_length: 10000
          }
        ]
      });
      
      // Create index for vector search
      await this.milvusClient.createIndex({
        collection_name: this.collectionName,
        field_name: 'embedding',
        index_type: 'IVF_FLAT',
        metric_type: 'L2',
        params: { nlist: 1024 }
      });
      
      console.log('✅ Collection created successfully');
    } catch (error) {
      console.error('Error creating collection:', error);
      throw error;
    }
  }
  
  /**
   * Generate embeddings using OpenAI
   */
  async generateEmbedding(text) {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text
      });
      
      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }
  
  /**
   * Store a memory in vector database
   */
  async storeMemory(did, content, memoryType, metadata = {}) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Generate embedding
      const embedding = await this.generateEmbedding(content);
      
      // Generate unique ID
      const id = `${did}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Prepare data
      const data = [{
        id: id,
        did: did,
        embedding: embedding,
        content: content,
        memory_type: memoryType,
        timestamp: Date.now().toString(),
        metadata: JSON.stringify(metadata)
      }];
      
      // Insert into Milvus
      const insertResult = await this.milvusClient.insert({
        collection_name: this.collectionName,
        data: data
      });
      
      // Flush to ensure data is written
      await this.milvusClient.flush({
        collection_names: [this.collectionName]
      });
      
      return {
        id: id,
        embedding: embedding,
        insertedCount: insertResult.insert_cnt
      };
    } catch (error) {
      console.error('Error storing memory:', error);
      throw new Error(`Failed to store memory: ${error.message}`);
    }
  }
  
  /**
   * Search for similar memories
   */
  async searchSimilarMemories(did, queryText, limit = 10) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(queryText);
      
      // Search in Milvus
      const searchResult = await this.milvusClient.search({
        collection_name: this.collectionName,
        vector: queryEmbedding,
        filter: `did == "${did}"`,
        limit: limit,
        output_fields: ['id', 'did', 'content', 'memory_type', 'timestamp', 'metadata']
      });
      
      return searchResult.results.map(result => ({
        id: result.id,
        content: result.content,
        memoryType: result.memory_type,
        timestamp: parseInt(result.timestamp),
        metadata: JSON.parse(result.metadata || '{}'),
        similarity: result.score
      }));
    } catch (error) {
      console.error('Error searching memories:', error);
      throw new Error(`Failed to search memories: ${error.message}`);
    }
  }
  
  /**
   * Get all memories for an agent
   */
  async getAgentMemories(did, limit = 100, offset = 0) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      const queryResult = await this.milvusClient.query({
        collection_name: this.collectionName,
        filter: `did == "${did}"`,
        output_fields: ['id', 'content', 'memory_type', 'timestamp', 'metadata'],
        limit: limit,
        offset: offset
      });
      
      return queryResult.data.map(item => ({
        id: item.id,
        content: item.content,
        memoryType: item.memory_type,
        timestamp: parseInt(item.timestamp),
        metadata: JSON.parse(item.metadata || '{}')
      }));
    } catch (error) {
      console.error('Error getting memories:', error);
      throw new Error(`Failed to get memories: ${error.message}`);
    }
  }
  
  /**
   * Get memory by ID
   */
  async getMemoryById(id) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      const queryResult = await this.milvusClient.query({
        collection_name: this.collectionName,
        filter: `id == "${id}"`,
        output_fields: ['id', 'did', 'content', 'memory_type', 'timestamp', 'metadata'],
        limit: 1
      });
      
      if (queryResult.data.length === 0) {
        return null;
      }
      
      const item = queryResult.data[0];
      return {
        id: item.id,
        did: item.did,
        content: item.content,
        memoryType: item.memory_type,
        timestamp: parseInt(item.timestamp),
        metadata: JSON.parse(item.metadata || '{}')
      };
    } catch (error) {
      console.error('Error getting memory:', error);
      throw new Error(`Failed to get memory: ${error.message}`);
    }
  }
  
  /**
   * Delete memories for an agent
   */
  async deleteAgentMemories(did) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      await this.milvusClient.delete({
        collection_name: this.collectionName,
        filter: `did == "${did}"`
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error
