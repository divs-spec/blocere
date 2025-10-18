// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title AIIdentity
 * @notice Decentralized Identity Management for AI Agents
 * @dev Each AI agent gets a unique DID with metadata and access control
 */
contract AIIdentity {
    
    // Structs
    struct Agent {
        string did;                  // Unique identifier
        address owner;              // Owner address
        string agentType;           // e.g., "trading-bot", "research-assistant"
        string modelVersion;        // AI model version
        uint256 createdAt;          // Creation timestamp
        uint256 lastActive;         // Last interaction timestamp
        bool isActive;              // Active status
        string metadataURI;         // IPFS URI for additional metadata
    }
    
    // State variables
    mapping(string => Agent) public agents;           // DID => Agent
    mapping(address => string[]) public ownerAgents;  // Owner => DIDs
    mapping(string => bool) public didExists;         // DID existence check
    
    uint256 public totalAgents;
    
    // Events
    event AgentCreated(
        string indexed did,
        address indexed owner,
        string agentType,
        uint256 timestamp
    );
    
    event AgentUpdated(
        string indexed did,
        string metadataURI,
        uint256 timestamp
    );
    
    event AgentDeactivated(
        string indexed did,
        uint256 timestamp
    );
    
    event AgentTransferred(
        string indexed did,
        address indexed from,
        address indexed to,
        uint256 timestamp
    );
    
    // Modifiers
    modifier onlyOwner(string memory _did) {
        require(agents[_did].owner == msg.sender, "Not the agent owner");
        _;
    }
    
    modifier didNotExists(string memory _did) {
        require(!didExists[_did], "DID already exists");
        _;
    }
    
    modifier validDID(string memory _did) {
        require(didExists[_did], "DID does not exist");
        _;
    }
    
    /**
     * @notice Create a new AI agent identity
     * @param _did Unique decentralized identifier
     * @param _agentType Type of AI agent
     * @param _modelVersion AI model version
     * @param _metadataURI IPFS URI for metadata
     */
    function createAgent(
        string memory _did,
        string memory _agentType,
        string memory _modelVersion,
        string memory _metadataURI
    ) external didNotExists(_did) {
        require(bytes(_did).length > 0, "DID cannot be empty");
        require(bytes(_agentType).length > 0, "Agent type required");
        
        agents[_did] = Agent({
            did: _did,
            owner: msg.sender,
            agentType: _agentType,
            modelVersion: _modelVersion,
            createdAt: block.timestamp,
            lastActive: block.timestamp,
            isActive: true,
            metadataURI: _metadataURI
        });
        
        didExists[_did] = true;
        ownerAgents[msg.sender].push(_did);
        totalAgents++;
        
        emit AgentCreated(_did, msg.sender, _agentType, block.timestamp);
    }
    
    /**
     * @notice Update agent metadata
     * @param _did Agent DID
     * @param _metadataURI New metadata URI
     */
    function updateMetadata(
        string memory _did,
        string memory _metadataURI
    ) external validDID(_did) onlyOwner(_did) {
        agents[_did].metadataURI = _metadataURI;
        agents[_did].lastActive = block.timestamp;
        
        emit AgentUpdated(_did, _metadataURI, block.timestamp);
    }
    
    /**
     * @notice Update last active timestamp
     * @param _did Agent DID
     */
    function updateActivity(string memory _did) external validDID(_did) {
        require(
            agents[_did].owner == msg.sender || msg.sender == address(this),
            "Unauthorized"
        );
        agents[_did].lastActive = block.timestamp;
    }
    
    /**
     * @notice Deactivate an agent
     * @param _did Agent DID
     */
    function deactivateAgent(string memory _did) 
        external 
        validDID(_did) 
        onlyOwner(_did) 
    {
        agents[_did].isActive = false;
        
        emit AgentDeactivated(_did, block.timestamp);
    }
    
    /**
     * @notice Transfer agent ownership
     * @param _did Agent DID
     * @param _newOwner New owner address
     */
    function transferOwnership(
        string memory _did,
        address _newOwner
    ) external validDID(_did) onlyOwner(_did) {
        require(_newOwner != address(0), "Invalid address");
        require(_newOwner != agents[_did].owner, "Already owner");
        
        address oldOwner = agents[_did].owner;
        agents[_did].owner = _newOwner;
        
        // Update owner mappings
        ownerAgents[_newOwner].push(_did);
        
        emit AgentTransferred(_did, oldOwner, _newOwner, block.timestamp);
    }
    
    /**
     * @notice Get agent details
     * @param _did Agent DID
     */
    function getAgent(string memory _did) 
        external 
        view 
        validDID(_did) 
        returns (Agent memory) 
    {
        return agents[_did];
    }
    
    /**
     * @notice Get all DIDs owned by an address
     * @param _owner Owner address
     */
    function getOwnerAgents(address _owner) 
        external 
        view 
        returns (string[] memory) 
    {
        return ownerAgents[_owner];
    }
    
    /**
     * @notice Check if agent is active
     * @param _did Agent DID
     */
    function isAgentActive(string memory _did) 
        external 
        view 
        validDID(_did) 
        returns (bool) 
    {
        return agents[_did].isActive;
    }
    
    /**
     * @notice Verify agent ownership
     * @param _did Agent DID
     * @param _address Address to check
     */
    function verifyOwnership(string memory _did, address _address) 
        external 
        view 
        validDID(_did) 
        returns (bool) 
    {
        return agents[_did].owner == _address;
    }
}
