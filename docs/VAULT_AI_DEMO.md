# Vault AI: AI-Assisted Secrets Management

## Technical Demo Guide

---

## Table of Contents

1. [Introduction](#introduction)
2. [Why Vault AI?](#why-vault-ai)
3. [Architecture Overview](#architecture-overview)
4. [Demo Environment](#demo-environment)
5. [Use Cases & Demo Scenarios](#use-cases--demo-scenarios)
   - [Scenario 1: Secret Discovery & Exploration](#scenario-1-secret-discovery--exploration)
   - [Scenario 2: Reading Secrets with Context](#scenario-2-reading-secrets-with-context)
   - [Scenario 3: Creating & Updating Secrets](#scenario-3-creating--updating-secrets)
   - [Scenario 4: Bulk Operations](#scenario-4-bulk-operations)
   - [Scenario 5: PKI Certificate Management](#scenario-5-pki-certificate-management)
   - [Scenario 6: Mount Management](#scenario-6-mount-management)
   - [Scenario 7: Cross-Referencing & Analysis](#scenario-7-cross-referencing--analysis)
6. [Traditional vs AI-Assisted Comparison](#traditional-vs-ai-assisted-comparison)
7. [Security Considerations](#security-considerations)
8. [Q&A Topics](#qa-topics)

---

## Introduction

**Vault AI** is a modern web interface for HashiCorp Vault that combines traditional API operations with AI-assisted natural language workflows. It enables teams to manage secrets, certificates, and policies using conversational interactions while maintaining Vault's enterprise-grade security model.

### What is Vault AI?

```
┌─────────────────────────────────────────────────────────────────┐
│                         VAULT AI                                │
│                                                                 │
│   "Show me all production database credentials"                 │
│                           ↓                                     │
│   AI understands intent → Executes Vault operations → Returns   │
│                           ↓                                     │
│   Formatted, contextual results with actionable insights        │
└─────────────────────────────────────────────────────────────────┘
```

### Key Capabilities

| Capability | Description |
|------------|-------------|
| **Natural Language Queries** | Ask questions in plain English instead of memorizing CLI commands |
| **Intelligent Discovery** | Find secrets across mounts without knowing exact paths |
| **Contextual Operations** | AI understands relationships between secrets and environments |
| **Guided Workflows** | Step-by-step assistance for complex PKI and policy operations |
| **Hybrid Interface** | Traditional UI + AI chat working together |

---

## Why Vault AI?

### The Problem with Traditional Vault Management

| Challenge | Impact |
|-----------|--------|
| **Steep Learning Curve** | Engineers spend hours learning Vault CLI syntax and API patterns |
| **Path Memorization** | Teams maintain spreadsheets of secret paths |
| **Context Switching** | Jumping between docs, CLI, and UI to complete tasks |
| **Discovery Difficulty** | Finding existing secrets requires knowing where to look |
| **Onboarding Friction** | New team members struggle with Vault's complexity |

### The Vault AI Solution

```
Traditional Approach:
$ vault kv list secret/
$ vault kv list secret/applications/
$ vault kv list secret/applications/user-service/
$ vault kv list secret/applications/user-service/prod/
$ vault kv get secret/applications/user-service/prod/database

Vault AI Approach:
> "Show me the production database credentials for user-service"
```

### Value Proposition

| Benefit | Metric |
|---------|--------|
| **Reduced Time-to-Secret** | 70% faster secret retrieval for complex queries |
| **Lower Onboarding Time** | New engineers productive in hours, not days |
| **Fewer Errors** | AI validates paths and suggests corrections |
| **Better Discovery** | Find secrets you didn't know existed |
| **Audit-Friendly** | All operations logged with full context |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              VAULT AI                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────────┐    │
│  │   React UI   │────▶│  MCP Proxy   │────▶│  HashiCorp Vault     │    │
│  │   (Browser)  │     │  (Node.js)   │     │  MCP Server          │    │
│  └──────────────┘     └──────────────┘     └──────────────────────┘    │
│         │                    │                        │                 │
│         │                    ▼                        ▼                 │
│         │             ┌──────────────┐     ┌──────────────────────┐    │
│         │             │   Claude AI  │     │   Vault Server       │    │
│         │             │   (LLM)      │     │   (Secrets Store)    │    │
│         │             └──────────────┘     └──────────────────────┘    │
│         │                                            ▲                  │
│         └────────────── Direct HTTP API ─────────────┘                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Communication Paths

1. **Direct HTTP API** - Traditional CRUD operations (fast, direct)
2. **MCP Proxy → AI** - Natural language processing and intelligent operations

### Supported Operations (via MCP)

| Engine | Operations |
|--------|------------|
| **KV v2** | list, read, write, delete, metadata, versions |
| **PKI** | generate CA, create roles, issue certificates, revoke |
| **Mounts** | list, enable, disable, tune |

---

## Demo Environment

### Enterprise Secrets Structure

The demo environment simulates a typical enterprise Vault deployment:

```
vault/
├── applications/           # Application secrets by service & environment
│   ├── user-service/
│   │   ├── dev/           # database, redis, jwt
│   │   ├── staging/       # database, redis
│   │   └── prod/          # database, redis, jwt
│   ├── payment-service/
│   │   ├── dev/           # stripe
│   │   └── prod/          # stripe, database
│   ├── api-gateway/
│   │   └── prod/          # rate-limiting, oauth
│   └── notification-service/
│       └── prod/          # smtp, twilio, firebase
│
├── infrastructure/         # Cloud & platform secrets
│   ├── aws/               # dev, prod, s3-backup
│   ├── kubernetes/        # dev-cluster, prod-cluster
│   ├── terraform/         # backend, cloud
│   ├── docker/            # ecr, dockerhub, ghcr
│   ├── monitoring/        # datadog, pagerduty, grafana
│   └── dns/               # cloudflare, route53
│
├── teams/                  # Team-specific secrets
│   ├── platform/          # github, jira, confluence
│   ├── security/          # snyk, sonarqube, splunk, vault-admin
│   ├── devops/            # jenkins, github-actions, argocd, nexus
│   └── data/              # snowflake, bigquery, kafka
│
├── third-party/            # External integrations
│   ├── analytics/         # google-analytics, mixpanel, segment
│   ├── communication/     # slack, discord, intercom
│   ├── ai/                # openai, anthropic, huggingface
│   ├── maps/              # google-maps, mapbox
│   ├── payments/          # paypal, square
│   └── auth/              # auth0, okta
│
├── certificates/           # TLS certificates & CAs
│   ├── wildcard/          # company-com, internal
│   ├── services/          # api-gateway, database-tls
│   └── ca/                # internal-root, internal-intermediate
│
└── shared/                 # Organization-wide secrets
    ├── config/            # feature-flags, logging
    ├── encryption/        # data-at-rest, pii
    ├── signing/           # webhook, api-tokens
    └── licenses/          # enterprise-tools
```

**Total: 60+ secrets across 6 mounts**

---

## Use Cases & Demo Scenarios

### Scenario 1: Secret Discovery & Exploration

**Goal:** Find secrets without knowing exact paths

#### Demo Prompts

```
"What secret mounts do we have?"
```
*AI lists all available mounts with descriptions*

```
"Show me the structure of the applications mount"
```
*AI explores and displays the hierarchy*

```
"What services have production secrets configured?"
```
*AI searches across mounts and summarizes findings*

```
"Find all secrets related to databases"
```
*AI searches for database-related secrets across all mounts*

#### Key Value

- No need to memorize paths
- Discover secrets you didn't know existed
- Understand organizational structure quickly

---

### Scenario 2: Reading Secrets with Context

**Goal:** Retrieve secrets with natural language

#### Demo Prompts

```
"Show me the production database credentials for user-service"
```
*AI navigates to applications/user-service/prod/database and displays values*

```
"What's the Stripe API key for production?"
```
*AI finds payment-service/prod/stripe and shows relevant fields*

```
"Get the AWS credentials we use for backups"
```
*AI locates infrastructure/aws/s3-backup*

```
"Show me all the AI service API keys"
```
*AI lists third-party/ai/* secrets (openai, anthropic, huggingface)*

#### Comparison

| Traditional CLI | Vault AI |
|-----------------|----------|
| `vault kv get applications/user-service/prod/database` | "Show me user-service prod database credentials" |
| Need to know exact path | Describe what you're looking for |

---

### Scenario 3: Creating & Updating Secrets

**Goal:** Create and modify secrets conversationally

#### Demo Prompts

```
"Create a new secret for the inventory-service in dev with database host
 dev-inventory-db.internal, username inventory_user, and password SecurePass123"
```
*AI creates applications/inventory-service/dev/database*

```
"Update the user-service production JWT expiry from 1h to 30m"
```
*AI reads current secret, modifies the value, writes back*

```
"Copy the user-service dev redis config to staging"
```
*AI reads dev config and writes to staging path*

```
"Add a new field 'connection_timeout' with value '30s' to the
 payment-service production database secret"
```
*AI preserves existing fields and adds new one*

#### Key Value

- No JSON formatting required
- AI handles path construction
- Preserves existing data during updates

---

### Scenario 4: Bulk Operations

**Goal:** Perform operations across multiple secrets

#### Demo Prompts

```
"List all secrets that contain passwords"
```
*AI searches and identifies secrets with password fields*

```
"Show me all production secrets across all services"
```
*AI aggregates prod secrets from multiple paths*

```
"What third-party services are we integrated with?"
```
*AI lists all third-party integrations with their purposes*

```
"Find all secrets that might be expiring soon (check for expiry fields)"
```
*AI searches for expiry/expiration fields and reports*

#### Key Value

- Aggregate views across mounts
- Pattern-based discovery
- Audit and compliance assistance

---

### Scenario 5: PKI Certificate Management

**Goal:** Manage certificates with guided workflows

#### Demo Prompts

```
"Set up a new PKI engine for internal certificates"
```
*AI enables PKI, generates root CA, creates roles*

```
"Create a certificate for api.internal.company.com valid for 90 days"
```
*AI issues certificate from appropriate role*

```
"Show me all PKI roles available"
```
*AI lists configured roles with their settings*

```
"Generate a wildcard certificate for *.staging.company.com"
```
*AI validates role permissions and issues certificate*

#### PKI Workflow Example

```
User: "I need to set up internal PKI for our microservices"

AI: "I'll help you set up a PKI infrastructure. Here's my plan:
     1. Enable PKI engine at 'pki-internal/'
     2. Generate a root CA
     3. Create a role for microservice certificates

     Should I proceed?"

User: "Yes, use company.internal as the domain"

AI: [Executes operations and provides certificates]
```

---

### Scenario 6: Mount Management

**Goal:** Manage secret engines

#### Demo Prompts

```
"Create a new KV v2 mount called 'experiments' for R&D team secrets"
```
*AI enables new mount with description*

```
"What mounts do we have and what are they used for?"
```
*AI lists mounts with descriptions and types*

```
"Show me the configuration of the applications mount"
```
*AI displays mount settings and metadata*

#### Key Value

- Guided mount creation
- Clear visibility into mount purposes
- Safe operations with confirmations

---

### Scenario 7: Cross-Referencing & Analysis

**Goal:** Gain insights across the secrets landscape

#### Demo Prompts

```
"Which services connect to PostgreSQL databases?"
```
*AI analyzes secrets and identifies PostgreSQL connections*

```
"Show me all Redis configurations and their differences between dev and prod"
```
*AI compares configurations across environments*

```
"What external services would be affected if our Slack token is rotated?"
```
*AI identifies Slack integrations and their locations*

```
"Give me a security overview - any secrets that might need rotation?"
```
*AI analyzes secrets for rotation indicators*

#### Key Value

- Impact analysis before changes
- Environment comparison
- Security posture insights

---

## Traditional vs AI-Assisted Comparison

### Task: Find and read database credentials for a service

**Traditional CLI:**
```bash
# Step 1: Figure out which mount
vault secrets list

# Step 2: Explore the mount
vault kv list secret/
vault kv list secret/applications/
vault kv list secret/applications/user-service/
vault kv list secret/applications/user-service/prod/

# Step 3: Read the secret
vault kv get secret/applications/user-service/prod/database

# Total: 6 commands, requires knowing structure
```

**Vault AI:**
```
"Show me the user-service production database credentials"

# Total: 1 natural language query
```

### Task: Create a new service with secrets for all environments

**Traditional CLI:**
```bash
vault kv put applications/order-service/dev/database \
  host=dev-db.internal username=order_dev password=DevPass123

vault kv put applications/order-service/staging/database \
  host=staging-db.internal username=order_staging password=StagingPass456

vault kv put applications/order-service/prod/database \
  host=prod-db.internal username=order_prod password=ProdSecure789

# Plus redis, api keys, etc. for each environment
```

**Vault AI:**
```
"Create database credentials for a new order-service:
 - Dev: host dev-db.internal, user order_dev, password DevPass123
 - Staging: host staging-db.internal, user order_staging, password StagingPass456
 - Prod: host prod-db.internal, user order_prod, password ProdSecure789"
```

### Comparison Summary

| Aspect | Traditional | Vault AI |
|--------|-------------|----------|
| **Learning Curve** | Steep - must learn CLI/API | Minimal - use natural language |
| **Discovery** | Must know paths | Describe what you need |
| **Bulk Operations** | Scripts required | Single conversation |
| **Error Prevention** | Manual validation | AI validates and confirms |
| **Context Retention** | None - stateless | Remembers conversation context |
| **Documentation** | Separate from operations | Integrated explanations |

---

## Security Considerations

### How Vault AI Maintains Security

| Security Aspect | Implementation |
|-----------------|----------------|
| **Authentication** | User's Vault token required for all operations |
| **Authorization** | AI operations respect Vault ACL policies |
| **Token Isolation** | Each session uses user's token, no shared access |
| **No Secret Logging** | Secret values never logged or sent to AI training |
| **Audit Trail** | All operations logged in Vault audit log |
| **Session Security** | Tokens stored in sessionStorage only |

### What the AI Can See

```
✓ Secret paths and metadata
✓ Secret keys (field names)
✓ Secret values (to display to user)
✗ Secrets are NOT used for AI training
✗ Secrets are NOT logged by MCP proxy
✗ Secrets are NOT persisted outside Vault
```

### Permission Model

```
User Token Permissions → AI Operation Capabilities

If user can read secret/foo    → AI can read secret/foo
If user cannot write secret/bar → AI cannot write secret/bar

The AI cannot exceed the user's Vault permissions.
```

---

## Q&A Topics

### Frequently Asked Questions

**Q: Does the AI have its own Vault access?**
> No. The AI uses the authenticated user's token for all operations. It has no independent access to Vault.

**Q: Are my secrets sent to external AI services?**
> The MCP proxy processes requests locally. Secret values are displayed to users but not used for AI model training.

**Q: Can the AI accidentally delete important secrets?**
> Destructive operations require explicit confirmation. The AI will summarize what it's about to do before executing.

**Q: What happens if I ask for something I don't have permission for?**
> The AI will receive a permission denied error from Vault and inform you that the operation isn't allowed.

**Q: Can I use Vault AI for production secrets management?**
> Yes, with appropriate access controls. The security model is identical to using Vault CLI or API directly.

**Q: What Vault features are NOT supported via AI?**
> Currently: Transit (encryption), Database dynamic credentials, SSH certificates, and Auth method configuration. These are on the roadmap.

---

## Next Steps

### Roadmap

| Phase | Features |
|-------|----------|
| **Current** | KV v2, PKI, Mount Management |
| **Next** | Transit (Encryption as a Service) |
| **Planned** | Database Secrets Engine |
| **Future** | AWS/Cloud Dynamic Credentials |

### Getting Started

1. **Access Vault AI** at `http://localhost:5173`
2. **Authenticate** with your Vault token
3. **Start chatting** - try "What mounts do we have?"
4. **Explore** - ask questions about your secrets landscape

---

## Demo Checklist

Use this checklist during the live demo:

- [ ] Show login with Vault token
- [ ] Ask "What secret mounts do we have?"
- [ ] Explore applications mount structure
- [ ] Read a specific secret (user-service prod database)
- [ ] Create a new secret for a test service
- [ ] Update an existing secret
- [ ] Show cross-mount search ("find all database credentials")
- [ ] Demonstrate PKI certificate issuance (if PKI is configured)
- [ ] Show permission denied scenario (with limited token)
- [ ] Compare with equivalent CLI commands

---

*Document Version: 1.0*
*Last Updated: January 2026*
*Vault AI - Bringing Intelligence to Secrets Management*
