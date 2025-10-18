// ========================================
// backend/src/tests/integration.test.js
// ========================================

const request = require('supertest');
const app = require('../index');

describe('Integration Tests', () => {
  let testDID;
  let vectorId;

  describe('Agent API', () => {
    it('should create a new agent', async () => {
      const response = await request(app)
        .post('/api/agents/create')
        .send({
          agentType: 'Test Bot',
          modelVersion: 'GPT-4',
          metadata: { purpose: 'testing' },
          ownerAddress: '0x1234567890123456789012345678901234567890'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.did).toBeDefined();
      
      testDID = response.body.did;
    });

    it('should get agent details', async () => {
      const response = await request(app)
        .get(`/api/agents/${testDID}`);

      expect(response.status).toBe(200);
      expect(response.body.agent.did).toBe(testDID);
    });
  });

  describe('Memory API', () => {
    it('should store a memory', async () => {
      const response = await request(app)
        .post('/api/memory/store')
        .send({
          did: testDID,
          content: 'Test conversation about AI safety',
          memoryType: 'conversation',
          tags: ['test', 'ai-safety'],
          isEncrypted: false,
          metadata: { test: true }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.vectorId).toBeDefined();
      
      vectorId = response.body.vectorId;
    });

    it('should retrieve agent memories', async () => {
      const response = await request(app)
        .get(`/api/memory/${testDID}`);

      expect(response.status).toBe(200);
      expect(response.body.memories).toBeDefined();
      expect(Array.isArray(response.body.memories)).toBe(true);
    });

    it('should search similar memories', async () => {
      const response = await request(app)
        .post('/api/memory/search')
        .send({
          did: testDID,
          query: 'AI safety',
          limit: 5
        });

      expect(response.status).toBe(200);
      expect(response.body.results).toBeDefined();
    });

    it('should verify memory integrity', async () => {
      const response = await request(app)
        .post('/api/memory/verify')
        .send({
          did: testDID,
          version: 1,
          vectorId: vectorId
        });

      expect(response.status).toBe(200);
      expect(response.body.isValid).toBeDefined();
    });
  });

  describe('Reputation API', () => {
    it('should submit feedback', async () => {
      const response = await request(app)
        .post('/api/reputation/feedback')
        .send({
          did: testDID,
          isPositive: true,
          rating: 5,
          comment: 'Excellent performance'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should get reputation score', async () => {
      const response = await request(app)
        .get(`/api/reputation/${testDID}`);

      expect(response.status).toBe(200);
      expect(response.body.reputation).toBeDefined();
      expect(response.body.trustLevel).toBeDefined();
    });
  });
});
