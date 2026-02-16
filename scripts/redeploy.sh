#!/bin/bash

# =============================================================================
# Vault AI Quick Redeploy Script
# =============================================================================
# Rebuilds container images with a unique tag, loads them into the Kind
# cluster, and updates deployments to use the new images — without
# recreating the cluster, Vault, or demo data.
#
# Usage:
#   ./scripts/redeploy.sh              # Rebuild both images and redeploy
#   ./scripts/redeploy.sh web          # Rebuild and redeploy only vault-ai-web
#   ./scripts/redeploy.sh mcp          # Rebuild and redeploy only mcp-proxy
#
# Environment Variables (optional):
#   KIND_CLUSTER_NAME  - Name of Kind cluster (default: vault-kind)
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
KIND_CLUSTER_NAME="${KIND_CLUSTER_NAME:-vault-kind}"
VAULT_AI_NAMESPACE="vault-ai"
VAULT_AI_NODEPORT=30080

# Unique tag per build so Kubernetes always pulls the new image
BUILD_TAG="build-$(date +%Y%m%d-%H%M%S)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'
BOLD='\033[1m'

log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; }
log_step()    { echo -e "\n${MAGENTA}${BOLD}=== $1 ===${NC}\n"; }

# Parse target: "web", "mcp", or default (both)
TARGET="${1:-all}"

# =============================================================================
# Preflight checks
# =============================================================================
log_step "Preflight Checks"

if ! kind get clusters 2>/dev/null | grep -q "^${KIND_CLUSTER_NAME}$"; then
    log_error "Kind cluster '$KIND_CLUSTER_NAME' not found. Run setup-full-environment.sh first."
    exit 1
fi

if ! kubectl get namespace "$VAULT_AI_NAMESPACE" &>/dev/null; then
    log_error "Namespace '$VAULT_AI_NAMESPACE' not found. Run setup-full-environment.sh first."
    exit 1
fi

log_success "Cluster and namespace verified"
log_info "Build tag: ${BUILD_TAG}"

# =============================================================================
# Build images
# =============================================================================
log_step "Building Docker Images"

cd "$PROJECT_DIR"

if [ "$TARGET" = "all" ] || [ "$TARGET" = "web" ]; then
    log_info "Building vault-ai-web:${BUILD_TAG}..."
    docker build -t "vault-ai-web:${BUILD_TAG}" -f Dockerfile .
    log_success "vault-ai-web image built"
fi

if [ "$TARGET" = "all" ] || [ "$TARGET" = "mcp" ]; then
    log_info "Building vault-ai-mcp-proxy:${BUILD_TAG}..."
    docker build -t "vault-ai-mcp-proxy:${BUILD_TAG}" -f mcp-proxy/Dockerfile ./mcp-proxy
    log_success "vault-ai-mcp-proxy image built"
fi

# =============================================================================
# Load images into Kind
# =============================================================================
log_step "Loading Images into Kind"

if [ "$TARGET" = "all" ] || [ "$TARGET" = "web" ]; then
    log_info "Loading vault-ai-web:${BUILD_TAG}..."
    kind load docker-image "vault-ai-web:${BUILD_TAG}" --name "$KIND_CLUSTER_NAME"
    log_success "vault-ai-web loaded"
fi

if [ "$TARGET" = "all" ] || [ "$TARGET" = "mcp" ]; then
    log_info "Loading vault-ai-mcp-proxy:${BUILD_TAG}..."
    kind load docker-image "vault-ai-mcp-proxy:${BUILD_TAG}" --name "$KIND_CLUSTER_NAME"
    log_success "vault-ai-mcp-proxy loaded"
fi

# =============================================================================
# Update deployment images (forces new pods with the new image)
# =============================================================================
log_step "Updating Deployments"

if [ "$TARGET" = "all" ] || [ "$TARGET" = "web" ]; then
    log_info "Setting vault-ai-web image to vault-ai-web:${BUILD_TAG}..."
    kubectl set image deployment/vault-ai-web \
        vault-ai-web="vault-ai-web:${BUILD_TAG}" \
        -n "$VAULT_AI_NAMESPACE"
fi

if [ "$TARGET" = "all" ] || [ "$TARGET" = "mcp" ]; then
    log_info "Setting mcp-proxy image to vault-ai-mcp-proxy:${BUILD_TAG}..."
    kubectl set image deployment/mcp-proxy \
        mcp-proxy="vault-ai-mcp-proxy:${BUILD_TAG}" \
        -n "$VAULT_AI_NAMESPACE"
fi

# =============================================================================
# Wait for rollout
# =============================================================================
log_step "Waiting for Rollout"

if [ "$TARGET" = "all" ] || [ "$TARGET" = "web" ]; then
    kubectl rollout status deployment/vault-ai-web -n "$VAULT_AI_NAMESPACE" --timeout=120s
    log_success "vault-ai-web is ready"
fi

if [ "$TARGET" = "all" ] || [ "$TARGET" = "mcp" ]; then
    kubectl rollout status deployment/mcp-proxy -n "$VAULT_AI_NAMESPACE" --timeout=120s
    log_success "mcp-proxy is ready"
fi

# =============================================================================
# Quick health check
# =============================================================================
log_step "Health Check"

sleep 2
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "http://localhost:${VAULT_AI_NODEPORT}/health" 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    log_success "Vault AI Web is healthy"
else
    log_error "Health check returned HTTP $HTTP_CODE"
    log_info "Check logs: kubectl logs -n $VAULT_AI_NAMESPACE -l app.kubernetes.io/name=vault-ai-web --tail=20"
fi

# =============================================================================
# Done
# =============================================================================
echo ""
echo -e "${CYAN}${BOLD}Redeploy complete!${NC}  ${GREEN}http://localhost:${VAULT_AI_NODEPORT}${NC}"
echo ""
