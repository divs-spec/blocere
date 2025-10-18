// backend/src/routes/reputationRoutes.js

const express3 = require('express');
const router3 = express3.Router();
const getBlockchainService3 = require('../services/blockchain');

/**
 * POST /api/reputation/feedback
 * Submit feedback for an agent
 */
router3.post('/feedback', async (req, res) => {
  try {
    const { did, isPositive, rating, comment } = req.body;
    
    if (!did || rating === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: did, rating' 
      });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        error: 'Rating must be between 1 and 5' 
      });
    }
    
    const blockchain = getBlockchainService3();
    
    const result = await blockchain.submitFeedback(
      did,
      isPositive !== false,
      rating,
      comment || ''
    );
    
    res.json({
      success: true,
      transaction: result.transactionHash
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/reputation/:did
 * Get reputation score
 */
router3.get('/:did', async (req, res) => {
  try {
    const { did } = req.params;
    const blockchain = getBlockchainService3();
    
    const reputation = await blockchain.getReputation(did);
    const trustLevel = await blockchain.getTrustLevel(did);
    const feedback = await blockchain.getFeedback(did);
    
    res.json({
      reputation,
      trustLevel,
      feedbackCount: feedback.length,
      recentFeedback: feedback.slice(-10)
    });
  } catch (error) {
    console.error('Error fetching reputation:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/reputation/update/:did
 * Manually trigger reputation score update
 */
router3.post('/update/:did', async (req, res) => {
  try {
    const { did } = req.params;
    const blockchain = getBlockchainService3();
    
    await blockchain.updateReputationScore(did);
    const updatedReputation = await blockchain.getReputation(did);
    
    res.json({
      success: true,
      reputation: updatedReputation
    });
  } catch (error) {
    console.error('Error updating reputation:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/reputation/feedback/:did
 * Get all feedback for an agent
 */
router3.get('/feedback/:did', async (req, res) => {
  try {
    const { did } = req.params;
    const blockchain = getBlockchainService3();
    
    const feedback = await blockchain.getFeedback(did);
    
    res.json({ feedback });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ error: error.message });
  }
});
