# Vault AI - MCP Integration Specification

## Overview

This document specifies the integration between Vault AI's chat interface and the HashiCorp Vault MCP (Model Context Protocol) server. The MCP integration enables natural language interactions with Vault, allowing users to manage secrets, certificates, and policies through conversational AI.

---

## MCP Architecture

### Communication Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              Browser                                     │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────┐  │
│  │   Chat Panel    │───►│   MCP Client    │───►│   Message Queue     │  │
│  │   Component     │    │   (Browser)     │    │                     │  │
│  └─────────────────┘    └─────────────────┘    └──────────┬──────────┘  │
│                                                           │             │
└───────────────────────────────────────────────────────────┼─────────────┘
                                                            │
                                                  SSE / WebSocket
                                                            │
                                                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         MCP Proxy Server                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────┐  │
│  │   SSE Handler   │───►│  Request Router │───►│   Vault MCP Server  │  │
│  │                 │    │                 │    │   (stdio transport) │  │
│  └─────────────────┘    └─────────────────┘    └──────────┬──────────┘  │
│                                                           │             │
└───────────────────────────────────────────────────────────┼─────────────┘
                                                            │
                                                     Vault API
                                                            │
                                                            ▼
                                              ┌─────────────────────────┐
                                              │   HashiCorp Vault       │
                                              │   Server                │
                                              └─────────────────────────┘
```

### Transport Options

| Transport | Use Case | Pros | Cons |
|-----------|----------|------|------|
| SSE (Server-Sent Events) | Web browsers | Simple, HTTP-based | Unidirectional |
| WebSocket | Real-time bidirectional | Full duplex | More complex |
| stdio | Local development | Direct, simple | Not for web |

**Recommended**: SSE for production web deployment with a proxy server that bridges to the stdio-based Vault MCP server.

---

## Vault MCP Server Capabilities

### Available Tools

The Vault MCP server provides the following tools for AI-assisted operations:

#### Mount Management

| Tool | Description | Parameters |
|------|-------------|------------|
| `vault_list_mounts` | List all secret engine mounts | None |
| `vault_enable_mount` | Enable a new secret engine | `path`, `type`, `description`, `options` |
| `vault_disable_mount` | Disable a secret engine | `path` |
| `vault_tune_mount` | Tune mount configuration | `path`, `options` |

#### KV Secrets Engine

| Tool | Description | Parameters |
|------|-------------|------------|
| `vault_kv_list` | List secrets at a path | `mount`, `path` |
| `vault_kv_read` | Read a secret | `mount`, `path`, `version` |
| `vault_kv_write` | Write a secret | `mount`, `path`, `data` |
| `vault_kv_delete` | Delete a secret | `mount`, `path`, `versions` |
| `vault_kv_metadata` | Get secret metadata | `mount`, `path` |

#### PKI Engine

| Tool | Description | Parameters |
|------|-------------|------------|
| `vault_pki_enable` | Enable PKI engine | `path`, `description` |
| `vault_pki_generate_root` | Generate root CA | `mount`, `common_name`, `ttl`, `key_type` |
| `vault_pki_generate_intermediate` | Generate intermediate CSR | `mount`, `common_name`, `key_type` |
| `vault_pki_sign_intermediate` | Sign intermediate certificate | `mount`, `csr`, `common_name`, `ttl` |
| `vault_pki_set_signed` | Set signed intermediate | `mount`, `certificate` |
| `vault_pki_create_role` | Create PKI role | `mount`, `name`, `allowed_domains`, `options` |
| `vault_pki_issue` | Issue certificate | `mount`, `role`, `common_name`, `alt_names`, `ttl` |
| `vault_pki_list_certs` | List issued certificates | `mount` |
| `vault_pki_revoke` | Revoke certificate | `mount`, `serial_number` |

---

## Chat Interface Design

### Component Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Chat Panel                                                    [─][×]   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ 🤖 AI Assistant                                          10:30 AM │ │
│  │                                                                   │ │
│  │ Hello! I can help you manage your Vault secrets, certificates,   │ │
│  │ and policies. What would you like to do?                         │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ 👤 You                                                   10:31 AM │ │
│  │                                                                   │ │
│  │ Show me all database credentials                                  │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ 🤖 AI Assistant                                          10:31 AM │ │
│  │                                                                   │ │
│  │ I found 3 secrets containing database credentials:                │ │
│  │                                                                   │ │
│  │ ┌─────────────────────────────────────────────────────────────┐  │ │
│  │ │ 📁 kv-v2/data/prod/database                          [View] │  │ │
│  │ │ 📁 kv-v2/data/staging/database                       [View] │  │ │
│  │ │ 📁 kv-v2/data/dev/database                           [View] │  │ │
│  │ └─────────────────────────────────────────────────────────────┘  │ │
│  │                                                                   │ │
│  │ Would you like me to show the details of any of these?           │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  Suggestions:                                                           │
│  ┌─────────────┐ ┌─────────────────┐ ┌──────────────────┐              │
│  │ List mounts │ │ Issue a cert    │ │ Create a secret  │              │
│  └─────────────┘ └─────────────────┘ └──────────────────┘              │
├─────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ ┌────────┐ │
│ │ Type a message or command...                            │ │  Send  │ │
│ └─────────────────────────────────────────────────────────┘ └────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### Message Types

#### User Message

```typescript
interface UserMessage {
  id: string;
  type: 'user';
  content: string;
  timestamp: Date;
}
```

#### AI Message

```typescript
interface AIMessage {
  id: string;
  type: 'assistant';
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
  artifacts?: Artifact[];
}

interface ToolCall {
  id: string;
  tool: string;
  parameters: Record<string, unknown>;
  result?: ToolResult;
  status: 'pending' | 'running' | 'success' | 'error';
}

interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

interface Artifact {
  type: 'secret' | 'certificate' | 'policy' | 'list';
  data: unknown;
  actions?: ArtifactAction[];
}

interface ArtifactAction {
  label: string;
  action: string;
  params?: Record<string, unknown>;
}
```

### Interactive Artifacts

#### Secret Artifact

```
┌─────────────────────────────────────────────────────────────────┐
│ 🔑 kv-v2/data/prod/database                                     │
├─────────────────────────────────────────────────────────────────┤
│  username     admin                                      [Copy] │
│  password     ••••••••••                          [Show][Copy] │
│  host         db.prod.example.com                        [Copy] │
│  port         5432                                       [Copy] │
├─────────────────────────────────────────────────────────────────┤
│ [View in Secrets]  [Copy All]  [Edit]                           │
└─────────────────────────────────────────────────────────────────┘
```

#### Certificate Artifact

```
┌─────────────────────────────────────────────────────────────────┐
│ 📜 Certificate Issued                                           │
├─────────────────────────────────────────────────────────────────┤
│  Common Name     api.example.com                                │
│  Serial Number   7a:b2:c3:d4:e5:f6:g7:h8                       │
│  Issuer          Intermediate CA                                │
│  Valid From      Jan 16, 2025 10:00 AM                         │
│  Valid Until     Apr 16, 2025 10:00 AM                         │
├─────────────────────────────────────────────────────────────────┤
│ [Download PEM]  [Download PKCS12]  [Copy Chain]  [Revoke]       │
└─────────────────────────────────────────────────────────────────┘
```

---

## AI Workflows

### Workflow: Secret Discovery

**User Intent**: "Find all secrets related to the payment service"

```
┌─────────────────────────────────────────────────────────────────┐
│                        Intent Recognition                        │
│                              │                                   │
│                              ▼                                   │
│                    ┌─────────────────┐                          │
│                    │ Extract search  │                          │
│                    │ terms: payment  │                          │
│                    └────────┬────────┘                          │
│                              │                                   │
│                              ▼                                   │
│                    ┌─────────────────┐                          │
│                    │ vault_kv_list   │                          │
│                    │ (recursive)     │                          │
│                    └────────┬────────┘                          │
│                              │                                   │
│                              ▼                                   │
│                    ┌─────────────────┐                          │
│                    │ Filter results  │                          │
│                    │ by keyword      │                          │
│                    └────────┬────────┘                          │
│                              │                                   │
│                              ▼                                   │
│                    ┌─────────────────┐                          │
│                    │ Present results │                          │
│                    │ with actions    │                          │
│                    └─────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

### Workflow: Certificate Issuance

**User Intent**: "Generate a certificate for api.internal.example.com"

```
Step 1: Parse Request
├── Extract domain: api.internal.example.com
├── Infer purpose: Internal API service
└── Determine requirements: TLS server cert

Step 2: Find Suitable PKI Role
├── vault_pki_list_roles
├── Match domain against allowed_domains
└── Select best matching role OR suggest creation

Step 3: Confirm Parameters
├── Show inferred parameters to user
├── TTL, key type, SANs
└── Request confirmation

Step 4: Issue Certificate
├── vault_pki_issue with confirmed params
├── Parse response
└── Present certificate artifact

Step 5: Offer Next Steps
├── Download options
├── Deployment instructions
└── Renewal reminder
```

### Workflow: Policy Creation

**User Intent**: "Create a read-only policy for the payments team"

```
Step 1: Gather Requirements
├── Team/entity name: payments
├── Access scope: read-only
└── Target paths: (ask if not specified)

Step 2: Generate Policy
├── Build HCL policy document
├── Include common patterns:
│   ├── secret/data/payments/* - read
│   ├── secret/metadata/payments/* - list, read
│   └── auth/token/lookup-self - read
└── Validate syntax

Step 3: Preview & Confirm
├── Show generated policy
├── Explain each capability
└── Request approval

Step 4: Create Policy
├── vault_policy_write
├── Confirm creation
└── Suggest group assignment
```

---

## Tool Definitions

### MCP Tool Schema

```typescript
// types/mcp.ts
interface MCPTool {
  name: string;
  description: string;
  inputSchema: JSONSchema;
}

interface MCPToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

interface MCPToolResult {
  content: MCPContent[];
  isError?: boolean;
}

interface MCPContent {
  type: 'text' | 'json' | 'error';
  text?: string;
  json?: unknown;
}
```

### Tool Examples

#### vault_kv_read

```json
{
  "name": "vault_kv_read",
  "description": "Read a secret from a KV v2 secrets engine",
  "inputSchema": {
    "type": "object",
    "properties": {
      "mount": {
        "type": "string",
        "description": "The mount path of the KV engine"
      },
      "path": {
        "type": "string",
        "description": "The path to the secret within the mount"
      },
      "version": {
        "type": "integer",
        "description": "Specific version to read (optional, defaults to latest)"
      }
    },
    "required": ["mount", "path"]
  }
}
```

#### vault_pki_issue

```json
{
  "name": "vault_pki_issue",
  "description": "Issue a new certificate from a PKI role",
  "inputSchema": {
    "type": "object",
    "properties": {
      "mount": {
        "type": "string",
        "description": "The PKI engine mount path"
      },
      "role": {
        "type": "string",
        "description": "The PKI role to use for issuance"
      },
      "common_name": {
        "type": "string",
        "description": "The CN for the certificate"
      },
      "alt_names": {
        "type": "array",
        "items": { "type": "string" },
        "description": "Subject Alternative Names (SANs)"
      },
      "ttl": {
        "type": "string",
        "description": "Certificate TTL (e.g., '720h', '30d')"
      },
      "format": {
        "type": "string",
        "enum": ["pem", "der", "pem_bundle"],
        "description": "Output format"
      }
    },
    "required": ["mount", "role", "common_name"]
  }
}
```

---

## Error Handling

### Error Categories

| Category | Description | User Message | Recovery |
|----------|-------------|--------------|----------|
| Auth | Token invalid/expired | "Your session has expired. Please log in again." | Redirect to login |
| Permission | Access denied | "You don't have permission to {action}. Required policy: {policy}" | Show required permissions |
| NotFound | Resource missing | "The {resource} at {path} doesn't exist." | Suggest alternatives |
| Validation | Invalid input | "The {field} is invalid: {reason}" | Highlight field, show format |
| RateLimit | Too many requests | "Vault is rate limiting requests. Please wait a moment." | Auto-retry with backoff |
| ServerError | Vault error | "Vault encountered an error. Please try again." | Show error details |

### Error Response Format

```typescript
interface ChatError {
  type: 'auth' | 'permission' | 'not_found' | 'validation' | 'rate_limit' | 'server';
  message: string;
  details?: {
    code?: string;
    path?: string;
    required_capabilities?: string[];
    suggestion?: string;
  };
  recoverable: boolean;
  actions?: ErrorAction[];
}

interface ErrorAction {
  label: string;
  action: 'retry' | 'navigate' | 'login' | 'copy';
  params?: Record<string, unknown>;
}
```

### Error Display

```
┌─────────────────────────────────────────────────────────────────┐
│ 🤖 AI Assistant                                                 │
├─────────────────────────────────────────────────────────────────┤
│ ⚠️ I couldn't read that secret due to a permission issue.       │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ ❌ Permission Denied                                        ││
│ │                                                             ││
│ │ Path: secret/data/prod/database                             ││
│ │ Required: read capability on secret/data/prod/*             ││
│ │                                                             ││
│ │ Your current policies don't grant access to this path.      ││
│ │ Contact your Vault administrator to request access.         ││
│ │                                                             ││
│ │ [Copy Error Details]  [Request Access]                      ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ Is there something else I can help you with?                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Security Considerations

### Token Handling

| Requirement | Implementation |
|-------------|----------------|
| Token isolation | MCP proxy uses session-specific tokens |
| No token logging | Tokens excluded from all logs |
| Token scope | AI operations limited to user's token capabilities |
| Token refresh | Automatic renewal before expiry |

### Request Validation

```typescript
// Validate all MCP tool calls before execution
function validateToolCall(call: MCPToolCall, userCapabilities: string[]): ValidationResult {
  // Check tool is allowed
  if (!ALLOWED_TOOLS.includes(call.name)) {
    return { valid: false, error: 'Tool not permitted' };
  }

  // Validate parameters
  const schema = getToolSchema(call.name);
  const validation = ajv.validate(schema, call.arguments);
  if (!validation) {
    return { valid: false, error: ajv.errorsText() };
  }

  // Check user has capabilities for the operation
  const requiredCaps = getRequiredCapabilities(call);
  const hasAccess = requiredCaps.every(cap =>
    userCapabilities.some(userCap => matchesCapability(userCap, cap))
  );
  if (!hasAccess) {
    return { valid: false, error: 'Insufficient permissions' };
  }

  return { valid: true };
}
```

### Audit Logging

All AI-initiated operations are logged with:

```typescript
interface AIAuditLog {
  timestamp: Date;
  sessionId: string;
  userId: string;
  userPrompt: string;
  toolCalls: {
    tool: string;
    parameters: Record<string, unknown>; // Sensitive values redacted
    success: boolean;
    duration: number;
  }[];
  ipAddress: string;
  userAgent: string;
}
```

### Content Filtering

- Secret values are never included in AI prompts sent to LLM
- AI responses are scanned for potential secret leakage
- Clipboard operations require explicit user action
- No secret values in browser history or logs

---

## Implementation Details

### MCP Client Service

```typescript
// services/mcp/client.ts
class MCPClient {
  private transport: SSETransport;
  private pendingCalls: Map<string, ToolCallResolver>;

  constructor(config: MCPClientConfig) {
    this.transport = new SSETransport(config.endpoint);
    this.pendingCalls = new Map();
  }

  async connect(token: string): Promise<void> {
    await this.transport.connect({
      headers: { 'X-Vault-Token': token }
    });

    this.transport.on('tool_result', this.handleToolResult);
    this.transport.on('error', this.handleError);
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
    const callId = generateId();

    const promise = new Promise<ToolResult>((resolve, reject) => {
      this.pendingCalls.set(callId, { resolve, reject });
    });

    this.transport.send({
      type: 'tool_call',
      id: callId,
      name,
      arguments: args
    });

    return promise;
  }

  private handleToolResult = (result: MCPToolResult) => {
    const resolver = this.pendingCalls.get(result.id);
    if (resolver) {
      this.pendingCalls.delete(result.id);
      if (result.isError) {
        resolver.reject(new MCPError(result.content));
      } else {
        resolver.resolve(result.content);
      }
    }
  };
}
```

### Chat Store

```typescript
// stores/chatStore.ts
interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  suggestions: string[];

  // Actions
  sendMessage: (content: string) => Promise<void>;
  clearHistory: () => void;
  executeAction: (action: ArtifactAction) => Promise<void>;
}

const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  suggestions: DEFAULT_SUGGESTIONS,

  sendMessage: async (content: string) => {
    const userMessage: UserMessage = {
      id: generateId(),
      type: 'user',
      content,
      timestamp: new Date()
    };

    set(state => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
      error: null
    }));

    try {
      const response = await aiService.chat(content, get().messages);

      const aiMessage: AIMessage = {
        id: generateId(),
        type: 'assistant',
        content: response.text,
        timestamp: new Date(),
        toolCalls: response.toolCalls,
        artifacts: response.artifacts
      };

      set(state => ({
        messages: [...state.messages, aiMessage],
        isLoading: false,
        suggestions: response.suggestions || DEFAULT_SUGGESTIONS
      }));
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  }
}));
```

---

## Testing Strategy

### Unit Tests

```typescript
// services/mcp/client.test.ts
describe('MCPClient', () => {
  it('should call tool and return result', async () => {
    const client = new MCPClient({ endpoint: 'mock://mcp' });
    await client.connect('test-token');

    const result = await client.callTool('vault_kv_list', {
      mount: 'kv-v2',
      path: ''
    });

    expect(result).toEqual({
      content: [{ type: 'json', json: { keys: ['secret1', 'secret2'] } }]
    });
  });

  it('should handle tool errors', async () => {
    const client = new MCPClient({ endpoint: 'mock://mcp' });
    await client.connect('test-token');

    await expect(
      client.callTool('vault_kv_read', {
        mount: 'kv-v2',
        path: 'nonexistent'
      })
    ).rejects.toThrow('Secret not found');
  });
});
```

### Integration Tests

```typescript
// e2e/chat.spec.ts
test.describe('Chat AI Integration', () => {
  test('should list secrets via chat', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="chat-toggle"]');

    await page.fill('[data-testid="chat-input"]', 'List all secrets');
    await page.click('[data-testid="chat-send"]');

    await expect(page.locator('[data-testid="chat-message-assistant"]'))
      .toContainText('found');

    await expect(page.locator('[data-testid="artifact-list"]'))
      .toBeVisible();
  });

  test('should handle permission errors gracefully', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="chat-toggle"]');

    await page.fill('[data-testid="chat-input"]', 'Read secret/prod/admin');
    await page.click('[data-testid="chat-send"]');

    await expect(page.locator('[data-testid="error-artifact"]'))
      .toContainText('Permission Denied');
  });
});
```

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-16 | Vault AI Team | Initial MCP integration specification |
