import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import type { ChatRequest, ChatMessage } from './types.js';
import { processChat } from './agent.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const VAULT_ADDR = process.env.VAULT_ADDR || 'http://127.0.0.1:8200';
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', vault_addr: VAULT_ADDR });
});

// Chat endpoint with streaming response
app.post('/mcp/chat', async (req, res) => {
  const vaultToken = req.headers['x-vault-token'] as string;

  if (!vaultToken) {
    res.status(401).json({ error: 'Missing X-Vault-Token header' });
    return;
  }

  const body = req.body as ChatRequest;

  if (!body.message) {
    res.status(400).json({ error: 'Missing message in request body' });
    return;
  }

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  // Handle client disconnect
  req.on('close', () => {
    console.log('Client disconnected');
  });

  // Process the chat
  const history: ChatMessage[] = body.history || [];

  await processChat(
    body.message,
    history,
    {
      vaultToken,
      vaultAddr: VAULT_ADDR,
    },
    res
  );

  res.end();
});

// Start server
app.listen(PORT, () => {
  console.log(`MCP Proxy server running on http://localhost:${PORT}`);
  console.log(`Vault address: ${VAULT_ADDR}`);
  console.log(`Allowed origin: ${FRONTEND_ORIGIN}`);
});
