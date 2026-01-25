## vault-mcp-server version

```plaintext
Docker image: hashicorp/vault-mcp-server:latest
Pulled: 2026-01-17
MCP SDK: github.com/mark3labs/mcp-go v0.40.0
```

## Description

The `write_secret` tool panics with a nil pointer dereference when attempting to write to a KV v2 secret that was previously soft-deleted. The server crashes because it attempts to type-assert a nil `data` field from a deleted secret's response as `map[string]interface{}`.

This is a critical issue as it completely crashes the MCP server process, requiring a restart and losing all active connections.

## Testing plan

1. Start a Vault server with a KV v2 secrets engine:
   ```bash
   vault secrets enable -path=team/api-keys kv-v2
   ```

2. Create a secret:
   ```bash
   vault kv put team/api-keys/secrets api-gateway=test123
   ```

3. Delete the secret (soft delete in KV v2):
   ```bash
   vault kv delete team/api-keys/secrets
   ```

4. Verify the secret is in deleted state:
   ```bash
   vault kv get team/api-keys/secrets
   # Returns: "Secret at path 'secrets' in mount 'team/api-keys' is deleted"
   ```

5. Start vault-mcp-server via Docker:
   ```bash
   docker run -i --rm \
     -e VAULT_ADDR=http://host.docker.internal:8200 \
     -e VAULT_TOKEN=<your-token> \
     hashicorp/vault-mcp-server:latest
   ```

6. Send an MCP `tools/call` request for `write_secret`:
   ```json
   {
     "jsonrpc": "2.0",
     "id": 1,
     "method": "tools/call",
     "params": {
       "name": "write_secret",
       "arguments": {
         "mount": "team/api-keys",
         "path": "secrets",
         "key": "api-gateway",
         "value": "newvalue123"
       }
     }
   }
   ```

7. **Result**: Server panics and Docker container exits

```plaintext
Reproduction rate: 100%
Tested on: macOS Darwin 24.6.0, Docker Desktop
Vault version: 1.15+
```

## Expected Behavior

The `write_secret` tool should successfully write to a previously deleted secret path by either:
1. Automatically handling the deleted state and creating a new version, OR
2. Returning a clear error message indicating the secret must be undeleted first

The server should never panic/crash regardless of the secret's state.

## Actual Behavior

The server crashes with the following panic:

```plaintext
panic: interface conversion: interface {} is nil, not map[string]interface {}

goroutine 9 [running]:
github.com/hashicorp/vault-mcp-server/pkg/tools/kv.writeSecretHandler({0x778828, 0x40001fe450}, {{{0x40001edb86, 0xa}, {0x0}}, 0x40001fe4b0, {{0x40001edb90, 0xc}, {0x5ddfc0, 0x40001fe7b0}, ...}}, ...)
	github.com/hashicorp/vault-mcp-server/pkg/tools/kv/write_secret.go:135 +0x17c8
github.com/hashicorp/vault-mcp-server/pkg/tools/kv.WriteSecret.func1({0x778828?, 0x40001fe450?}, {{{0x40001edb86, 0xa}, {0x0}}, 0x40001fe4b0, {{0x40001edb90, 0xc}, {0x5ddfc0, 0x40001fe7b0}, ...}})
	github.com/hashicorp/vault-mcp-server/pkg/tools/kv/write_secret.go:48 +0x68
main.NewServer.(*RateLimitMiddleware).Middleware.func5.1({0x778828, 0x40001fe450}, {{{0x40001edb86, 0xa}, {0x0}}, 0x40001fe4b0, {{0x40001edb90, 0xc}, {0x5ddfc0, 0x40001fe7b0}, ...}})
	github.com/hashicorp/vault-mcp-server/pkg/client/ratelimit.go:149 +0x144
github.com/mark3labs/mcp-go/server.(*MCPServer).handleToolCall(0x40000aa000, {0x778828, 0x40001fe450}, {0x592540, 0x40001ed9f0}, {{{0x40001edb86, 0xa}, {0x0}}, 0x40001fe4b0, {{0x40001edb90, ...}, ...}})
	github.com/mark3labs/mcp-go@v0.40.0/server/server.go:1187 +0x400
github.com/mark3labs/mcp-go/server.(*MCPServer).HandleMessage(0x40000aa000, {0x778828?, 0x40000a7140?}, {0x400033c180, 0xb6, 0xc0})
	github.com/mark3labs/mcp-go@v0.40.0/server/request_handler.go:324 +0x9b8
github.com/mark3labs/mcp-go/server.(*StdioServer).toolCallWorker(0x40000a40a0, {0x778828, 0x40000a7140})
	github.com/mark3labs/mcp-go@v0.40.0/server/stdio.go:410 +0xe8
created by github.com/mark3labs/mcp-go/server.(*StdioServer).Listen in goroutine 7
	github.com/mark3labs/mcp-go@v0.40.0/server/stdio.go:479 +0x2bc
```

## Additional Context

### Root Cause Analysis

The issue is in `pkg/tools/kv/write_secret.go` around line 135. When writing to a KV v2 secret, the code:
1. Reads the current secret to preserve existing keys
2. Attempts to merge the new key/value with existing data
3. Writes the updated secret

However, when a secret is **soft-deleted** in KV v2, the Vault API returns:
```json
{
  "data": null,
  "metadata": {
    "deletion_time": "2024-01-18T03:00:00Z",
    "destroyed": false,
    "version": 1
  }
}
```

The `data` field is `nil`, not `{}`. The code likely does:
```go
currentData := secretData["data"].(map[string]interface{})  // PANIC: nil is not map[string]interface{}
```

### Suggested Fix

Add nil check before type assertion:

```go
var currentData map[string]interface{}
if secretData["data"] != nil {
    var ok bool
    currentData, ok = secretData["data"].(map[string]interface{})
    if !ok {
        currentData = make(map[string]interface{})
    }
} else {
    // Secret is deleted or data is nil - start fresh
    currentData = make(map[string]interface{})
}
currentData[key] = value
```

### Workaround

We implemented a pre-flight check that undeletes the secret before calling `write_secret`:

```typescript
async function undeleteSecretIfNeeded(mount: string, path: string, vaultAddr: string, token: string) {
  const metadataRes = await fetch(`${vaultAddr}/v1/${mount}/metadata/${path}`, {
    headers: { 'X-Vault-Token': token },
  });

  if (!metadataRes.ok) return;

  const metadata = await metadataRes.json();
  const currentVersion = metadata.data?.current_version;
  const versionData = metadata.data?.versions?.[String(currentVersion)];

  if (versionData?.deletion_time) {
    await fetch(`${vaultAddr}/v1/${mount}/undelete/${path}`, {
      method: 'POST',
      headers: { 'X-Vault-Token': token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ versions: [currentVersion] }),
    });
  }
}
```

### Environment Details

- **Transport**: stdio via Docker container
- **Use case**: AI chat agent using MCP to interact with Vault
- **User workflow**: Delete a secret via UI/CLI, then recreate it via AI assistant
- **Impact**: High - server crash, requires restart, common user workflow affected
