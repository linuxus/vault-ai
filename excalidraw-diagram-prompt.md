# Excalidraw Diagram Prompt: Vault AI Architecture

## Overview
Create a professional architecture diagram for "Vault AI" - a React SPA web interface for HashiCorp Vault with hybrid MCP (Model Context Protocol) integration. The diagram should show the three-tier communication architecture and data flows.

## Diagram Layout
Use a **top-to-bottom flow** with three main horizontal tiers:

---

## TIER 1: Browser Layer (Top)
**Main Container: "Browser (React SPA)" - Port 5173**

Inside this container, show these sub-components:
- **UI Components** box containing:
  - `Layout` (Header, Sidebar, Breadcrumbs)
  - `Features` with sub-boxes: Secrets, Chat, Auth, PKI, Policies
  - `Radix UI Components`

- **State Management** box containing:
  - `Zustand Stores` with three items:
    - authStore (token, session)
    - chatStore (messages, streaming)
    - uiStore (sidebar, theme)
  - `TanStack Query` (server state cache)

- **Services** box containing two clients:
  - `VaultClient` (HTTP/REST) - labeled "Traditional CRUD"
  - `MCPClient` (SSE Streaming) - labeled "AI Operations"

Show two outgoing arrows from Services:
1. **Solid arrow** from VaultClient → "Direct HTTP API" → downward
2. **Dashed arrow** from MCPClient → "SSE Stream" → downward

---

## TIER 2: MCP Proxy Layer (Middle)
**Main Container: "MCP Proxy Server (Node.js + Express)" - Port 3001**

Inside show:
- **Endpoints** box:
  - `GET /health`
  - `POST /mcp/chat`

- **Claude Agent** box containing:
  - Model: `claude-sonnet-4-20250514`
  - System Prompt
  - Tool Execution Loop

- **MCP Client** box:
  - Docker Container Pool
  - Vault MCP Tools

Show connections:
- Incoming SSE arrow from Browser
- Bidirectional arrow to Claude Agent labeled "Anthropic API"
- Arrow from Claude Agent to MCP Client labeled "Tool Calls"
- Arrow from MCP Client downward to Vault labeled "Tool Execution"

---

## TIER 3: Vault Server Layer (Bottom)
**Main Container: "HashiCorp Vault Server" - Port 8200**

Inside show endpoint categories:
- `KV Secrets Engine` (/v1/secret/*)
- `PKI Engine` (/v1/pki/*)
- `Auth Methods` (/v1/auth/*)
- `Sys Operations` (/v1/sys/*)

---

## Data Flow Arrows (Important!)

**Flow 1 - Traditional CRUD (solid lines, blue):**
```
VaultClient → Vite Proxy → Vault Server
             (Direct HTTP with X-Vault-Token header)
```

**Flow 2 - AI-Assisted Operations (dashed lines, purple):**
```
MCPClient → MCP Proxy → Claude Agent → MCP Client → Docker Container → Vault Server
           (SSE Stream)  (Anthropic)   (Tools)      (vault-mcp)
```

**Flow 3 - Tool Result Cache Invalidation (dotted line, orange):**
```
MCP Proxy (tool_result) → Browser → TanStack Query invalidation
```

---

## Visual Styling

**Colors:**
- Primary/Accent: Vault Purple `#7B61FF`
- Browser tier background: Light blue tint
- MCP Proxy tier background: Light purple tint
- Vault tier background: Light gray
- Direct HTTP arrows: Blue `#3B82F6`
- SSE/AI arrows: Purple `#7B61FF`
- Cache invalidation: Orange `#F59E0B`

**Component Styling:**
- Rounded rectangles for all containers
- Dashed borders for Docker-related components
- Icons if possible:
  - React logo for Browser
  - Node.js logo for MCP Proxy
  - Vault logo for Vault Server
  - Robot/AI icon for Claude Agent

---

## Legend (Bottom Right)
Include a legend showing:
- Solid blue arrow = Direct HTTP API
- Dashed purple arrow = SSE Streaming
- Dotted orange arrow = Cache Invalidation
- Dashed border = Docker Container

---

## Additional Details to Include

**SSE Event Types** (small annotation near MCP Proxy):
- `text` - Claude response
- `tool_call` - Tool invocation
- `tool_result` - Execution result
- `done` - Stream complete

**Auth Flow Note** (small annotation):
- Token stored in sessionStorage
- 401 response triggers logout
- X-Vault-Token header on all requests

---

## Dimensions
- Landscape orientation
- Approximately 1400x900 pixels
- Leave padding for readability

---

This diagram should clearly communicate that Vault AI uses a **hybrid approach**: traditional REST for CRUD operations and streaming SSE through an MCP proxy for AI-assisted workflows, with the MCP proxy orchestrating Claude and executing tools via Docker containers against the Vault server.
