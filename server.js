// server.js
// Simple educational blockchain voting prototype
// Now with JSON persistence (chain + voters stored locally)

// ===============================
// 📦 Imports
// ===============================
const express = require('express');
const fs = require("fs");
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

// ===============================
// ⚙️ Basic server setup
// ===============================
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ===============================
// 💾 JSON Storage Utilities
// ===============================
// File path for local blockchain data
const DATA_FILE = "blockchain_data.json";

// Load data from JSON (if exists)
function loadData() {
  try {
    const data = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(data);
    console.log("✅ Dados carregados do arquivo JSON.");
    return parsed;
  } catch (err) {
    console.log("⚠️ Nenhum arquivo existente encontrado. Iniciando nova blockchain.");
    return null;
  }
}

// Save blockchain + voters to JSON
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  console.log("💾 Dados salvos em blockchain_data.json");
}

// ===============================
// ⛓️ Blockchain Implementation
// ===============================
class Block {
  constructor(index, timestamp, transactions, previousHash = '', nonce = 0) {
    this.index = index;
    this.timestamp = timestamp;
    this.transactions = transactions; // array of tx objects
    this.previousHash = previousHash;
    this.nonce = nonce;
    this.hash = this.calculateHash();
  }

  // Hashing the block data
  calculateHash() {
    const data = this.index + this.timestamp + JSON.stringify(this.transactions) + this.previousHash + this.nonce;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Simple Proof of Work (for demo)
  mineBlock(difficulty) {
    while (!this.hash.startsWith('0'.repeat(difficulty))) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 2; // low difficulty for demo
    this.pendingTransactions = [];
    this.voters = {}; // map voterId -> { registered: true, voted: boolean }
  }

  createGenesisBlock() {
    return new Block(0, new Date().toISOString(), [{ type: 'genesis' }], '0');
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addBlock(transactions) {
    const index = this.chain.length;
    const timestamp = new Date().toISOString();
    const prevHash = this.getLatestBlock().hash;
    const block = new Block(index, timestamp, transactions, prevHash);
    block.mineBlock(this.difficulty);
    this.chain.push(block);
    return block;
  }

  // --- Voter registration and voting logic ---
  isVoterRegistered(voterId) {
    return !!this.voters[voterId];
  }

  registerVoter() {
    const id = uuidv4();
    this.voters[id] = { registeredAt: new Date().toISOString(), voted: false };
    return id;
  }

  castVote(voterId, voteChoice) {
    if (!this.isVoterRegistered(voterId)) {
      throw new Error('Voter not registered');
    }
    if (this.voters[voterId].voted) {
      throw new Error('Voter already voted');
    }
    const tx = { type: 'vote', voterId, vote: voteChoice, timestamp: new Date().toISOString() };
    const block = this.addBlock([tx]); // each vote creates a block
    this.voters[voterId].voted = true;
    return block;
  }

  getChain() {
    return this.chain;
  }

  getResults() {
    const counts = {};
    for (const block of this.chain) {
      for (const tx of block.transactions) {
        if (tx.type === 'vote') {
          counts[tx.vote] = (counts[tx.vote] || 0) + 1;
        }
      }
    }
    return counts;
  }
}

// ===============================
// 🚀 Blockchain Initialization
// ===============================
const savedData = loadData();
const votingChain = new Blockchain();

// Restore data if available
if (savedData) {
  votingChain.chain = savedData.chain || [votingChain.createGenesisBlock()];
  votingChain.voters = savedData.voters || {};
}

// ===============================
// 🌐 API Routes
// ===============================

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// POST /cadastrar_eleitor -> returns { voterId }
app.post('/cadastrar_eleitor', (req, res) => {
  try {
    const id = votingChain.registerVoter();
    saveData({ chain: votingChain.chain, voters: votingChain.voters }); // 🔸 persist
    return res.json({ voterId: id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /votar -> payload { eleitor_id, voto }
app.post('/votar', (req, res) => {
  try {
    const { eleitor_id, voto } = req.body;
    if (!eleitor_id || !voto) return res.status(400).json({ error: 'Missing fields' });

    try {
      const block = votingChain.castVote(eleitor_id, voto);
      saveData({ chain: votingChain.chain, voters: votingChain.voters }); // 🔸 persist
      return res.json({ success: true, block });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /chain -> returns full chain
app.get('/chain', (req, res) => {
  res.json({ chain: votingChain.getChain() });
});

// GET /resultados -> returns aggregated vote counts
app.get('/resultados', (req, res) => {
  res.json({ results: votingChain.getResults() });
});

// ===============================
// 🟢 Start server
// ===============================
app.listen(PORT, () => {
  console.log(`✅ Voting prototype server running on http://localhost:${PORT}`);
});
