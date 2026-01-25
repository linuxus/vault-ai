# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vault AI is a React SPA web interface for HashiCorp Vault with hybrid MCP (Model Context Protocol) integration. It combines traditional API operations with AI-assisted natural language workflows for secrets, PKI, authentication, and policy management.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run all tests
npm test

# Run a single test file
npx vitest run src/features/secrets/hooks/useSecret.test.ts

# Run tests in watch mode
npx vitest

# Build for production
npm run build

# Lint code
npm run lint

# Format code
npm run format

# E2E tests (Playwright)
npx playwright test
```

## Docker Commands

```bash
# Build and start all services
docker compose up -d

# Rebuild after code changes
docker compose build --no-cache && docker compose up -d

# View logs
docker compose logs -f vault-ai-web

# Stop services
docker compose down
```

## Architecture

### Three-Tier Communication

```
Browser (React SPA) → MCP Proxy (Node.js) → HashiCorp Vault Server
                   ↘ Direct Vault HTTP API ↗
```

The UI communicates with Vault via:
1. **Direct HTTP API** - Traditional CRUD operations through `services/vault/client.ts`
2. **MCP Proxy** - AI-assisted operations via SSE/WebSocket to the MCP server

### Feature Module Pattern

Each feature (`secrets`, `pki`, `auth`, `policies`, `chat`) follows a consistent structure:
- `components/` - React components specific to the feature
- `hooks/` - TanStack Query hooks for data fetching
- `api/` - API function definitions
- `types/` - TypeScript interfaces

### State Management

- **Zustand** (`stores/`) - Global state (auth, UI, chat session)
- **TanStack Query** - Server state with caching (secrets, PKI, policies)

Query keys follow the pattern: `['resource', mount, path]` (e.g., `['secret', 'kv-v2', 'app/database']`)

### Key Services

- `services/vault/client.ts` - VaultClient class with typed methods for KV, PKI, auth, and sys operations
- `services/mcp/client.ts` - MCPClient for AI assistant communication via SSE

### Auth Flow

Tokens are stored in `sessionStorage` only. The `authStore` handles login/logout and automatic token renewal. 401 responses trigger logout via Axios interceptor.

## Design System

Uses HashiCorp-inspired design with:
- Primary: Vault Purple `#7B61FF`
- Tailwind CSS with custom CSS variables (see `docs/DESIGN_SYSTEM.md`)
- Radix UI primitives for accessible base components
- Lucide Icons for iconography

## Key Patterns

### TanStack Query Usage

```typescript
// Read with caching
useQuery({ queryKey: ['secret', mount, path], queryFn: () => client.kvRead(mount, path) })

// Mutations with cache invalidation
useMutation({
  mutationFn: (data) => client.kvWrite(mount, path, data),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['secret', mount, path] })
})
```

### Input Validation

Use Zod schemas from `utils/validation.ts` for runtime validation of paths and secret data.

### Error Handling

Custom error classes (`VaultError`, `AuthenticationError`, `PermissionError`, `NotFoundError`) in `types/errors.ts` with proper status codes.

## Environment Variables

Required: `VAULT_ADDR` - Vault server URL (e.g., `https://vault.example.com:8200`)

Optional:
- `VAULT_SKIP_VERIFY` - Skip TLS verification (dev only)
- `VITE_APP_TITLE` - Browser tab title
