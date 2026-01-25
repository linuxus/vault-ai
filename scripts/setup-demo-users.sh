#!/bin/bash

# =============================================================================
# Vault AI - Demo Users and Policies Setup
# =============================================================================
# This script creates demo user personas with restricted policies to demonstrate
# RBAC (Role-Based Access Control) in Vault AI.
#
# Prerequisites:
#   - Vault CLI installed
#   - VAULT_ADDR environment variable set
#   - VAULT_TOKEN environment variable set (root or admin token)
#   - Enterprise secrets already provisioned (run setup-enterprise-secrets.sh first)
#
# Usage:
#   export VAULT_ADDR=https://vault.example.com:8200
#   export VAULT_TOKEN=<root-token>
#   ./scripts/setup-demo-users.sh
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Output functions
info() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }
header() { echo -e "\n${PURPLE}═══════════════════════════════════════════════════════════════${NC}"; echo -e "${PURPLE}  $1${NC}"; echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"; }

# Token storage file
TOKEN_FILE="$(dirname "$0")/demo-tokens.env"

# =============================================================================
# Prerequisites Check
# =============================================================================

header "Checking Prerequisites"

if ! command -v vault &> /dev/null; then
    error "Vault CLI is not installed. Please install it first."
    exit 1
fi
success "Vault CLI found"

if [ -z "$VAULT_ADDR" ]; then
    error "VAULT_ADDR environment variable is not set"
    exit 1
fi
success "VAULT_ADDR is set to: $VAULT_ADDR"

if [ -z "$VAULT_TOKEN" ]; then
    error "VAULT_TOKEN environment variable is not set"
    exit 1
fi
success "VAULT_TOKEN is set"

# Test connection
if ! vault status &> /dev/null; then
    error "Cannot connect to Vault at $VAULT_ADDR"
    exit 1
fi
success "Connected to Vault successfully"

# =============================================================================
# Enable Userpass Auth Method
# =============================================================================

header "Enabling Userpass Authentication"

if vault auth list | grep -q "userpass/"; then
    warn "Userpass auth method already enabled"
else
    vault auth enable userpass
    success "Userpass auth method enabled"
fi

# =============================================================================
# Create Policies
# =============================================================================

header "Creating Access Policies"

# -----------------------------------------------------------------------------
# 1. API Developer Policy
# Can access: api-gateway, third-party APIs, user-service (non-database)
# Cannot access: database secrets, infrastructure, certificates
# -----------------------------------------------------------------------------

info "Creating api-developer policy..."
vault policy write api-developer - <<'EOF'
# API Developer Policy
# Access to API Gateway and third-party API integrations
# NO access to database secrets or infrastructure

# API Gateway - full access
path "applications/data/api-gateway/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}
path "applications/metadata/api-gateway/*" {
  capabilities = ["read", "list"]
}

# User Service - read JWT and Redis only (no database)
path "applications/data/user-service/*/jwt" {
  capabilities = ["read", "list"]
}
path "applications/data/user-service/*/redis" {
  capabilities = ["read", "list"]
}

# Third-party APIs - read access
path "third-party/data/ai/*" {
  capabilities = ["read", "list"]
}
path "third-party/data/analytics/*" {
  capabilities = ["read", "list"]
}
path "third-party/data/maps/*" {
  capabilities = ["read", "list"]
}
path "third-party/data/auth/*" {
  capabilities = ["read", "list"]
}
path "third-party/metadata/*" {
  capabilities = ["read", "list"]
}

# List mounts and basic navigation
path "sys/mounts" {
  capabilities = ["read"]
}
path "applications/metadata" {
  capabilities = ["list"]
}
path "applications/metadata/*" {
  capabilities = ["list"]
}
path "third-party/metadata" {
  capabilities = ["list"]
}

# Deny database secrets explicitly
path "applications/data/*/database" {
  capabilities = ["deny"]
}
path "applications/data/*/*/database" {
  capabilities = ["deny"]
}
path "infrastructure/*" {
  capabilities = ["deny"]
}
EOF
success "api-developer policy created"

# -----------------------------------------------------------------------------
# 2. DBA Admin Policy
# Can access: All database secrets across services
# Cannot access: API keys, certificates, infrastructure (non-db)
# -----------------------------------------------------------------------------

info "Creating dba-admin policy..."
vault policy write dba-admin - <<'EOF'
# DBA Admin Policy
# Full access to database secrets across all services
# NO access to API keys, certificates, or cloud infrastructure

# Database secrets across all applications
path "applications/data/+/+/database" {
  capabilities = ["create", "read", "update", "delete", "list"]
}
path "applications/metadata/+/+/database" {
  capabilities = ["read", "list", "delete"]
}

# Payment service database (has encryption keys)
path "applications/data/payment-service/*/database" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# Data team warehouses
path "teams/data/warehouses/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}
path "teams/metadata/data/warehouses/*" {
  capabilities = ["read", "list"]
}

# Kafka streaming (data infrastructure)
path "teams/data/streaming/*" {
  capabilities = ["read", "list"]
}

# Database TLS certificates - read only
path "certificates/data/services/database-tls" {
  capabilities = ["read"]
}

# List mounts and navigation
path "sys/mounts" {
  capabilities = ["read"]
}
path "applications/metadata" {
  capabilities = ["list"]
}
path "applications/metadata/*" {
  capabilities = ["list"]
}
path "teams/metadata" {
  capabilities = ["list"]
}
path "teams/metadata/data" {
  capabilities = ["list"]
}
path "teams/metadata/data/*" {
  capabilities = ["list"]
}

# Explicit denials
path "third-party/*" {
  capabilities = ["deny"]
}
path "infrastructure/data/aws/*" {
  capabilities = ["deny"]
}
path "certificates/data/ca/*" {
  capabilities = ["deny"]
}
EOF
success "dba-admin policy created"

# -----------------------------------------------------------------------------
# 3. Security Analyst Policy
# Can access: Security scanning, certificates (read), audit configs
# Cannot access: Modify secrets, infrastructure credentials
# -----------------------------------------------------------------------------

info "Creating security-analyst policy..."
vault policy write security-analyst - <<'EOF'
# Security Analyst Policy
# Read access to security tools, certificates, and audit configurations
# NO write access, NO infrastructure credentials

# Security team secrets - read only
path "teams/data/security/*" {
  capabilities = ["read", "list"]
}
path "teams/metadata/security/*" {
  capabilities = ["read", "list"]
}

# Certificates - read only (for audit/compliance)
path "certificates/data/*" {
  capabilities = ["read", "list"]
}
path "certificates/metadata/*" {
  capabilities = ["read", "list"]
}

# Shared encryption keys - read only (audit key management)
path "shared/data/encryption/*" {
  capabilities = ["read", "list"]
}
path "shared/data/signing/*" {
  capabilities = ["read", "list"]
}
path "shared/metadata/*" {
  capabilities = ["read", "list"]
}

# Third-party auth providers - read only (security review)
path "third-party/data/auth/*" {
  capabilities = ["read", "list"]
}

# Monitoring/SIEM - read only
path "infrastructure/data/monitoring/*" {
  capabilities = ["read", "list"]
}

# List mounts and navigation
path "sys/mounts" {
  capabilities = ["read"]
}
path "teams/metadata" {
  capabilities = ["list"]
}
path "certificates/metadata" {
  capabilities = ["list"]
}
path "shared/metadata" {
  capabilities = ["list"]
}
path "third-party/metadata" {
  capabilities = ["list"]
}
path "third-party/metadata/auth" {
  capabilities = ["list"]
}
path "infrastructure/metadata" {
  capabilities = ["list"]
}
path "infrastructure/metadata/monitoring" {
  capabilities = ["list"]
}

# Explicit denials - no cloud credentials
path "infrastructure/data/aws/*" {
  capabilities = ["deny"]
}
path "infrastructure/data/kubernetes/*" {
  capabilities = ["deny"]
}
EOF
success "security-analyst policy created"

# -----------------------------------------------------------------------------
# 4. DevOps Engineer Policy
# Can access: Infrastructure, CI/CD, Docker, Kubernetes
# Cannot access: Application secrets, payment credentials
# -----------------------------------------------------------------------------

info "Creating devops-engineer policy..."
vault policy write devops-engineer - <<'EOF'
# DevOps Engineer Policy
# Full access to infrastructure, CI/CD, and deployment systems
# NO access to application business secrets or payment systems

# Infrastructure - full access
path "infrastructure/data/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}
path "infrastructure/metadata/*" {
  capabilities = ["read", "list", "delete"]
}

# DevOps team CI/CD
path "teams/data/devops/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}
path "teams/metadata/devops/*" {
  capabilities = ["read", "list", "delete"]
}

# Certificates for deployments
path "certificates/data/wildcard/*" {
  capabilities = ["read", "list"]
}
path "certificates/data/services/*" {
  capabilities = ["read", "list"]
}
path "certificates/metadata/*" {
  capabilities = ["read", "list"]
}

# Shared configs (feature flags, logging)
path "shared/data/config/*" {
  capabilities = ["read", "list"]
}

# List mounts and navigation
path "sys/mounts" {
  capabilities = ["read"]
}
path "infrastructure/metadata" {
  capabilities = ["list"]
}
path "teams/metadata" {
  capabilities = ["list"]
}
path "teams/metadata/devops" {
  capabilities = ["list"]
}
path "certificates/metadata" {
  capabilities = ["list"]
}
path "shared/metadata" {
  capabilities = ["list"]
}
path "shared/metadata/config" {
  capabilities = ["list"]
}

# Explicit denials - no application secrets
path "applications/data/payment-service/*" {
  capabilities = ["deny"]
}
path "third-party/data/payments/*" {
  capabilities = ["deny"]
}
EOF
success "devops-engineer policy created"

# -----------------------------------------------------------------------------
# 5. Platform Engineer Policy
# Can access: Platform tools, shared configs, notification service
# Cannot access: Security secrets, payment systems, raw DB credentials
# -----------------------------------------------------------------------------

info "Creating platform-engineer policy..."
vault policy write platform-engineer - <<'EOF'
# Platform Engineer Policy
# Access to platform tooling, shared configurations, and notification services
# NO access to security secrets, payments, or raw database credentials

# Platform team secrets
path "teams/data/platform/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}
path "teams/metadata/platform/*" {
  capabilities = ["read", "list", "delete"]
}

# Shared organizational configs
path "shared/data/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}
path "shared/metadata/*" {
  capabilities = ["read", "list", "delete"]
}

# Notification service
path "applications/data/notification-service/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}
path "applications/metadata/notification-service/*" {
  capabilities = ["read", "list"]
}

# Third-party communication tools
path "third-party/data/communication/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}
path "third-party/metadata/communication/*" {
  capabilities = ["read", "list"]
}

# List mounts and navigation
path "sys/mounts" {
  capabilities = ["read"]
}
path "teams/metadata" {
  capabilities = ["list"]
}
path "shared/metadata" {
  capabilities = ["list"]
}
path "applications/metadata" {
  capabilities = ["list"]
}
path "applications/metadata/notification-service" {
  capabilities = ["list"]
}
path "third-party/metadata" {
  capabilities = ["list"]
}

# Explicit denials
path "teams/data/security/*" {
  capabilities = ["deny"]
}
path "applications/data/payment-service/*" {
  capabilities = ["deny"]
}
path "third-party/data/payments/*" {
  capabilities = ["deny"]
}
EOF
success "platform-engineer policy created"

# =============================================================================
# Create Demo Users
# =============================================================================

header "Creating Demo Users"

# Default password for all demo users (change in production!)
DEFAULT_PASSWORD="demo-password-123"

create_user() {
    local username=$1
    local policy=$2
    local display_name=$3

    info "Creating user: $username ($display_name)"
    vault write auth/userpass/users/$username \
        password="$DEFAULT_PASSWORD" \
        policies="$policy" \
        token_ttl="8h" \
        token_max_ttl="24h"
    success "User $username created with policy: $policy"
}

create_user "api-developer" "api-developer" "API Developer"
create_user "dba-admin" "dba-admin" "Database Administrator"
create_user "security-analyst" "security-analyst" "Security Analyst"
create_user "devops-engineer" "devops-engineer" "DevOps Engineer"
create_user "platform-engineer" "platform-engineer" "Platform Engineer"

# =============================================================================
# Generate and Store Tokens
# =============================================================================

header "Generating Authentication Tokens"

# Clear previous tokens file
cat > "$TOKEN_FILE" << 'EOF'
# =============================================================================
# Vault AI Demo User Tokens
# =============================================================================
# Generated by setup-demo-users.sh
#
# Usage in terminal:
#   source scripts/demo-tokens.env
#   export VAULT_TOKEN=$API_DEVELOPER_TOKEN
#
# Usage in Vault AI:
#   Copy the token and paste it in the login form
#
# WARNING: These tokens are for demo purposes only!
# =============================================================================

EOF

generate_token() {
    local username=$1
    local var_name=$2
    local display_name=$3

    info "Generating token for $username..."

    # Login and get token
    local token=$(vault write -field=token auth/userpass/login/$username password="$DEFAULT_PASSWORD")

    if [ -n "$token" ]; then
        echo "# $display_name" >> "$TOKEN_FILE"
        echo "# Policy: $username" >> "$TOKEN_FILE"
        echo "${var_name}_TOKEN=\"$token\"" >> "$TOKEN_FILE"
        echo "" >> "$TOKEN_FILE"
        success "Token generated for $username"
    else
        error "Failed to generate token for $username"
    fi
}

generate_token "api-developer" "API_DEVELOPER" "API Developer"
generate_token "dba-admin" "DBA_ADMIN" "Database Administrator"
generate_token "security-analyst" "SECURITY_ANALYST" "Security Analyst"
generate_token "devops-engineer" "DEVOPS_ENGINEER" "DevOps Engineer"
generate_token "platform-engineer" "PLATFORM_ENGINEER" "Platform Engineer"

# Add helper section to token file
cat >> "$TOKEN_FILE" << 'EOF'
# =============================================================================
# Quick Reference - What Each User Can Access
# =============================================================================
#
# API_DEVELOPER:
#   ✓ applications/api-gateway/*
#   ✓ third-party/ai/*, analytics/*, maps/*, auth/*
#   ✓ user-service JWT and Redis (not database)
#   ✗ Cannot access: database secrets, infrastructure, certificates
#
# DBA_ADMIN:
#   ✓ All database secrets (applications/*/database)
#   ✓ teams/data/warehouses/* (Snowflake, BigQuery)
#   ✓ teams/data/streaming/* (Kafka)
#   ✓ certificates/services/database-tls (read-only)
#   ✗ Cannot access: API keys, cloud infrastructure, CA certificates
#
# SECURITY_ANALYST:
#   ✓ teams/security/* (read-only)
#   ✓ certificates/* (read-only)
#   ✓ shared/encryption/*, signing/* (read-only)
#   ✓ infrastructure/monitoring/* (read-only)
#   ✗ Cannot access: Modify any secrets, cloud credentials
#
# DEVOPS_ENGINEER:
#   ✓ infrastructure/* (full access)
#   ✓ teams/devops/* (CI/CD tools)
#   ✓ certificates/wildcard/*, services/* (read-only)
#   ✓ shared/config/* (read-only)
#   ✗ Cannot access: payment-service, third-party/payments
#
# PLATFORM_ENGINEER:
#   ✓ teams/platform/* (full access)
#   ✓ shared/* (full access)
#   ✓ applications/notification-service/*
#   ✓ third-party/communication/*
#   ✗ Cannot access: security secrets, payment systems
#
# =============================================================================
EOF

chmod 600 "$TOKEN_FILE"
success "Tokens saved to: $TOKEN_FILE"

# =============================================================================
# Summary
# =============================================================================

header "Setup Complete!"

echo -e "${CYAN}"
cat << 'EOF'
Demo users have been created with the following credentials:

┌──────────────────────┬────────────────────┬─────────────────────────────────┐
│ Username             │ Password           │ Primary Access                  │
├──────────────────────┼────────────────────┼─────────────────────────────────┤
│ api-developer        │ demo-password-123  │ API Gateway, Third-party APIs   │
│ dba-admin            │ demo-password-123  │ Database secrets, Data warehouses│
│ security-analyst     │ demo-password-123  │ Security tools, Certificates (RO)│
│ devops-engineer      │ demo-password-123  │ Infrastructure, CI/CD           │
│ platform-engineer    │ demo-password-123  │ Platform tools, Shared configs  │
└──────────────────────┴────────────────────┴─────────────────────────────────┘

Tokens have been saved to: scripts/demo-tokens.env

To use a token:
  1. Source the file:  source scripts/demo-tokens.env
  2. Export a token:   export VAULT_TOKEN=$API_DEVELOPER_TOKEN

Or copy a token directly into the Vault AI login form.

EOF
echo -e "${NC}"

# Demo scenarios
echo -e "${YELLOW}Demo Scenarios to Try:${NC}"
echo ""
echo "1. Login as api-developer and try:"
echo "   - 'Show me the API gateway OAuth configuration' ✓ (allowed)"
echo "   - 'Show me the user-service database password' ✗ (denied)"
echo ""
echo "2. Login as dba-admin and try:"
echo "   - 'List all database secrets' ✓ (allowed)"
echo "   - 'Show me the Stripe API key' ✗ (denied)"
echo ""
echo "3. Login as security-analyst and try:"
echo "   - 'Show me all certificates' ✓ (allowed)"
echo "   - 'Delete the Snyk API token' ✗ (denied - read only)"
echo ""
echo "4. Login as devops-engineer and try:"
echo "   - 'Show me the AWS production credentials' ✓ (allowed)"
echo "   - 'Show me the payment service Stripe keys' ✗ (denied)"
echo ""
