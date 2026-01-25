# Vault AI - Product Requirements Document

## Executive Summary

Vault AI is a modern, polished web interface for HashiCorp Vault that combines traditional API-driven operations with AI-assisted workflows through Model Context Protocol (MCP) integration. The application empowers developers and security teams to manage secrets, certificates, and access policies through an intuitive interface while leveraging AI to simplify complex operations.

### Vision Statement

To provide the most intuitive and powerful interface for HashiCorp Vault operations, reducing the learning curve for new users while accelerating workflows for experienced practitioners through intelligent AI assistance.

### Key Value Propositions

1. **Unified Interface**: Single pane of glass for all Vault operations
2. **AI-Assisted Workflows**: Natural language interactions for complex operations
3. **HashiCorp Design Language**: Familiar, professional interface aligned with Vault ecosystem
4. **Self-Hosted Security**: On-premises deployment ensuring data sovereignty

---

## User Personas

### 1. Developer (Primary User)

**Profile**: Application developers who need to access secrets for their applications

| Attribute | Description |
|-----------|-------------|
| **Goals** | Quickly retrieve secrets, manage application credentials, generate certificates |
| **Pain Points** | CLI complexity, context switching, remembering Vault paths |
| **Technical Level** | Moderate Vault knowledge, strong application development skills |
| **Use Frequency** | Daily |

**Key Scenarios**:
- Retrieve database credentials for local development
- Generate TLS certificates for microservices
- Create and rotate API keys
- View secret history and metadata

### 2. Security Administrator

**Profile**: Security professionals responsible for Vault configuration and policy management

| Attribute | Description |
|-----------|-------------|
| **Goals** | Define access policies, audit secret access, manage authentication methods |
| **Pain Points** | Policy syntax complexity, audit log analysis, compliance reporting |
| **Technical Level** | Expert Vault knowledge, strong security background |
| **Use Frequency** | Weekly (intensive sessions) |

**Key Scenarios**:
- Create and test ACL policies
- Review access patterns and audit logs
- Configure authentication methods (LDAP, OIDC, AppRole)
- Manage entity aliases and groups

### 3. Platform Engineer

**Profile**: Infrastructure/DevOps engineers managing Vault deployment and integrations

| Attribute | Description |
|-----------|-------------|
| **Goals** | Manage secret engines, configure PKI infrastructure, automate operations |
| **Pain Points** | Complex PKI setup, engine configuration, troubleshooting |
| **Technical Level** | Expert Vault and infrastructure knowledge |
| **Use Frequency** | Weekly |

**Key Scenarios**:
- Enable and configure secret engines
- Set up PKI hierarchies with intermediate CAs
- Manage dynamic database credentials
- Configure transit encryption

---

## Feature Requirements

### Category 1: Secrets Management

#### 1.1 KV Secrets Engine (v1 & v2)

| Feature | Priority | Description |
|---------|----------|-------------|
| Browse Secrets | P0 | Navigate secret paths with folder-like interface |
| Read Secrets | P0 | View secret values with copy-to-clipboard |
| Create Secrets | P0 | Create new secrets with key-value editor |
| Update Secrets | P0 | Modify existing secrets |
| Delete Secrets | P0 | Soft/hard delete with confirmation |
| Version History (v2) | P1 | View and restore previous versions |
| Secret Metadata | P1 | View and edit custom metadata |
| Diff View (v2) | P2 | Compare secret versions side-by-side |
| Bulk Operations | P2 | Multi-select for batch delete/move |

#### 1.2 Dynamic Secrets

| Feature | Priority | Description |
|---------|----------|-------------|
| Database Credentials | P1 | Generate dynamic DB credentials |
| Cloud Credentials | P2 | AWS/GCP/Azure dynamic credentials |
| Lease Management | P1 | View and revoke active leases |
| Credential Rotation | P2 | Trigger manual rotation |

### Category 2: PKI/Certificates

#### 2.1 Certificate Authority Management

| Feature | Priority | Description |
|---------|----------|-------------|
| Root CA Setup | P0 | Generate or import root CA |
| Intermediate CA | P0 | Create intermediate CAs |
| CA Chain View | P1 | Visual CA hierarchy |
| CA Rotation | P2 | Rotate CA certificates |
| CRL Management | P2 | View and manage revocation lists |

#### 2.2 Certificate Issuance

| Feature | Priority | Description |
|---------|----------|-------------|
| Issue Certificate | P0 | Generate certificates from roles |
| Role Management | P0 | Create and configure PKI roles |
| Certificate List | P1 | View issued certificates |
| Certificate Revocation | P1 | Revoke certificates |
| Download Formats | P1 | PEM, PKCS12, JKS export |

### Category 3: Authentication

#### 3.1 Auth Method Management

| Feature | Priority | Description |
|---------|----------|-------------|
| Token Auth | P0 | Create and manage tokens |
| UserPass | P1 | Username/password authentication |
| AppRole | P1 | Application role-based auth |
| LDAP | P2 | LDAP/AD integration |
| OIDC | P2 | OpenID Connect SSO |

#### 3.2 Token Management

| Feature | Priority | Description |
|---------|----------|-------------|
| Token Lookup | P0 | View token details and capabilities |
| Token Creation | P0 | Create child tokens with policies |
| Token Renewal | P1 | Extend token TTL |
| Token Revocation | P1 | Revoke tokens and accessories |
| Accessor Lookup | P2 | Search tokens by accessor |

### Category 4: Policies & Identity

#### 4.1 ACL Policies

| Feature | Priority | Description |
|---------|----------|-------------|
| Policy List | P0 | View all policies |
| Policy Editor | P0 | Create/edit with syntax highlighting |
| Policy Validation | P1 | Syntax checking before save |
| Policy Testing | P1 | Test policy against paths |
| Policy Templates | P2 | Common policy patterns |

#### 4.2 Identity Management

| Feature | Priority | Description |
|---------|----------|-------------|
| Entity Management | P1 | Create and manage entities |
| Entity Aliases | P1 | Map auth methods to entities |
| Group Management | P1 | Create internal/external groups |
| Group Policies | P1 | Assign policies to groups |

### Category 5: AI-Assisted Operations (MCP)

#### 5.1 Chat Interface

| Feature | Priority | Description |
|---------|----------|-------------|
| Natural Language Queries | P0 | Ask questions about secrets/policies |
| Command Execution | P0 | Execute Vault operations via chat |
| Context Awareness | P1 | Understand current navigation context |
| Operation History | P1 | View and replay AI operations |
| Suggested Actions | P2 | Proactive suggestions based on context |

#### 5.2 AI Capabilities

| Feature | Priority | Description |
|---------|----------|-------------|
| Secret Discovery | P0 | "Find all database credentials" |
| Policy Generation | P1 | "Create a policy for team-x" |
| Certificate Workflow | P1 | "Generate a cert for api.example.com" |
| Troubleshooting | P2 | "Why can't I access /secret/data/prod?" |
| Bulk Operations | P2 | "Rotate all secrets in /secret/data/legacy" |

---

## User Stories

### Secrets Management

| ID | User Story | Acceptance Criteria |
|----|------------|---------------------|
| SM-1 | As a developer, I want to browse secrets by path so that I can find the credentials I need | - Folder tree navigation<br>- Search/filter by path<br>- Breadcrumb navigation |
| SM-2 | As a developer, I want to copy secret values with one click so that I can quickly use them | - Copy button next to each value<br>- Visual confirmation of copy<br>- Masked values by default |
| SM-3 | As a security admin, I want to view secret version history so that I can audit changes | - Version list with timestamps<br>- Diff between versions<br>- Restore to previous version |
| SM-4 | As a platform engineer, I want to manage KV engines so that I can organize secrets | - Enable new KV mounts<br>- Configure engine settings<br>- Disable/delete engines |

### PKI/Certificates

| ID | User Story | Acceptance Criteria |
|----|------------|---------------------|
| PKI-1 | As a platform engineer, I want to set up a PKI hierarchy so that I can issue certificates | - Root CA generation wizard<br>- Intermediate CA creation<br>- Visual hierarchy display |
| PKI-2 | As a developer, I want to issue a certificate for my service so that I can enable TLS | - Role-based issuance form<br>- Domain/SAN input<br>- Multiple download formats |
| PKI-3 | As a security admin, I want to revoke compromised certificates so that I can maintain security | - Certificate search<br>- Revocation with reason<br>- CRL update confirmation |

### Authentication

| ID | User Story | Acceptance Criteria |
|----|------------|---------------------|
| AUTH-1 | As an admin, I want to create application tokens so that services can authenticate | - Token creation form<br>- Policy attachment<br>- TTL configuration |
| AUTH-2 | As an admin, I want to configure AppRole so that CI/CD can access secrets | - Role creation wizard<br>- Secret ID generation<br>- Bind parameters config |
| AUTH-3 | As a user, I want to renew my token so that I don't lose access | - Renewal button<br>- New TTL display<br>- Session persistence |

### Policies

| ID | User Story | Acceptance Criteria |
|----|------------|---------------------|
| POL-1 | As a security admin, I want to write policies with syntax help so that I avoid errors | - HCL syntax highlighting<br>- Auto-completion<br>- Real-time validation |
| POL-2 | As a security admin, I want to test policies before deployment so that I verify access | - Path tester interface<br>- Capability output<br>- Multiple path testing |

### AI-Assisted

| ID | User Story | Acceptance Criteria |
|----|------------|---------------------|
| AI-1 | As a developer, I want to ask "where are the database credentials" so that I can find secrets without knowing exact paths | - Natural language understanding<br>- Search results with paths<br>- Direct navigation option |
| AI-2 | As a security admin, I want to say "create a read-only policy for path /secret/data/app" so that I can quickly define access | - Policy generation<br>- Preview before creation<br>- Edit option |
| AI-3 | As a developer, I want to request "generate a certificate for api.internal.com" so that I can get certs without knowing PKI details | - Role selection/suggestion<br>- Parameter inference<br>- Certificate download |

---

## Success Metrics

### Adoption Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Daily Active Users | 80% of Vault users | Login analytics |
| Session Duration | > 5 minutes average | Session tracking |
| Feature Adoption | 60% use AI features | Feature usage analytics |

### Efficiency Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to First Secret | < 30 seconds | User journey tracking |
| Certificate Issuance Time | < 60 seconds | Operation timing |
| Policy Creation Time | 50% reduction vs CLI | Comparative testing |

### Quality Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Error Rate | < 1% of operations | Error logging |
| User Satisfaction | > 4.0/5.0 | In-app surveys |
| AI Accuracy | > 90% successful completions | AI operation tracking |

### Security Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Authentication Failures | < 5% of attempts | Auth logging |
| Unauthorized Access Attempts | 0 | Security audit |
| Session Timeout Compliance | 100% | Session management |

---

## Non-Functional Requirements

### Performance

- Page load time: < 2 seconds
- API response rendering: < 500ms
- Search results: < 1 second
- AI response time: < 5 seconds

### Security

- TLS 1.3 for all connections
- No secret caching in browser storage
- Automatic session timeout (configurable)
- CSP headers and XSS protection
- Audit logging of all operations

### Accessibility

- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode option

### Browser Support

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

---

## Out of Scope (v1)

- Mobile native applications
- Vault Enterprise features (namespaces, Sentinel)
- Vault Agent configuration
- Vault cluster management
- Secret migration tools
- Custom plugin management
- Replication configuration

---

## Dependencies

| Dependency | Type | Notes |
|------------|------|-------|
| HashiCorp Vault | External | v1.12+ required |
| Vault MCP Server | External | For AI features |
| OIDC Provider | Optional | For SSO authentication |
| LDAP/AD | Optional | For enterprise auth |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-16 | Vault AI Team | Initial PRD |
