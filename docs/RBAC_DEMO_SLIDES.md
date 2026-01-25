# Vault AI - RBAC & Permissions Guardrails Demo

## Quick Reference - Token Regeneration

```bash
# If tokens expire during demo, run this to get fresh tokens:
export VAULT_ADDR=http://localhost:8200

# API Developer
vault write -field=token auth/userpass/login/api-developer password=demo-password-123

# DBA Admin
vault write -field=token auth/userpass/login/dba-admin password=demo-password-123

# Security Analyst
vault write -field=token auth/userpass/login/security-analyst password=demo-password-123

# DevOps Engineer
vault write -field=token auth/userpass/login/devops-engineer password=demo-password-123

# Platform Engineer
vault write -field=token auth/userpass/login/platform-engineer password=demo-password-123
```

**Or regenerate all tokens at once:**
```bash
./scripts/setup-demo-users.sh
cat scripts/demo-tokens.env
```

---

## Slide 1: Title

# Vault AI
## Enterprise Secrets Management with AI-Assisted Workflows

**Secure by Design: RBAC & Policy Enforcement**

---

## Slide 2: The Challenge

### Traditional Secrets Management Pain Points

- Engineers struggle to find secrets across complex hierarchies
- Manual navigation through nested paths is error-prone
- No natural language interface for common operations
- **But AI assistants need guardrails!**

### The Risk with AI + Secrets

> "AI should help users access secrets they're authorized to see—not bypass security controls"

---

## Slide 3: Vault AI Solution

### Hybrid Architecture with Built-in Security

```
┌─────────────────────────────────────────────┐
│           User (with Vault Token)           │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│              Vault AI Chat                  │
│         "Show me database secrets"          │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│           MCP Proxy + Claude                │
│    (Uses USER'S token for all operations)   │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│         HashiCorp Vault Server              │
│      Policy Enforcement at API Level        │
│                                             │
│   ✓ Allowed by policy → Returns secret      │
│   ✗ Denied by policy  → 403 Forbidden       │
└─────────────────────────────────────────────┘
```

**Key Insight:** AI operations inherit the user's permissions—no privilege escalation possible.

---

## Slide 4: Demo Personas

### Five Realistic Enterprise Roles

| Role | Team | Primary Access | Restricted From |
|------|------|----------------|-----------------|
| **api-developer** | API Team | API Gateway, Third-party APIs | Database secrets, Infrastructure |
| **dba-admin** | Database Team | All database credentials | API keys, Cloud infrastructure |
| **security-analyst** | Security Team | Certificates, Audit (read-only) | Cannot modify anything |
| **devops-engineer** | DevOps Team | Infrastructure, CI/CD | Payment systems |
| **platform-engineer** | Platform Team | Shared configs, Notifications | Security secrets, Payments |

---

## Slide 5: Policy Example - API Developer

### What They CAN Access

```hcl
# API Gateway - full access
path "applications/data/api-gateway/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# Third-party APIs
path "third-party/data/ai/*" {
  capabilities = ["read", "list"]
}
```

### What They CANNOT Access

```hcl
# Explicit denial - database secrets
path "applications/data/*/database" {
  capabilities = ["deny"]
}

# No infrastructure access
path "infrastructure/*" {
  capabilities = ["deny"]
}
```

---

## Slide 6: Live Demo - API Developer

### Login as: `api-developer`

**Demo 1: Allowed Operation ✓**
> "Show me the API Gateway OAuth configuration"

*Expected: Returns OAuth client_id, client_secret, endpoints*

**Demo 2: Denied Operation ✗**
> "Show me the user-service production database password"

*Expected: Permission denied error from Vault*

**Demo 3: Attempting to Navigate Around Restrictions ✗**
> "List all secrets in the applications mount"

*Expected: Only sees paths they have access to*

---

## Slide 7: Live Demo - DBA Admin

### Login as: `dba-admin`

**Demo 1: Allowed Operation ✓**
> "Show me all database credentials across services"

*Expected: Returns database secrets from user-service, payment-service, etc.*

**Demo 2: Denied Operation ✗**
> "What's the Stripe API key for production?"

*Expected: Permission denied - DBA doesn't need payment API keys*

**Demo 3: Cross-team Boundary ✗**
> "Show me the AWS production credentials"

*Expected: Permission denied - infrastructure secrets restricted*

---

## Slide 8: Live Demo - Security Analyst

### Login as: `security-analyst`

**Demo 1: Audit Access ✓**
> "List all TLS certificates and their expiry dates"

*Expected: Returns certificate information (read-only)*

**Demo 2: Read-Only Enforcement ✗**
> "Delete the expired Snyk API token"

*Expected: Permission denied - analyst has read-only access*

**Demo 3: Sensitive Operations ✗**
> "Show me the AWS root credentials"

*Expected: Permission denied - no cloud infrastructure access*

---

## Slide 9: Live Demo - DevOps Engineer

### Login as: `devops-engineer`

**Demo 1: Infrastructure Access ✓**
> "Show me the Kubernetes production cluster credentials"

*Expected: Returns K8s API server, token, namespace*

**Demo 2: Payment System Boundary ✗**
> "Get the payment service Stripe webhook secret"

*Expected: Permission denied - payment systems restricted*

**Demo 3: CI/CD Access ✓**
> "What are the GitHub Actions credentials?"

*Expected: Returns app_id, private_key, installation_id*

---

## Slide 10: How It Works - Technical Deep Dive

### Token-Based Authorization Flow

```
1. User logs into Vault AI with their Vault token
   └─► Token stored in browser sessionStorage only

2. User sends natural language request
   └─► "Show me the production database password"

3. MCP Proxy receives request with user's token
   └─► Forwards token in X-Vault-Token header

4. Claude determines which Vault API calls to make
   └─► Calls: GET /v1/applications/data/user-service/prod/database

5. Vault evaluates request against user's policies
   └─► Policy check: Does token have 'read' on this path?

6. Vault returns result OR 403 Forbidden
   └─► AI assistant relays result to user
```

**No token elevation. No policy bypass. No exceptions.**

---

## Slide 11: Security Architecture Principles

### Defense in Depth

| Layer | Protection |
|-------|------------|
| **Browser** | Token in sessionStorage (not localStorage), cleared on close |
| **Transport** | HTTPS only, no token in URLs |
| **MCP Proxy** | Stateless, no token storage, passes through only |
| **Vault** | Policy enforcement, audit logging, token TTL |

### What the AI Cannot Do

- ❌ Access secrets outside user's policy
- ❌ Escalate privileges
- ❌ Store or exfiltrate tokens
- ❌ Bypass Vault's audit logging
- ❌ Access other users' sessions

---

## Slide 12: Policy Design Best Practices

### Principle of Least Privilege

```hcl
# BAD: Overly permissive
path "secret/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# GOOD: Scoped to team's needs
path "applications/data/api-gateway/*" {
  capabilities = ["read", "list"]
}
path "applications/data/api-gateway/prod/config" {
  capabilities = ["read", "update"]  # Can update config only
}
```

### Explicit Denials for Sensitive Paths

```hcl
# Even if wildcard grants access, explicit deny wins
path "teams/data/security/vault-admin/*" {
  capabilities = ["deny"]
}
```

---

## Slide 13: Audit & Compliance

### Every AI Operation is Logged

```json
{
  "type": "request",
  "auth": {
    "token_type": "service",
    "policies": ["api-developer"],
    "metadata": {
      "username": "api-developer"
    }
  },
  "request": {
    "path": "applications/data/user-service/prod/database",
    "operation": "read"
  },
  "response": {
    "status": 403
  }
}
```

**Complete traceability:** Who accessed what, when, and whether it succeeded.

---

## Slide 14: Enterprise Benefits

### For Security Teams
- AI doesn't bypass existing Vault policies
- Same audit trail as direct API access
- No new attack surface introduced

### For Development Teams
- Natural language access to authorized secrets
- Faster onboarding—ask instead of navigating
- Reduced friction while maintaining security

### For Compliance
- Role-based access control (RBAC) enforced
- Audit logs capture all AI-initiated operations
- Token TTL limits exposure window

---

## Slide 15: Summary

### Vault AI: Secure AI-Assisted Secrets Management

✅ **Natural Language Interface** - Ask for secrets in plain English

✅ **Policy Enforcement** - AI inherits user's exact permissions

✅ **No Privilege Escalation** - Token-based auth, no shortcuts

✅ **Full Audit Trail** - Every operation logged in Vault

✅ **Session Isolation** - Tokens scoped to browser session

---

## Appendix A: Demo Environment Setup

### Prerequisites
- HashiCorp Vault server running
- Demo secrets provisioned: `./scripts/setup-enterprise-secrets.sh`
- Demo users created: `./scripts/setup-demo-users.sh`

### Start Services
```bash
# Terminal 1: MCP Proxy
cd mcp-proxy && npm run dev

# Terminal 2: Web UI
npm run dev
```

### Access
- Web UI: http://localhost:5173
- Vault: http://localhost:8200

---

## Appendix B: Demo User Credentials

| Username | Password | Token Variable |
|----------|----------|----------------|
| api-developer | demo-password-123 | API_DEVELOPER_TOKEN |
| dba-admin | demo-password-123 | DBA_ADMIN_TOKEN |
| security-analyst | demo-password-123 | SECURITY_ANALYST_TOKEN |
| devops-engineer | demo-password-123 | DEVOPS_ENGINEER_TOKEN |
| platform-engineer | demo-password-123 | PLATFORM_ENGINEER_TOKEN |

**Quick token refresh:**
```bash
source scripts/demo-tokens.env
echo $API_DEVELOPER_TOKEN
```

---

## Appendix C: Troubleshooting

### Token Expired
```bash
# Regenerate single token
vault write -field=token auth/userpass/login/api-developer password=demo-password-123

# Regenerate all tokens
./scripts/setup-demo-users.sh
```

### Permission Denied Unexpected
```bash
# Check user's policies
vault token lookup <token>

# Check policy details
vault policy read api-developer
```

### Service Not Responding
```bash
# Check if services are running
curl http://localhost:3001/health
curl http://localhost:5173

# Restart services
pkill -f "tsx watch" && cd mcp-proxy && npm run dev &
pkill -f "vite" && npm run dev &
```
