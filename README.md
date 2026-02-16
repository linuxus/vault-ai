# Vault AI

A React web interface for HashiCorp Vault with hybrid MCP (Model Context Protocol) integration — combining traditional API operations with AI-assisted natural language workflows for secrets management, authentication, and policy operations.

## Key Features

- **Secrets Management** — Browse, create, update, and delete KV secrets with version history
- **Authentication** — Token-based login with session management and automatic renewal
- **AI Chat Assistant** — Natural language interface for Vault operations via MCP proxy
- **Role-Based Access** — Demo environment with pre-configured users and policies

## Architecture

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│                     │     │                     │     │                     │
│   Vault AI Web      │────►│   MCP Proxy         │────►│   HashiCorp Vault   │
│   (React SPA)       │     │   (Node.js)         │     │   Server            │
│                     │────►│                     │     │                     │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
        │                                                        ▲
        └────────────── Direct HTTP API ─────────────────────────┘
```

The UI communicates with Vault through two paths:
1. **Direct HTTP API** — Traditional CRUD operations via the Vault REST API
2. **MCP Proxy** — AI-assisted operations through a Node.js proxy using Anthropic's API

### Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite |
| State | Zustand, TanStack Query |
| Styling | Tailwind CSS, Radix UI |
| AI Integration | Anthropic SDK, MCP Proxy |
| Deployment | Docker, nginx, Kubernetes |

## Quick Start

### Prerequisites

- Docker 24.0+ and Docker Compose 2.20+
- HashiCorp Vault 1.12+ (accessible via HTTPS)

### Installation

```bash
# Clone the repository
git clone https://github.com/linuxus/vault-ai.git
cd vault-ai

# Configure environment
cp .env.example .env
# Edit .env with your Vault address and Anthropic API key

# Build and run
docker compose up -d

# Access the UI
open http://localhost:3000
```

## Project Structure

```
vault-ai/
├── src/
│   ├── components/          # Reusable UI components
│   ├── features/            # Feature modules
│   │   ├── auth/            # Authentication
│   │   ├── chat/            # AI chat assistant
│   │   └── secrets/         # Secrets management
│   ├── hooks/               # Custom React hooks
│   ├── services/            # API clients (Vault, MCP)
│   ├── stores/              # Zustand state management
│   ├── types/               # TypeScript definitions
│   └── utils/               # Utility functions
├── mcp-proxy/               # MCP proxy server (Node.js)
├── scripts/                 # Setup and demo scripts
├── docs/                    # Documentation
├── docker-compose.yml
├── Dockerfile
└── nginx.conf
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VAULT_ADDR` | Vault server URL | Yes |
| `ANTHROPIC_API_KEY` | Anthropic API key for AI features | Yes |
| `VAULT_SKIP_VERIFY` | Skip TLS verification (dev only) | No |
| `VITE_APP_TITLE` | Browser tab title | No |

## Documentation

| Document | Description |
|----------|-------------|
| [Technical Spec](docs/TECHNICAL_SPEC.md) | Architecture and implementation details |
| [Design System](docs/DESIGN_SYSTEM.md) | UI components and styling guidelines |
| [MCP Integration](docs/MCP_INTEGRATION.md) | AI assistant and MCP proxy integration |
| [Deployment Guide](docs/DEPLOYMENT.md) | Docker deployment |
| [Kubernetes Guide](docs/KUBERNETES_DEPLOYMENT.md) | Kubernetes deployment with Kind |

## Security

- Vault tokens stored in `sessionStorage` only — never persisted to disk
- TLS required for Vault connections in production
- Content Security Policy headers enabled
- No secret caching in browser storage

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [HashiCorp Vault](https://www.vaultproject.io/) — Secrets management
- [Model Context Protocol](https://modelcontextprotocol.io/) — AI integration standard
- [Anthropic](https://www.anthropic.com/) — AI assistant capabilities
