# Vault AI - Technical Specification

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              Client Browser                              │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                        Vault AI React SPA                           ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  ││
│  │  │   Features   │  │    Stores    │  │      Services            │  ││
│  │  │  - Secrets   │  │  - Auth      │  │  - Vault API Client      │  ││
│  │  │  - PKI       │  │  - Secrets   │  │  - MCP Client            │  ││
│  │  │  - Auth      │  │  - PKI       │  │  - WebSocket Handler     │  ││
│  │  │  - Policies  │  │  - UI State  │  │                          │  ││
│  │  │  - Chat      │  │              │  │                          │  ││
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘  ││
│  └─────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
        ┌───────────────────┐           ┌───────────────────┐
        │   Vault Server    │           │  Vault MCP Server │
        │   (HTTP API)      │           │   (stdio/SSE)     │
        │                   │           │                   │
        │  - KV Engine      │◄─────────►│  - Tool: list     │
        │  - PKI Engine     │           │  - Tool: read     │
        │  - Auth Methods   │           │  - Tool: write    │
        │  - Sys Backend    │           │  - Tool: delete   │
        │  - Identity       │           │  - Tool: pki_*    │
        └───────────────────┘           └───────────────────┘
```

### Deployment Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Docker Host                            │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              docker-compose stack                       │  │
│  │                                                         │  │
│  │  ┌─────────────────┐      ┌─────────────────────────┐  │  │
│  │  │  vault-ai-web   │      │    vault-mcp-server     │  │  │
│  │  │  (nginx:alpine) │      │    (node:20-alpine)     │  │  │
│  │  │                 │      │                         │  │  │
│  │  │  Port: 3000     │      │    Internal only        │  │  │
│  │  │  Static SPA     │      │    stdio transport      │  │  │
│  │  └────────┬────────┘      └────────────┬────────────┘  │  │
│  │           │                            │               │  │
│  └───────────┼────────────────────────────┼───────────────┘  │
│              │                            │                   │
└──────────────┼────────────────────────────┼───────────────────┘
               │                            │
               ▼                            ▼
        ┌──────────────────────────────────────────┐
        │           HashiCorp Vault                │
        │         (External/Existing)              │
        │           https://vault:8200             │
        └──────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend Core

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 5.x | Build tooling |

### State Management

| Technology | Purpose | Rationale |
|------------|---------|-----------|
| Zustand | Global state | Lightweight, TypeScript-first, no boilerplate |
| TanStack Query | Server state | Caching, background sync, optimistic updates |

### Styling & UI

| Technology | Purpose |
|------------|---------|
| Tailwind CSS 3.x | Utility-first styling |
| Custom Components | HashiCorp design language |
| Lucide Icons | Consistent iconography |
| Radix UI Primitives | Accessible base components |

### API & Data

| Technology | Purpose |
|------------|---------|
| Axios | HTTP client for Vault API |
| MCP Client SDK | AI assistant integration |
| Zod | Runtime validation |

### Development Tools

| Tool | Purpose |
|------|---------|
| ESLint | Code linting |
| Prettier | Code formatting |
| Vitest | Unit testing |
| Playwright | E2E testing |
| TypeDoc | Documentation |

---

## Component Architecture

### Directory Structure

```
src/
├── components/              # Reusable UI components
│   ├── ui/                  # Primitive components
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Select/
│   │   ├── Modal/
│   │   ├── Toast/
│   │   ├── Table/
│   │   ├── Card/
│   │   └── ...
│   ├── layout/              # Layout components
│   │   ├── AppShell/
│   │   ├── Sidebar/
│   │   ├── Header/
│   │   └── Footer/
│   └── common/              # Shared feature components
│       ├── SecretViewer/
│       ├── PathBrowser/
│       ├── PolicyEditor/
│       └── JsonEditor/
│
├── features/                # Feature modules
│   ├── secrets/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   └── types/
│   ├── pki/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   └── types/
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   └── types/
│   ├── policies/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   └── types/
│   └── chat/
│       ├── components/
│       ├── hooks/
│       ├── api/
│       └── types/
│
├── hooks/                   # Global custom hooks
│   ├── useVaultClient.ts
│   ├── useMCPClient.ts
│   ├── useAuth.ts
│   └── useToast.ts
│
├── services/                # External service clients
│   ├── vault/
│   │   ├── client.ts
│   │   ├── secrets.ts
│   │   ├── pki.ts
│   │   ├── auth.ts
│   │   └── policies.ts
│   └── mcp/
│       ├── client.ts
│       ├── tools.ts
│       └── handlers.ts
│
├── stores/                  # Zustand stores
│   ├── authStore.ts
│   ├── uiStore.ts
│   └── chatStore.ts
│
├── types/                   # TypeScript definitions
│   ├── vault.ts
│   ├── mcp.ts
│   └── api.ts
│
├── utils/                   # Utility functions
│   ├── format.ts
│   ├── validation.ts
│   └── crypto.ts
│
├── App.tsx
├── main.tsx
└── vite-env.d.ts
```

### Component Hierarchy

```
App
├── AuthProvider
│   └── AppShell
│       ├── Header
│       │   ├── Logo
│       │   ├── Navigation
│       │   └── UserMenu
│       ├── Sidebar
│       │   ├── EngineList
│       │   └── QuickActions
│       ├── MainContent
│       │   └── [Feature Routes]
│       └── ChatPanel
│           ├── MessageList
│           ├── InputArea
│           └── SuggestionChips
└── ToastProvider
```

---

## API Integration Patterns

### Vault HTTP API Client

```typescript
// services/vault/client.ts
interface VaultClientConfig {
  baseUrl: string;
  token?: string;
  namespace?: string;
}

class VaultClient {
  private config: VaultClientConfig;
  private axios: AxiosInstance;

  constructor(config: VaultClientConfig) {
    this.config = config;
    this.axios = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'X-Vault-Token': config.token,
        ...(config.namespace && { 'X-Vault-Namespace': config.namespace }),
      },
    });
  }

  // Generic request method
  async request<T>(
    method: string,
    path: string,
    options?: RequestOptions
  ): Promise<VaultResponse<T>>;

  // KV v2 operations
  async kvRead(mount: string, path: string): Promise<KVSecret>;
  async kvWrite(mount: string, path: string, data: Record<string, unknown>): Promise<void>;
  async kvDelete(mount: string, path: string, versions?: number[]): Promise<void>;
  async kvList(mount: string, path: string): Promise<string[]>;

  // PKI operations
  async pkiIssue(mount: string, role: string, params: PKIIssueParams): Promise<Certificate>;
  async pkiListCerts(mount: string): Promise<string[]>;
  async pkiRevoke(mount: string, serial: string): Promise<void>;

  // Auth operations
  async tokenLookupSelf(): Promise<TokenInfo>;
  async tokenCreate(params: TokenCreateParams): Promise<TokenAuth>;
  async tokenRenew(token: string): Promise<TokenAuth>;
}
```

### Request/Response Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌─────────────┐
│   Component  │────►│  TanStack    │────►│    Vault     │────►│   Vault     │
│              │     │   Query      │     │   Client     │     │   Server    │
└──────────────┘     └──────────────┘     └──────────────┘     └─────────────┘
       ▲                    │                    │                    │
       │                    │                    │                    │
       │              Cache Check           Add Headers          HTTP Request
       │                    │                    │                    │
       │                    ▼                    ▼                    ▼
       │             ┌──────────────┐     ┌──────────────┐     ┌─────────────┐
       └─────────────│   Render     │◄────│   Transform  │◄────│   Response  │
                     └──────────────┘     └──────────────┘     └─────────────┘
```

### TanStack Query Patterns

```typescript
// features/secrets/hooks/useSecret.ts
export function useSecret(mount: string, path: string) {
  const client = useVaultClient();

  return useQuery({
    queryKey: ['secret', mount, path],
    queryFn: () => client.kvRead(mount, path),
    staleTime: 30_000, // 30 seconds
    gcTime: 5 * 60_000, // 5 minutes
  });
}

export function useSecretMutation(mount: string, path: string) {
  const client = useVaultClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      client.kvWrite(mount, path, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secret', mount, path] });
      queryClient.invalidateQueries({ queryKey: ['secrets', mount] });
    },
  });
}
```

---

## Authentication Flow

### Token-Based Authentication

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Login     │     │   Auth Store    │     │   Vault API     │
│   Form      │     │   (Zustand)     │     │                 │
└──────┬──────┘     └────────┬────────┘     └────────┬────────┘
       │                     │                       │
       │  1. Submit Token    │                       │
       │────────────────────►│                       │
       │                     │  2. Lookup Token      │
       │                     │──────────────────────►│
       │                     │                       │
       │                     │  3. Token Info        │
       │                     │◄──────────────────────│
       │                     │                       │
       │                     │  4. Store Token +     │
       │                     │     Capabilities      │
       │                     │                       │
       │  5. Redirect to App │                       │
       │◄────────────────────│                       │
       │                     │                       │
```

### Auth Store Structure

```typescript
// stores/authStore.ts
interface AuthState {
  token: string | null;
  tokenInfo: TokenInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (token: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  checkCapabilities: (paths: string[]) => Promise<Capabilities>;
}

const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  tokenInfo: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (token: string) => {
    set({ isLoading: true, error: null });
    try {
      const client = new VaultClient({ baseUrl: VAULT_URL, token });
      const tokenInfo = await client.tokenLookupSelf();

      set({
        token,
        tokenInfo,
        isAuthenticated: true,
        isLoading: false,
      });

      // Persist token securely (sessionStorage only)
      sessionStorage.setItem('vault_token', token);
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  logout: () => {
    sessionStorage.removeItem('vault_token');
    set({
      token: null,
      tokenInfo: null,
      isAuthenticated: false,
    });
  },
}));
```

### Session Management

- Tokens stored in `sessionStorage` only (cleared on tab close)
- Automatic token renewal before expiry
- Token TTL warning notifications
- Idle timeout with configurable duration
- Graceful logout on 403 responses

---

## Data Flow Diagrams

### Secret Read Operation

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  SecretView │     │  useSecret  │     │   Query     │     │   Vault     │
│  Component  │     │    Hook     │     │   Cache     │     │   Client    │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │                   │
       │  mount, path      │                   │                   │
       │──────────────────►│                   │                   │
       │                   │  queryKey check   │                   │
       │                   │──────────────────►│                   │
       │                   │                   │                   │
       │                   │  [Cache Miss]     │                   │
       │                   │                   │  kvRead()         │
       │                   │                   │──────────────────►│
       │                   │                   │                   │
       │                   │                   │  Secret Data      │
       │                   │                   │◄──────────────────│
       │                   │                   │                   │
       │                   │  Cached Result    │                   │
       │                   │◄──────────────────│                   │
       │  isLoading, data  │                   │                   │
       │◄──────────────────│                   │                   │
       │                   │                   │                   │
       │  Render Secret    │                   │                   │
       │                   │                   │                   │
```

### Secret Write with Optimistic Update

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  SecretEdit │     │ useMutation │     │   Query     │     │   Vault     │
│  Component  │     │    Hook     │     │   Client    │     │   Client    │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │                   │
       │  mutate(data)     │                   │                   │
       │──────────────────►│                   │                   │
       │                   │  onMutate         │                   │
       │                   │──────────────────►│                   │
       │                   │  Optimistic       │                   │
       │                   │  Update           │                   │
       │                   │                   │                   │
       │  isPending=true   │                   │                   │
       │◄──────────────────│  kvWrite()        │                   │
       │                   │─────────────────────────────────────►│
       │                   │                   │                   │
       │                   │                   │                   │
       │                   │◄─────────────────────────────────────│
       │                   │                   │                   │
       │                   │  [Success]        │                   │
       │                   │  invalidate       │                   │
       │                   │──────────────────►│                   │
       │  isSuccess=true   │                   │                   │
       │◄──────────────────│                   │                   │
       │                   │                   │                   │
```

---

## Error Handling

### Error Hierarchy

```typescript
// types/errors.ts
class VaultError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'VaultError';
  }
}

class AuthenticationError extends VaultError {
  constructor(message: string) {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

class PermissionError extends VaultError {
  constructor(message: string, path: string) {
    super(message, 'PERMISSION_DENIED', 403, { path });
    this.name = 'PermissionError';
  }
}

class NotFoundError extends VaultError {
  constructor(path: string) {
    super(`Resource not found: ${path}`, 'NOT_FOUND', 404, { path });
    this.name = 'NotFoundError';
  }
}
```

### Global Error Boundary

```typescript
// components/ErrorBoundary.tsx
class ErrorBoundary extends Component<Props, State> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to error tracking service
    console.error('Error boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} onRetry={this.reset} />;
    }
    return this.props.children;
  }
}
```

### API Error Handling

```typescript
// services/vault/client.ts
async function handleVaultResponse<T>(response: AxiosResponse): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const data = response.data;

  if (data.errors) {
    const message = data.errors.join(', ');
    throw new VaultError(message, 'VAULT_ERROR', response.status, data);
  }

  return data.data ?? data;
}

// Axios interceptor for auth errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## Security Considerations

### Token Handling

| Requirement | Implementation |
|-------------|----------------|
| No localStorage | Tokens in sessionStorage only |
| No URL tokens | Never include tokens in URLs |
| Memory cleanup | Clear sensitive data on logout |
| XSS protection | CSP headers, input sanitization |

### Content Security Policy

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
  connect-src 'self' ${VAULT_URL};
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
```

### Input Validation

```typescript
// utils/validation.ts
import { z } from 'zod';

export const secretPathSchema = z
  .string()
  .min(1, 'Path is required')
  .regex(/^[a-zA-Z0-9\-_\/]+$/, 'Invalid path characters')
  .refine((path) => !path.includes('..'), 'Path traversal not allowed');

export const secretDataSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.boolean()])
);

export const policySchema = z.object({
  name: z.string().min(1).max(128).regex(/^[a-zA-Z0-9\-_]+$/),
  policy: z.string().min(1),
});
```

---

## Performance Optimization

### Code Splitting

```typescript
// Lazy load feature routes
const SecretsFeature = lazy(() => import('./features/secrets'));
const PKIFeature = lazy(() => import('./features/pki'));
const PoliciesFeature = lazy(() => import('./features/policies'));
const ChatFeature = lazy(() => import('./features/chat'));

// Route configuration
const routes = [
  { path: '/secrets/*', element: <SecretsFeature /> },
  { path: '/pki/*', element: <PKIFeature /> },
  { path: '/policies/*', element: <PoliciesFeature /> },
  { path: '/chat', element: <ChatFeature /> },
];
```

### Query Optimization

```typescript
// Prefetch related data
function useSecretPrefetch() {
  const queryClient = useQueryClient();

  return useCallback((mount: string, path: string) => {
    queryClient.prefetchQuery({
      queryKey: ['secret', mount, path],
      queryFn: () => vaultClient.kvRead(mount, path),
      staleTime: 30_000,
    });
  }, [queryClient]);
}

// Debounced search
function useSecretSearch(mount: string) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);

  return useQuery({
    queryKey: ['secrets', mount, 'search', debouncedSearch],
    queryFn: () => vaultClient.kvSearch(mount, debouncedSearch),
    enabled: debouncedSearch.length > 2,
  });
}
```

### Bundle Optimization

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          query: ['@tanstack/react-query'],
          editor: ['@monaco-editor/react'],
        },
      },
    },
  },
});
```

---

## Testing Strategy

### Unit Testing (Vitest)

```typescript
// features/secrets/hooks/useSecret.test.ts
describe('useSecret', () => {
  it('should fetch secret data', async () => {
    const { result } = renderHook(
      () => useSecret('kv', 'app/database'),
      { wrapper: QueryWrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({
      username: 'admin',
      password: 'secret',
    });
  });

  it('should handle not found error', async () => {
    const { result } = renderHook(
      () => useSecret('kv', 'nonexistent'),
      { wrapper: QueryWrapper }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(NotFoundError);
  });
});
```

### Integration Testing (Playwright)

```typescript
// e2e/secrets.spec.ts
test.describe('Secrets Management', () => {
  test('should create and read a secret', async ({ page }) => {
    await page.goto('/secrets/kv');

    // Create secret
    await page.click('[data-testid="create-secret"]');
    await page.fill('[data-testid="secret-path"]', 'test/secret');
    await page.fill('[data-testid="key-0"]', 'username');
    await page.fill('[data-testid="value-0"]', 'testuser');
    await page.click('[data-testid="save-secret"]');

    // Verify creation
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();

    // Read secret
    await page.click('[data-testid="path-test/secret"]');
    await expect(page.locator('[data-testid="secret-value-username"]'))
      .toHaveText('testuser');
  });
});
```

---

## Monitoring & Observability

### Client-Side Logging

```typescript
// utils/logger.ts
const logger = {
  info: (message: string, data?: unknown) => {
    console.info(`[INFO] ${message}`, data);
  },
  error: (message: string, error?: Error) => {
    console.error(`[ERROR] ${message}`, error);
    // Send to error tracking service in production
  },
  audit: (action: string, details: AuditDetails) => {
    console.log(`[AUDIT] ${action}`, details);
    // Send to audit log endpoint
  },
};
```

### Performance Metrics

```typescript
// utils/performance.ts
export function trackPageLoad(pageName: string) {
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

  const metrics = {
    page: pageName,
    dns: navigation.domainLookupEnd - navigation.domainLookupStart,
    connection: navigation.connectEnd - navigation.connectStart,
    ttfb: navigation.responseStart - navigation.requestStart,
    domLoad: navigation.domContentLoadedEventEnd - navigation.startTime,
    fullLoad: navigation.loadEventEnd - navigation.startTime,
  };

  logger.info('Page load metrics', metrics);
}
```

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-16 | Vault AI Team | Initial technical specification |
