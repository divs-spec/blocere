// ========================================
// demo/complete-demo.js
// ========================================

const NeuroVaultAgent = require('../ai-agent/src/NeuroVaultAgent');
require('dotenv').config();

async function runCompleteDemo() {
  console.log("🎬 NeuroVault Complete Demo\n");
  console.log("=" .repeat(60));

  // Initialize agent
  console.log("\n1️⃣  Initializing AI Agent...");
  const agent = new NeuroVaultAgent({
    did: 'did:neurovault:demo-' + Date.now(),
    apiUrl: process.env.API_URL || 'http://localhost:3001/api',
    privateKey: process.env.AGENT_PRIVATE_KEY,
    rpcUrl: process.env.QIE_RPC_URL,
    openaiApiKey: process.env.OPENAI_API_KEY
  });
  console.log("✅ Agent initialized with DID:", agent.did);

  // Demo 1: Store conversation memory
  console.log("\n2️⃣  Storing Conversation Memory...");
  const conversationResult = await agent.rememberConversation([
    {
      role: 'user',
      content: 'Can you explain how blockchain consensus mechanisms work?'
    },
    {
      role: 'assistant',
      content: 'Blockchain consensus mechanisms are protocols that ensure all nodes in a distributed network agree on the current state of the blockchain. The most common types are Proof of Work (PoW), used by Bitcoin, and Proof of Stake (PoS), used by Ethereum 2.0. PoW requires miners to solve complex mathematical puzzles, while PoS selects validators based on their stake in the network.'
    }
  ], ['blockchain', 'consensus', 'education']);
  
  console.log("✅ Conversation stored:");
  console.log("   Vector ID:", conversationResult.vectorId);
  console.log("   Content Hash:", conversationResult.contentHash);
  console.log("   Summary:", conversationResult.summary);

  // Demo 2: Store learning memory
  console.log("\n3️⃣  Storing Learning Experience...");
  const learningResult = await agent.rememberLearning(
    'Smart Contract Security',
    'Learned about common vulnerabilities in smart contracts including reentrancy attacks, integer overflow, and front-running.',
    [
      'Always use ReentrancyGuard for external calls',
      'Use SafeMath library for arithmetic operations',
      'Be aware of transaction ordering and MEV',
      'Conduct thorough audits before deployment'
    ]
  );
  console.log("✅ Learning stored:", learningResult.vectorId);

  // Demo 3: Store decision memory
  console.log("\n4️⃣  Recording Decision...");
  const decisionResult = await agent.rememberDecision(
    'Recommended implementing multi-signature wallet for user funds',
    'Analysis showed single point of failure in current architecture. Multi-sig reduces risk of unauthorized access by requiring multiple approvals. Industry standard for DeFi protocols managing significant TVL.',
    {
      implemented: true,
      securityImprovement: '+85%',
      userSatisfaction: '4.8/5'
    }
  );
  console.log("✅ Decision recorded:", decisionResult.vectorId);

  // Demo 4: Recall similar memories
  console.log("\n5️⃣  Recalling Relevant Memories...");
  const query = "What security practices should I follow for smart contracts?";
  console.log("   Query:", query);
  
  const memories = await agent.recall(query, 3);
  console.log(`✅ Found ${memories.length} relevant memories:`);
  memories.forEach((mem, idx) => {
    console.log(`\n   ${idx + 1}. ${mem.memoryType.toUpperCase()}`);
    console.log(`      Similarity: ${(mem.similarity * 100).toFixed(1)}%`);
    if (mem.content.topic) {
      console.log(`      Topic: ${mem.content.topic}`);
    }
  });

  // Demo 5: Generate contextual response
  console.log("\n6️⃣  Generating Contextual Response...");
  const responseResult = await agent.generateResponse(
    "Should I use PoW or PoS for my blockchain project?"
  );
  console.log("✅ Response generated:");
  console.log("   Used memories:", responseResult.usedMemories);
  console.log("   Confidence:", responseResult.confidence);
  console.log("   Response:", responseResult.response.substring(0, 200) + "...");

  // Demo 6: Get statistics
  console.log("\n7️⃣  Fetching Agent Statistics...");
  const stats = await agent.getStats();
  console.log("✅ Statistics:");
  console.log("   Blockchain:");
  console.log("     Total Memories:", stats.blockchain.totalMemories);
  console.log("     Storage Used:", stats.blockchain.storageUsed, "bytes");
  console.log("   Vector DB:");
  console.log("     Total Memories:", stats.vector.totalMemories);
  console.log("     By Type:", JSON.stringify(stats.vector.byType));

  // Demo 7: Verify memory integrity
  console.log("\n8️⃣  Verifying Memory Integrity...");
  const isValid = await agent.verifyMemory(1, conversationResult.vectorId);
  console.log("✅ Memory verification:", isValid ? "VALID ✓" : "INVALID ✗");

  // Demo 8: Check reputation
  console.log("\n9️⃣  Checking Agent Reputation...");
  const reputation = await agent.getReputation();
  console.log("✅ Reputation Score:");
  console.log("   Total Score:", reputation.totalScore, "/100");
  console.log("   Interaction Quality:", reputation.interactionQuality, "/40");
  console.log("   Consistency:", reputation.consistency, "/30");
  console.log("   Transparency:", reputation.transparency, "/20");
  console.log("   Experience:", reputation.experience, "/10");

  // Demo 9: Submit performance report
  console.log("\n🔟 Submitting Performance Report...");
  await agent.submitPerformanceReport(
    5,
    "Successfully completed all demo tasks with accurate responses and proper memory management."
  );
  console.log("✅ Performance report submitted");

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 Demo Complete!\n");
  console.log("Summary of what we demonstrated:");
  console.log("✅ Created AI agent with decentralized identity");
  console.log("✅ Stored conversation, learning, and decision memories");
  console.log("✅ Performed semantic search across memories");
  console.log("✅ Generated context-aware responses");
  console.log("✅ Verified memory integrity on blockchain");
  console.log("✅ Tracked reputation and trust scores");
  console.log("\n📊 All memories are now immutably stored on QIE blockchain");
  console.log("🔒 Vector embeddings are cryptographically verified");
  console.log("🌐 Agent behavior is transparently auditable");
  console.log("\n" + "=".repeat(60));
}

// Run demo
if (require.main === module) {
  runCompleteDemo()
    .then(() => {
      console.log("\n✅ Demo completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Demo failed:", error);
      process.exit(1);
    });
}

module.exports = runCompleteDemo;
