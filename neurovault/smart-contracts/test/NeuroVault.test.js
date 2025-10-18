// ========================================
// smart-contracts/test/NeuroVault.test.js
// ========================================

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NeuroVault Full Stack Tests", function () {
  let aiIdentity, memoryVault, reputationOracle;
  let owner, user1, user2;
  let testDID;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy contracts
    const AIIdentity = await ethers.getContractFactory("AIIdentity");
    aiIdentity = await AIIdentity.deploy();
    await aiIdentity.waitForDeployment();

    const MemoryVault = await ethers.getContractFactory("MemoryVault");
    memoryVault = await MemoryVault.deploy(await aiIdentity.getAddress());
    await aiIdentity.waitForDeployment();

    const ReputationOracle = await ethers.getContractFactory("ReputationOracle");
    reputationOracle = await ReputationOracle.deploy(
      await aiIdentity.getAddress(),
      await memoryVault.getAddress()
    );
    await reputationOracle.waitForDeployment();

    testDID = "did:neurovault:test-" + Date.now();
  });

  describe("AIIdentity Tests", function () {
    it("Should create a new agent", async function () {
      const tx = await aiIdentity.createAgent(
        testDID,
        "Trading Bot",
        "GPT-4",
        "ipfs://metadata"
      );
      await tx.wait();

      const agent = await aiIdentity.getAgent(testDID);
      expect(agent.did).to.equal(testDID);
      expect(agent.agentType).to.equal("Trading Bot");
      expect(agent.owner).to.equal(owner.address);
    });

    it("Should prevent duplicate DIDs", async function () {
      await aiIdentity.createAgent(testDID, "Bot1", "GPT-4", "");
      
      await expect(
        aiIdentity.createAgent(testDID, "Bot2", "GPT-3", "")
      ).to.be.revertedWith("DID already exists");
    });

    it("Should transfer agent ownership", async function () {
      await aiIdentity.createAgent(testDID, "Bot", "GPT-4", "");
      
      await aiIdentity.transferOwnership(testDID, user1.address);
      
      const agent = await aiIdentity.getAgent(testDID);
      expect(agent.owner).to.equal(user1.address);
    });
  });

  describe("MemoryVault Tests", function () {
    beforeEach(async function () {
      await aiIdentity.createAgent(testDID, "Bot", "GPT-4", "");
    });

    it("Should store a memory", async function () {
      const contentHash = ethers.keccak256(ethers.toUtf8Bytes("test memory"));
      
      const tx = await memoryVault.storeMemory(
        testDID,
        contentHash,
        "conversation",
        "Test memory summary",
        "vector-id-123",
        false,
        ["test", "demo"]
      );
      await tx.wait();

      const memories = await memoryVault.getAgentMemories(testDID);
      expect(memories.length).to.equal(1);
      expect(memories[0].summary).to.equal("Test memory summary");
    });

    it("Should verify memory integrity", async function () {
      const content = "test memory content";
      const contentHash = ethers.keccak256(ethers.toUtf8Bytes(content));
      
      await memoryVault.storeMemory(
        testDID,
        contentHash,
        "learning",
        "Summary",
        "vid-1",
        false,
        []
      );

      const isValid = await memoryVault.verifyMemory(testDID, 1, contentHash);
      expect(isValid).to.be.true;
    });

    it("Should track memory statistics", async function () {
      const hash1 = ethers.keccak256(ethers.toUtf8Bytes("memory1"));
      const hash2 = ethers.keccak256(ethers.toUtf8Bytes("memory2"));
      
      await memoryVault.storeMemory(testDID, hash1, "conversation", "S1", "v1", false, []);
      await memoryVault.storeMemory(testDID, hash2, "learning", "S2", "v2", false, []);

      const stats = await memoryVault.getStats(testDID);
      expect(stats.totalMemories).to.equal(2);
    });
  });

  describe("ReputationOracle Tests", function () {
    beforeEach(async function () {
      await aiIdentity.createAgent(testDID, "Bot", "GPT-4", "");
    });

    it("Should submit feedback", async function () {
      const tx = await reputationOracle.submitFeedback(
        testDID,
        true,
        5,
        "Great agent!"
      );
      await tx.wait();

      const reputation = await reputationOracle.getReputation(testDID);
      expect(reputation.totalInteractions).to.equal(1);
      expect(reputation.positiveVotes).to.equal(1);
    });

    it("Should prevent duplicate voting", async function () {
      await reputationOracle.submitFeedback(testDID, true, 5, "Good");
      
      await expect(
        reputationOracle.submitFeedback(testDID, true, 4, "Also good")
      ).to.be.revertedWith("Already voted");
    });

    it("Should calculate trust level", async function () {
      // Submit multiple feedback
      await reputationOracle.submitFeedback(testDID, true, 5, "Excellent");
      
      await reputationOracle.connect(user1).submitFeedback(testDID, true, 5, "Great");
      await reputationOracle.connect(user2).submitFeedback(testDID, true, 4, "Good");

      const trustLevel = await reputationOracle.getTrustLevel(testDID);
      expect(trustLevel).to.be.oneOf(["New", "Developing", "Trusted"]);
    });
  });
});
