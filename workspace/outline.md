# Vault AI Presentation Outline

## Presentation Structure

### Slide 0: Title Slide
**Template:** Slide 0 (Title/Cover)
**Content:**
- Title: Vault AI: AI-Assisted Secrets Management
- Subtitle: Technical Demo Guide
- Copyright: Copyright © 2026 HashiCorp

### Slide 1: Agenda
**Template:** Slide 3 (Bullet list)
**Content:**
- Introduction to Vault AI
- The Problem & Solution
- Architecture Overview
- Demo Environment
- Use Cases & Scenarios
- Security Considerations
- Q&A

### Slide 2: What is Vault AI?
**Template:** Slide 14 (4 bullet points)
**Content:**
- Modern web interface combining traditional API operations with AI-assisted workflows
- Natural language queries instead of memorizing CLI commands
- Intelligent discovery - find secrets without knowing exact paths
- Hybrid interface - Traditional UI + AI chat working together

### Slide 3: The Problem with Traditional Vault
**Template:** Slide 22 (Why Change?)
**Content:**
- Title: Why Change? Traditional Vault Management Challenges
- Steep learning curve - hours learning CLI syntax
- Path memorization - teams maintain spreadsheets
- Discovery difficulty - must know where to look
- Onboarding friction - new members struggle

### Slide 4: The Vault AI Solution
**Template:** Slide 24 (Value Proposition)
**Content:**
- Title: Why Vault AI?
- 70% faster secret retrieval
- New engineers productive in hours, not days
- AI validates paths and suggests corrections
- Find secrets you didn't know existed

### Slide 5: Architecture Overview
**Template:** Slide 25 (Diagram style)
**Content:**
- Three-tier communication diagram
- React UI → MCP Proxy → Vault MCP Server
- Direct HTTP API path
- Supported operations: KV v2, PKI, Mounts

### Slide 6: Demo Environment
**Template:** Slide 14 (Bullet list)
**Content:**
- 6 KV v2 mounts simulating enterprise structure
- applications/ - Service secrets by environment
- infrastructure/ - Cloud & platform secrets
- teams/ - Team-specific credentials
- third-party/ - External integrations
- 60+ secrets across all mounts

### Slide 7: Demo Scenarios
**Template:** Slide 14 (Bullet list)
**Content:**
- Secret Discovery & Exploration
- Reading Secrets with Natural Language
- Creating & Updating Secrets
- Bulk Operations & Cross-referencing
- PKI Certificate Management
- Mount Management

### Slide 8: Traditional vs AI-Assisted
**Template:** Slide 22 (Comparison)
**Content:**
- Title: The Transformation
- Traditional: 6 CLI commands to find a secret
- Vault AI: 1 natural language query
- "Show me user-service prod database credentials"

### Slide 9: Security Considerations
**Template:** Slide 14 (Bullet list)
**Content:**
- User's Vault token required for all operations
- AI operations respect Vault ACL policies
- Secret values never logged or sent to AI training
- All operations logged in Vault audit log
- AI cannot exceed user's permissions

### Slide 10: Next Steps & Q&A
**Template:** Slide 14 (Bullet list)
**Content:**
- Current: KV v2, PKI, Mount Management
- Next: Transit (Encryption as a Service)
- Planned: Database Secrets Engine
- Future: AWS/Cloud Dynamic Credentials
- Questions?

---

## Template Mapping

```python
# Template slides to use (0-based indexing)
# Template has 59 slides (indices 0-58)
template_mapping = [
    0,   # Slide 0 - Title slide
    3,   # Slide 1 - Agenda (bullet list)
    14,  # Slide 2 - What is Vault AI (bullet list)
    22,  # Slide 3 - The Problem (Why Change)
    24,  # Slide 4 - Value Proposition
    25,  # Slide 5 - Architecture (diagram style)
    14,  # Slide 6 - Demo Environment (bullet list)
    14,  # Slide 7 - Demo Scenarios (bullet list)
    22,  # Slide 8 - Traditional vs AI (comparison)
    14,  # Slide 9 - Security (bullet list)
    14,  # Slide 10 - Next Steps (bullet list)
]
```

Command:
```bash
python3 scripts/rearrange.py template.pptx working.pptx 0,3,14,22,24,25,14,14,22,14,14
```
