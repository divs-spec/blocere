import React, { useState, useEffect } from 'react';
import { Brain, Shield, Database, Search, Plus, Eye, TrendingUp, CheckCircle } from 'lucide-react';

// Main App Component
export default function NeuroVaultApp() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [walletAddress, setWalletAddress] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);

  // Connect wallet
  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        setWalletAddress(accounts[0]);
        setIsConnected(true);
        loadUserAgents(accounts[0]);
      } else {
        alert('Please install MetaMask or another Web3 wallet');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  // Load user's agents
  const loadUserAgents = async (address) => {
    // Mock data for demo
    const mockAgents = [
      {
        did: 'did:neurovault:1729234567-abc123',
        agentType: 'Trading Bot',
        modelVersion: 'GPT-4',
        createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
        isActive: true,
        reputation: {
          totalScore: 85,
          totalInteractions: 142,
          positiveVotes: 128
        },
        stats: {
          totalMemories: 256,
          lastUpdate: Date.now() - 3600000
        }
      },
      {
        did: 'did:neurovault:1729234890-def456',
        agentType: 'Research Assistant',
        modelVersion: 'Claude-3',
        createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000,
        isActive: true,
        reputation: {
          totalScore: 92,
          totalInteractions: 89,
          positiveVotes: 85
        },
        stats: {
          totalMemories: 412,
          lastUpdate: Date.now() - 7200000
        }
      }
    ];
    setAgents(mockAgents);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-sm border-b border-purple-500/20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">NeuroVault</h1>
                <p className="text-xs text-purple-300">Where AI remembers responsibly</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {isConnected ? (
                <div className="flex items-center space-x-2 bg-purple-500/20 px-4 py-2 rounded-lg border border-purple-500/30">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-white text-sm">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </span>
                </div>
              ) : (
                <button
                  onClick={connectWallet}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      {isConnected && (
        <nav className="bg-slate-900/50 backdrop-blur-sm border-b border-purple-500/20">
          <div className="container mx-auto px-6">
            <div className="flex space-x-8">
              {['dashboard', 'agents', 'explorer', 'create'].map((view) => (
                <button
                  key={view}
                  onClick={() => setCurrentView(view)}
                  className={`py-4 px-2 border-b-2 transition-all ${
                    currentView === view
                      ? 'border-purple-500 text-purple-400'
                      : 'border-transparent text-gray-400 hover:text-purple-300'
                  }`}
                >
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {!isConnected ? (
          <WelcomeScreen onConnect={connectWallet} />
        ) : currentView === 'dashboard' ? (
          <Dashboard agents={agents} />
        ) : currentView === 'agents' ? (
          <AgentsView agents={agents} onSelect={setSelectedAgent} />
        ) : currentView === 'explorer' ? (
          <MemoryExplorer agent={selectedAgent || agents[0]} />
        ) : (
          <CreateAgent />
        )}
      </main>
    </div>
  );
}

// Welcome Screen
function WelcomeScreen({ onConnect }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
      <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 animate-pulse">
        <Brain className="w-12 h-12 text-white" />
      </div>
      <h2 className="text-4xl font-bold text-white mb-4">
        Welcome to NeuroVault
      </h2>
      <p className="text-xl text-purple-300 mb-8 max-w-2xl">
        Decentralized AI memory layer powered by blockchain. 
        Store, verify, and track your AI agent's learning journey with complete transparency.
      </p>
      <button
        onClick={onConnect}
        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105"
      >
        Connect Wallet to Get Started
      </button>
      
      <div className="grid grid-cols-3 gap-8 mt-16 max-w-4xl">
        <FeatureCard
          icon={Shield}
          title="Verified Memory"
          description="Cryptographic proof of AI learning and evolution"
        />
        <FeatureCard
          icon={Database}
          title="Hybrid Storage"
          description="On-chain hashes, off-chain embeddings for efficiency"
        />
        <FeatureCard
          icon={TrendingUp}
          title="Trust Scores"
          description="Reputation-based AI agent marketplace"
        />
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-purple-500/20">
      <Icon className="w-10 h-10 text-purple-400 mb-4 mx-auto" />
      <h3 className="text-white font-semibold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}

// Dashboard
function Dashboard({ agents }) {
  const totalMemories = agents.reduce((sum, a) => sum + a.stats.totalMemories, 0);
  const avgScore = agents.reduce((sum, a) => sum + a.reputation.totalScore, 0) / (agents.length || 1);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white">Dashboard</h2>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-6">
        <StatCard label="Active Agents" value={agents.length} icon={Brain} color="purple" />
        <StatCard label="Total Memories" value={totalMemories} icon={Database} color="blue" />
        <StatCard label="Avg Trust Score" value={Math.round(avgScore)} icon={Shield} color="green" />
        <StatCard label="Interactions" value="342" icon={TrendingUp} color="pink" />
      </div>

      {/* Recent Activity */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {agents.slice(0, 3).map((agent, idx) => (
            <ActivityItem key={idx} agent={agent} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  const colorClasses = {
    purple: 'from-purple-500 to-purple-600',
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    pink: 'from-pink-500 to-pink-600'
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6">
      <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[color]} rounded-lg flex items-center justify-center mb-4`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
}

function ActivityItem({ agent }) {
  const timeAgo = Math.floor((Date.now() - agent.stats.lastUpdate) / 60000);
  
  return (
    <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-white font-medium">{agent.agentType}</p>
          <p className="text-gray-400 text-sm">Memory updated {timeAgo}m ago</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-purple-400 font-semibold">{agent.stats.totalMemories} memories</p>
        <p className="text-gray-400 text-sm">Score: {agent.reputation.totalScore}</p>
      </div>
    </div>
  );
}

// Agents View
function AgentsView({ agents, onSelect }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-white">My AI Agents</h2>
        <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>Create Agent</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {agents.map((agent, idx) => (
          <AgentCard key={idx} agent={agent} onSelect={() => onSelect(agent)} />
        ))}
      </div>
    </div>
  );
}

function AgentCard({ agent, onSelect }) {
  const daysActive = Math.floor((Date.now() - agent.createdAt) / (24 * 60 * 60 * 1000));
  const trustLevel = agent.reputation.totalScore >= 90 ? 'Exceptional' :
                     agent.reputation.totalScore >= 75 ? 'Highly Trusted' : 'Trusted';

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6 hover:border-purple-500/50 transition-all cursor-pointer" onClick={onSelect}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-white mb-1">{agent.agentType}</h3>
          <p className="text-gray-400 text-sm">{agent.modelVersion}</p>
        </div>
        <div className="flex items-center space-x-1 bg-green-500/20 px-3 py-1 rounded-full">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span className="text-green-400 text-sm">Active</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Trust Score</span>
          <span className="text-purple-400 font-semibold">{agent.reputation.totalScore}/100</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
            style={{ width: `${agent.reputation.totalScore}%` }}
          />
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Trust Level</span>
          <span className="text-white font-medium">{trustLevel}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-700">
        <div className="text-center">
          <p className="text-gray-400 text-xs mb-1">Memories</p>
          <p className="text-white font-semibold">{agent.stats.totalMemories}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-400 text-xs mb-1">Interactions</p>
          <p className="text-white font-semibold">{agent.reputation.totalInteractions}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-400 text-xs mb-1">Days Active</p>
          <p className="text-white font-semibold">{daysActive}</p>
        </div>
      </div>

      <button className="w-full mt-4 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 py-2 rounded-lg transition-all flex items-center justify-center space-x-2">
        <Eye className="w-4 h-4" />
        <span>View Memories</span>
      </button>
    </div>
  );
}

// Memory Explorer
function MemoryExplorer({ agent }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [memories, setMemories] = useState([]);

  useEffect(() => {
    if (agent) {
      // Mock memories
      const mockMemories = [
        {
          version: 1,
          summary: 'Initial training on market analysis. Learned basic candlestick patterns and trend identification.',
          memoryType: 'learning',
          timestamp: Date.now() - 86400000 * 5,
          tags: ['training', 'market-analysis'],
          contentHash: '0x1234...5678',
          verified: true
        },
        {
          version: 2,
          summary: 'Executed successful trade on BTC/USD pair. Applied learned patterns to real market conditions.',
          memoryType: 'decision',
          timestamp: Date.now() - 86400000 * 3,
          tags: ['trading', 'btc', 'success'],
          contentHash: '0xabcd...efgh',
          verified: true
        },
        {
          version: 3,
          summary: 'User feedback session: Improved risk assessment algorithm based on portfolio volatility concerns.',
          memoryType: 'conversation',
          timestamp: Date.now() - 86400000,
          tags: ['feedback', 'improvement'],
          contentHash: '0x9876...5432',
          verified: true
        }
      ];
      setMemories(mockMemories);
    }
  }, [agent]);

  if (!agent) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400 text-lg">Select an agent to view memories</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white">{agent.agentType} Memories</h2>
          <p className="text-gray-400 mt-1">{agent.did}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-purple-400">{memories.length}</p>
          <p className="text-gray-400 text-sm">Total Memories</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search memories by content or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-800/50 border border-purple-500/20 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50"
        />
      </div>

      {/* Memory Timeline */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          {memories.map((memory, idx) => (
            <MemoryCard 
              key={idx} 
              memory={memory} 
              onClick={() => setSelectedMemory(memory)}
              isSelected={selectedMemory?.version === memory.version}
            />
          ))}
        </div>

        {/* Memory Details Sidebar */}
        <div className="col-span-1">
          {selectedMemory ? (
            <MemoryDetails memory={selectedMemory} />
          ) : (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6 text-center">
              <Eye className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">Select a memory to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MemoryCard({ memory, onClick, isSelected }) {
  const timeAgo = Math.floor((Date.now() - memory.timestamp) / (24 * 60 * 60 * 1000));
  const typeColors = {
    learning: 'from-blue-500 to-blue-600',
    decision: 'from-green-500 to-green-600',
    conversation: 'from-purple-500 to-purple-600'
  };

  return (
    <div 
      onClick={onClick}
      className={`bg-slate-800/50 backdrop-blur-sm rounded-xl border p-4 cursor-pointer transition-all ${
        isSelected ? 'border-purple-500 shadow-lg shadow-purple-500/20' : 'border-purple-500/20 hover:border-purple-500/50'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 bg-gradient-to-br ${typeColors[memory.memoryType]} rounded-lg flex items-center justify-center`}>
            <span className="text-white font-bold text-sm">v{memory.version}</span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-white font-medium capitalize">{memory.memoryType}</span>
              {memory.verified && (
                <CheckCircle className="w-4 h-4 text-green-400" />
              )}
            </div>
            <p className="text-gray-400 text-xs">{timeAgo} days ago</p>
          </div>
        </div>
      </div>

      <p className="text-gray-300 text-sm mb-3">{memory.summary}</p>

      <div className="flex flex-wrap gap-2">
        {memory.tags.map((tag, idx) => (
          <span key={idx} className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs">
            #{tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function MemoryDetails({ memory }) {
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(memory.verified);

  const verifyMemory = () => {
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setVerified(true);
    }, 1500);
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6 sticky top-6">
      <h3 className="text-xl font-semibold text-white mb-4">Memory Details</h3>

      <div className="space-y-4">
        <DetailRow label="Version" value={`v${memory.version}`} />
        <DetailRow label="Type" value={memory.memoryType} />
        <DetailRow 
          label="Timestamp" 
          value={new Date(memory.timestamp).toLocaleString()} 
        />
        <DetailRow 
          label="Content Hash" 
          value={memory.contentHash}
          mono 
        />
        
        <div className="pt-4 border-t border-slate-700">
          <p className="text-gray-400 text-sm mb-2">Verification Status</p>
          <div className="flex items-center space-x-2">
            {verified ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-medium">Verified on-chain</span>
              </>
            ) : (
              <span className="text-yellow-400">Pending verification</span>
            )}
          </div>
        </div>

        <button
          onClick={verifyMemory}
          disabled={verifying || verified}
          className={`w-full py-3 rounded-lg font-semibold transition-all ${
            verified 
              ? 'bg-green-500/20 text-green-400 cursor-not-allowed'
              : 'bg-purple-500 hover:bg-purple-600 text-white'
          }`}
        >
          {verifying ? 'Verifying...' : verified ? 'Verified ✓' : 'Verify Memory'}
        </button>

        <div className="pt-4 border-t border-slate-700">
          <p className="text-gray-400 text-sm mb-3">Tags</p>
          <div className="flex flex-wrap gap-2">
            {memory.tags.map((tag, idx) => (
              <span key={idx} className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono }) {
  return (
    <div>
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className={`text-white ${mono ? 'font-mono text-xs' : ''}`}>
        {mono && value.length > 20 ? `${value.slice(0, 20)}...` : value}
      </p>
    </div>
  );
}

// Create Agent
function CreateAgent() {
  const [formData, setFormData] = useState({
    agentType: '',
    modelVersion: '',
    description: ''
  });
  const [creating, setCreating] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setCreating(true);
    setTimeout(() => {
      alert('Agent created successfully!');
      setCreating(false);
      setFormData({ agentType: '', modelVersion: '', description: '' });
    }, 2000);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-white mb-6">Create New AI Agent</h2>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-purple-500/20 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-white font-medium mb-2">Agent Type</label>
            <input
              type="text"
              value={formData.agentType}
              onChange={(e) => setFormData({...formData, agentType: e.target.value})}
              placeholder="e.g., Trading Bot, Research Assistant"
              className="w-full bg-slate-700/50 border border-purple-500/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50"
              required
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Model Version</label>
            <select
              value={formData.modelVersion}
              onChange={(e) => setFormData({...formData, modelVersion: e.target.value})}
              className="w-full bg-slate-700/50 border border-purple-500/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500/50"
              required
            >
              <option value="">Select model...</option>
              <option value="GPT-4">GPT-4</option>
              <option value="GPT-3.5">GPT-3.5</option>
              <option value="Claude-3">Claude 3</option>
              <option value="Llama-2">Llama 2</option>
            </select>
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Describe your agent's purpose and capabilities..."
              rows={4}
              className="w-full bg-slate-700/50 border border-purple-500/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50"
              required
            />
          </div>

          <button
            type="submit"
            disabled={creating}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
          >
            {creating ? 'Creating Agent...' : 'Create Agent'}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-slate-700">
          <h3 className="text-white font-semibold mb-4">What happens next?</h3>
          <ul className="space-y-3 text-gray-400 text-sm">
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <span>A unique DID is generated on the QIE blockchain</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <span>Smart contract deploys identity and memory vault</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <span>Reputation oracle initializes trust scoring</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <span>You receive agent credentials and API keys</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
