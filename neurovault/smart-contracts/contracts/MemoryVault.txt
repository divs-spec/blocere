// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./AIIdentity.sol";

/**
 * @title MemoryVault
 * @notice Immutable, versioned storage for AI agent memories
 * @dev Stores hashes of vector embeddings with metadata
 */
contract MemoryVault {
    
    AIIdentity public identityContract;
    
    // Structs
    struct Memory {
        string did;                 // Agent DID
        bytes32 contentHash;        // SHA-256 hash of embedding
        string memoryType;          // e.g., "conversation", "learning", "decision"
        string summary;             // Brief description
        uint256 timestamp;          // When memory was created
        uint256 version;            // Memory version number
        string vectorDBId;          // Reference to off-chain vector DB
        bool isEncrypted;           // Whether off-chain data is encrypted
        string[] tags;              // Searchable tags
    }
    
    struct MemoryStats {
        uint256 totalMemories;
        uint256 lastUpdate;
        uint256 storageUsed;        // Approximate storage in bytes
    }
    
    // State variables
    mapping(string => Memory[]) public agentMemories;        // DID => Memory[]
    mapping(string => MemoryStats) public agentStats;        // DID => Stats
    mapping(bytes32 => bool) public memoryExists;            // Hash existence
    mapping(string => mapping(address => bool)) public readAccess;  // DID => Address => Access
    
    uint256 public totalMemoriesStored;
    uint256 public constant MAX_SUMMARY_LENGTH = 500;
    uint256 public constant MAX_TAGS = 10;
    
    // Events
    event MemoryStored(
        string indexed did,
        bytes32 indexed contentHash,
        string memoryType,
        uint256 version,
        uint256 timestamp
    );
    
    event MemoryVerified(
        string indexed did,
        bytes32 indexed contentHash,
        address verifier,
        bool isValid,
        uint256 timestamp
    );
    
    event AccessGranted(
        string indexed did,
        address indexed grantee,
        uint256 timestamp
    );
    
    event AccessRevoked(
        string indexed did,
        address indexed revokee,
        uint256 timestamp
    );
    
    // Modifiers
    modifier onlyAgentOwner(string memory _did) {
        require(
            identityContract.verifyOwnership(_did, msg.sender),
            "Not agent owner"
        );
        _;
    }
    
    modifier hasReadAccess(string memory _did) {
        require(
            identityContract.verifyOwnership(_did, msg.sender) ||
            readAccess[_did][msg.sender],
            "No read access"
        );
        _;
    }
    
    modifier validDID(string memory _did) {
        require(identityContract.didExists(_did), "Invalid DID");
        _;
    }
    
    constructor(address _identityContract) {
        identityContract = AIIdentity(_identityContract);
    }
    
    /**
     * @notice Store a new memory for an AI agent
     * @param _did Agent DID
     * @param _contentHash SHA-256 hash of vector embedding
     * @param _memoryType Type of memory
     * @param _summary Brief summary
     * @param _vectorDBId Reference to vector database
     * @param _isEncrypted Whether data is encrypted
     * @param _tags Searchable tags
     */
    function storeMemory(
        string memory _did,
        bytes32 _contentHash,
        string memory _memoryType,
        string memory _summary,
        string memory _vectorDBId,
        bool _isEncrypted,
        string[] memory _tags
    ) external validDID(_did) onlyAgentOwner(_did) {
        require(_contentHash != bytes32(0), "Invalid content hash");
        require(bytes(_summary).length <= MAX_SUMMARY_LENGTH, "Summary too long");
        require(_tags.length <= MAX_TAGS, "Too many tags");
        require(!memoryExists[_contentHash], "Memory already exists");
        
        uint256 version = agentMemories[_did].length + 1;
        
        Memory memory newMemory = Memory({
            did: _did,
            contentHash: _contentHash,
            memoryType: _memoryType,
            summary: _summary,
            timestamp: block.timestamp,
            version: version,
            vectorDBId: _vectorDBId,
            isEncrypted: _isEncrypted,
            tags: _tags
        });
        
        agentMemories[_did].push(newMemory);
        memoryExists[_contentHash] = true;
        
        // Update stats
        agentStats[_did].totalMemories++;
        agentStats[_did].lastUpdate = block.timestamp;
        agentStats[_did].storageUsed += bytes(_summary).length;
        
        totalMemoriesStored++;
        
        // Update agent activity
        identityContract.updateActivity(_did);
        
        emit MemoryStored(_did, _contentHash, _memoryType, version, block.timestamp);
    }
    
    /**
     * @notice Verify memory integrity
     * @param _did Agent DID
     * @param _version Memory version
     * @param _providedHash Hash to verify against
     */
    function verifyMemory(
        string memory _did,
        uint256 _version,
        bytes32 _providedHash
    ) external validDID(_did) returns (bool) {
        require(_version > 0 && _version <= agentMemories[_did].length, "Invalid version");
        
        Memory memory mem = agentMemories[_did][_version - 1];
        bool isValid = mem.contentHash == _providedHash;
        
        emit MemoryVerified(_did, _providedHash, msg.sender, isValid, block.timestamp);
        
        return isValid;
    }
    
    /**
     * @notice Get all memories for an agent
     * @param _did Agent DID
     */
    function getAgentMemories(string memory _did) 
        external 
        view 
        validDID(_did)
        hasReadAccess(_did)
        returns (Memory[] memory) 
    {
        return agentMemories[_did];
    }
    
    /**
     * @notice Get a specific memory by version
     * @param _did Agent DID
     * @param _version Memory version
     */
    function getMemory(string memory _did, uint256 _version) 
        external 
        view 
        validDID(_did)
        hasReadAccess(_did)
        returns (Memory memory) 
    {
        require(_version > 0 && _version <= agentMemories[_did].length, "Invalid version");
        return agentMemories[_did][_version - 1];
    }
    
    /**
     * @notice Get memory statistics for an agent
     * @param _did Agent DID
     */
    function getStats(string memory _did) 
        external 
        view 
        validDID(_did)
        returns (MemoryStats memory) 
    {
        return agentStats[_did];
    }
    
    /**
     * @notice Get memories by type
     * @param _did Agent DID
     * @param _memoryType Type to filter by
     */
    function getMemoriesByType(string memory _did, string memory _memoryType) 
        external 
        view 
        validDID(_did)
        hasReadAccess(_did)
        returns (Memory[] memory) 
    {
        Memory[] memory allMemories = agentMemories[_did];
        uint256 count = 0;
        
        // Count matching memories
        for (uint256 i = 0; i < allMemories.length; i++) {
            if (keccak256(bytes(allMemories[i].memoryType)) == keccak256(bytes(_memoryType))) {
                count++;
            }
        }
        
        // Create result array
        Memory[] memory result = new Memory[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allMemories.length; i++) {
            if (keccak256(bytes(allMemories[i].memoryType)) == keccak256(bytes(_memoryType))) {
                result[index] = allMemories[i];
                index++;
            }
        }
        
        return result;
    }
    
    /**
     * @notice Grant read access to another address
     * @param _did Agent DID
     * @param _grantee Address to grant access to
     */
    function grantReadAccess(string memory _did, address _grantee) 
        external 
        validDID(_did)
        onlyAgentOwner(_did) 
    {
        require(_grantee != address(0), "Invalid address");
        require(!readAccess[_did][_grantee], "Already has access");
        
        readAccess[_did][_grantee] = true;
        
        emit AccessGranted(_did, _grantee, block.timestamp);
    }
    
    /**
     * @notice Revoke read access from an address
     * @param _did Agent DID
     * @param _revokee Address to revoke access from
     */
    function revokeReadAccess(string memory _did, address _revokee) 
        external 
        validDID(_did)
        onlyAgentOwner(_did) 
    {
        require(readAccess[_did][_revokee], "No access to revoke");
        
        readAccess[_did][_revokee] = false;
        
        emit AccessRevoked(_did, _revokee, block.timestamp);
    }
    
    /**
     * @notice Check if address has read access
     * @param _did Agent DID
     * @param _address Address to check
     */
    function checkReadAccess(string memory _did, address _address) 
        external 
        view 
        validDID(_did)
        returns (bool) 
    {
        return identityContract.verifyOwnership(_did, _address) || readAccess[_did][_address];
    }
    
    /**
     * @notice Get latest N memories for an agent
     * @param _did Agent DID
     * @param _count Number of memories to retrieve
     */
    function getLatestMemories(string memory _did, uint256 _count) 
        external 
        view 
        validDID(_did)
        hasReadAccess(_did)
        returns (Memory[] memory) 
    {
        Memory[] memory allMemories = agentMemories[_did];
        uint256 total = allMemories.length;
        
        if (_count > total) {
            _count = total;
        }
        
        Memory[] memory result = new Memory[](_count);
        
        for (uint256 i = 0; i < _count; i++) {
            result[i] = allMemories[total - _count + i];
        }
        
        return result;
    }
}
