// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./AIIdentity.sol";
import "./MemoryVault.sol";

/**
 * @title ReputationOracle
 * @notice Calculates and manages trust scores for AI agents
 * @dev Uses on-chain behavioral data to compute reputation
 */
contract ReputationOracle {
    
    AIIdentity public identityContract;
    MemoryVault public memoryVault;
    
    // Structs
    struct ReputationScore {
        uint256 totalScore;              // Overall score (0-100)
        uint256 interactionQuality;      // Based on feedback (0-40)
        uint256 consistency;             // Behavioral patterns (0-30)
        uint256 transparency;            // Memory disclosure (0-20)
        uint256 experience;              // Age and depth (0-10)
        uint256 totalInteractions;       // Number of interactions
        uint256 positiveVotes;           // Positive feedback count
        uint256 negativeVotes;           // Negative feedback count
        uint256 lastUpdated;             // Last score update
    }
    
    struct Feedback {
        address user;
        string did;
        bool isPositive;
        uint8 rating;                    // 1-5 stars
        string comment;
        uint256 timestamp;
    }
    
    // State variables
    mapping(string => ReputationScore) public reputations;
    mapping(string => Feedback[]) public agentFeedback;
    mapping(string => mapping(address => bool)) public hasVoted;
    mapping(address => bool) public authorizedUpdaters;
    
    address public owner;
    uint256 public constant MIN_INTERACTIONS_FOR_SCORE = 5;
    uint256 public constant SCORE_DECAY_PERIOD = 30 days;
    
    // Events
    event ScoreUpdated(
        string indexed did,
        uint256 totalScore,
        uint256 timestamp
    );
    
    event FeedbackSubmitted(
        string indexed did,
        address indexed user,
        bool isPositive,
        uint8 rating,
        uint256 timestamp
    );
    
    event UpdaterAuthorized(
        address indexed updater,
        uint256 timestamp
    );
    
    event UpdaterRevoked(
        address indexed updater,
        uint256 timestamp
    );
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier onlyAuthorized() {
        require(authorizedUpdaters[msg.sender] || msg.sender == owner, "Not authorized");
        _;
    }
    
    modifier validDID(string memory _did) {
        require(identityContract.didExists(_did), "Invalid DID");
        _;
    }
    
    constructor(address _identityContract, address _memoryVault) {
        identityContract = AIIdentity(_identityContract);
        memoryVault = MemoryVault(_memoryVault);
        owner = msg.sender;
        authorizedUpdaters[msg.sender] = true;
    }
    
    /**
     * @notice Submit feedback for an AI agent
     * @param _did Agent DID
     * @param _isPositive Whether feedback is positive
     * @param _rating Rating 1-5
     * @param _comment Optional comment
     */
    function submitFeedback(
        string memory _did,
        bool _isPositive,
        uint8 _rating,
        string memory _comment
    ) external validDID(_did) {
        require(_rating >= 1 && _rating <= 5, "Rating must be 1-5");
        require(!hasVoted[_did][msg.sender], "Already voted");
        require(bytes(_comment).length <= 500, "Comment too long");
        
        Feedback memory feedback = Feedback({
            user: msg.sender,
            did: _did,
            isPositive: _isPositive,
            rating: _rating,
            comment: _comment,
            timestamp: block.timestamp
        });
        
        agentFeedback[_did].push(feedback);
        hasVoted[_did][msg.sender] = true;
        
        // Update reputation counters
        reputations[_did].totalInteractions++;
        if (_isPositive) {
            reputations[_did].positiveVotes++;
        } else {
            reputations[_did].negativeVotes++;
        }
        
        emit FeedbackSubmitted(_did, msg.sender, _isPositive, _rating, block.timestamp);
        
        // Auto-update score if enough interactions
        if (reputations[_did].totalInteractions >= MIN_INTERACTIONS_FOR_SCORE) {
            _updateScore(_did);
        }
    }
    
    /**
     * @notice Calculate and update reputation score
     * @param _did Agent DID
     */
    function updateScore(string memory _did) external validDID(_did) onlyAuthorized {
        _updateScore(_did);
    }
    
    /**
     * @notice Internal score calculation
     * @param _did Agent DID
     */
    function _updateScore(string memory _did) internal {
        ReputationScore storage rep = reputations[_did];
        
        // 1. Calculate Interaction Quality (0-40)
        rep.interactionQuality = _calculateInteractionQuality(_did);
        
        // 2. Calculate Consistency (0-30)
        rep.consistency = _calculateConsistency(_did);
        
        // 3. Calculate Transparency (0-20)
        rep.transparency = _calculateTransparency(_did);
        
        // 4. Calculate Experience (0-10)
        rep.experience = _calculateExperience(_did);
        
        // Calculate total score
        rep.totalScore = rep.interactionQuality + rep.consistency + 
                        rep.transparency + rep.experience;
        
        rep.lastUpdated = block.timestamp;
        
        emit ScoreUpdated(_did, rep.totalScore, block.timestamp);
    }
    
    /**
     * @notice Calculate interaction quality score
     */
    function _calculateInteractionQuality(string memory _did) 
        internal 
        view 
        returns (uint256) 
    {
        ReputationScore storage rep = reputations[_did];
        
        if (rep.totalInteractions == 0) return 0;
        
        // Calculate percentage of positive votes
        uint256 positiveRate = (rep.positiveVotes * 100) / rep.totalInteractions;
        
        // Calculate average rating
        uint256 totalRating = 0;
        Feedback[] memory feedbacks = agentFeedback[_did];
        
        for (uint256 i = 0; i < feedbacks.length; i++) {
            totalRating += feedbacks[i].rating;
        }
        
        uint256 avgRating = totalRating / feedbacks.length;
        
        // Weighted score: 60% positive rate, 40% average rating
        uint256 score = (positiveRate * 24 / 100) + (avgRating * 16 / 5);
        
        return score > 40 ? 40 : score;
    }
    
    /**
     * @notice Calculate consistency score based on activity patterns
     */
    function _calculateConsistency(string memory _did) 
        internal 
        view 
        returns (uint256) 
    {
        MemoryVault.MemoryStats memory stats = memoryVault.getStats(_did);
        
        if (stats.totalMemories == 0) return 0;
        
        // Check if agent is active regularly
        uint256 daysSinceLastUpdate = (block.timestamp - stats.lastUpdate) / 1 days;
        
        // Penalize if inactive for too long
        if (daysSinceLastUpdate > 30) return 5;
        if (daysSinceLastUpdate > 14) return 15;
        if (daysSinceLastUpdate > 7) return 20;
        
        // Reward consistent memory updates
        uint256 memoriesScore = stats.totalMemories > 100 ? 30 : 
                               (stats.totalMemories * 30) / 100;
        
        return memoriesScore;
    }
    
    /**
     * @notice Calculate transparency score
     */
    function _calculateTransparency(string memory _did) 
        internal 
        view 
        returns (uint256) 
    {
        MemoryVault.MemoryStats memory stats = memoryVault.getStats(_did);
        
        // Score based on memory depth and accessibility
        if (stats.totalMemories == 0) return 0;
        
        // More memories = more transparent
        uint256 memoryScore = stats.totalMemories >= 50 ? 10 : 
                             (stats.totalMemories * 10) / 50;
        
        // Recent updates = active transparency
        uint256 daysSinceUpdate = (block.timestamp - stats.lastUpdate) / 1 days;
        uint256 recencyScore = daysSinceUpdate > 7 ? 5 : 10;
        
        return memoryScore + recencyScore;
    }
    
    /**
     * @notice Calculate experience score
     */
    function _calculateExperience(string memory _did) 
        internal 
        view 
        returns (uint256) 
    {
        AIIdentity.Agent memory agent = identityContract.getAgent(_did);
        MemoryVault.MemoryStats memory stats = memoryVault.getStats(_did);
        
        // Age score (max 5 points)
        uint256 daysSinceCreation = (block.timestamp - agent.createdAt) / 1 days;
        uint256 ageScore = daysSinceCreation >= 90 ? 5 : 
                          (daysSinceCreation * 5) / 90;
        
        // Memory depth score (max 5 points)
        uint256 depthScore = stats.totalMemories >= 100 ? 5 : 
                            (stats.totalMemories * 5) / 100;
        
        return ageScore + depthScore;
    }
    
    /**
     * @notice Get full reputation details
     */
    function getReputation(string memory _did) 
        external 
        view 
        validDID(_did)
        returns (ReputationScore memory) 
    {
        return reputations[_did];
    }
    
    /**
     * @notice Get all feedback for an agent
     */
    function getFeedback(string memory _did) 
        external 
        view 
        validDID(_did)
        returns (Feedback[] memory) 
    {
        return agentFeedback[_did];
    }
    
    /**
     * @notice Get trust level category
     */
    function getTrustLevel(string memory _did) 
        external 
        view 
        validDID(_did)
        returns (string memory) 
    {
        uint256 score = reputations[_did].totalScore;
        
        if (score >= 90) return "Exceptional";
        if (score >= 75) return "Highly Trusted";
        if (score >= 60) return "Trusted";
        if (score >= 40) return "Developing";
        if (score >= 20) return "New";
        return "Unrated";
    }
    
    /**
     * @notice Check if user has already voted
     */
    function hasUserVoted(string memory _did, address _user) 
        external 
        view 
        returns (bool) 
    {
        return hasVoted[_did][_user];
    }
    
    /**
     * @notice Authorize an address to update scores
     */
    function authorizeUpdater(address _updater) external onlyOwner {
        require(_updater != address(0), "Invalid address");
        require(!authorizedUpdaters[_updater], "Already authorized");
        
        authorizedUpdaters[_updater] = true;
        
        emit UpdaterAuthorized(_updater, block.timestamp);
    }
    
    /**
     * @notice Revoke updater authorization
     */
    function revokeUpdater(address _updater) external onlyOwner {
        require(authorizedUpdaters[_updater], "Not authorized");
        
        authorizedUpdaters[_updater] = false;
        
        emit UpdaterRevoked(_updater, block.timestamp);
    }
    
    /**
     * @notice Batch update scores for multiple agents
     */
    function batchUpdateScores(string[] memory _dids) external onlyAuthorized {
        for (uint256 i = 0; i < _dids.length; i++) {
            if (identityContract.didExists(_dids[i])) {
                _updateScore(_dids[i]);
            }
        }
    }
    
    /**
     * @notice Get top rated agents
     */
    function getTopAgents(uint256 _count) 
        external 
        view 
        returns (string[] memory, uint256[] memory) 
    {
        // Note: This is a simplified version
        // In production, you'd want off-chain indexing for this
        string[] memory dids = new string[](_count);
        uint256[] memory scores = new uint256[](_count);
        
        // This would need to be implemented with proper sorting
        // For now, returning empty arrays as placeholder
        
        return (dids, scores);
    }
}
