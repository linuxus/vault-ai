# Vault AI

A polished web UI for HashiCorp Vault with hybrid MCP integration, enabling both traditional API operations and AI-assisted workflows.

## Overview

Vault AI provides an intuitive interface for managing secrets, certificates, authentication, and policies in HashiCorp Vault. It combines traditional web-based interactions with AI-powered natural language operations through the Model Context Protocol (MCP).

### Key Features

- **Secrets Management** - Browse, create, update, and delete KV secrets with version history
- **PKI/Certificates** - Manage certificate authorities, issue certificates, and handle revocations
- **Authentication** - Configure auth methods and manage tokens
- **Policies** - Create and test ACL policies with syntax highlighting
- **AI Assistant** - Natural language interface for Vault operations via MCP

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
# Edit .env with your Vault address

# Build and run
docker compose up -d

# Access the UI
open http://localhost:3000
```

## Architecture

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│                     │     │                     │     │                     │
│   Vault AI Web      │────►│   MCP Proxy         │────►│   HashiCorp Vault   │
│   (React SPA)       │     │   (Node.js)         │     │   Server            │
│                     │     │                     │     │                     │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
```

### Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite |
| State | Zustand, TanStack Query |
| Styling | Tailwind CSS |
| AI Integration | MCP Client SDK |
| Deployment | Docker, nginx |

## Documentation

| Document | Description |
|----------|-------------|
| [Technical Spec](docs/TECHNICAL_SPEC.md) | Architecture and implementation details |
| [Design System](docs/DESIGN_SYSTEM.md) | UI components and styling guidelines |
| [MCP Integration](docs/MCP_INTEGRATION.md) | AI assistant and MCP server integration |
| [Deployment Guide](docs/DEPLOYMENT.md) | Docker and Kubernetes deployment |

## Project Structure

```
vault-ai/
├── docs/                    # Documentation
│   ├── TECHNICAL_SPEC.md
│   ├── DESIGN_SYSTEM.md
│   ├── MCP_INTEGRATION.md
│   └── DEPLOYMENT.md
├── src/
│   ├── components/          # Reusable UI components
│   ├── features/            # Feature modules
│   │   ├── secrets/
│   │   ├── pki/
│   │   ├── auth/
│   │   ├── policies/
│   │   └── chat/
│   ├── hooks/               # Custom React hooks
│   ├── services/            # API clients
│   ├── stores/              # State management
│   ├── types/               # TypeScript definitions
│   └── utils/               # Utility functions
├── public/                  # Static assets
├── docker-compose.yml
├── Dockerfile
└── package.json
```

## Development

### Local Development

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
| `VAULT_SKIP_VERIFY` | Skip TLS verification | No |
| `VITE_APP_TITLE` | Browser tab title | No |

## Security

- All Vault tokens are stored in sessionStorage only
- TLS required for Vault connections in production
- Content Security Policy headers enabled
- No secret caching in browser storage
- Audit logging for all AI-initiated operations

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [HashiCorp Vault](https://www.vaultproject.io/) - Secrets management
- [Model Context Protocol](https://modelcontextprotocol.io/) - AI integration standard
- [HashiCorp Design System](https://helios.hashicorp.design/) - Design inspiration
