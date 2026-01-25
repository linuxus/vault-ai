#!/bin/bash

# =============================================================================
# Vault AI Environment Teardown Script
# =============================================================================
# This script tears down the complete Vault AI Kubernetes environment:
#   1. Deletes Vault AI Kubernetes resources
#   2. Optionally deletes Vault resources
#   3. Optionally deletes the Kind cluster
#
# Usage:
#   ./scripts/teardown-environment.sh              # Delete Vault AI only
#   ./scripts/teardown-environment.sh --all        # Delete everything including cluster
#   ./scripts/teardown-environment.sh --vault-ai   # Delete only Vault AI namespace
# =============================================================================

set -e

# Configuration
KIND_CLUSTER_NAME="${KIND_CLUSTER_NAME:-vault-kind}"
VAULT_NAMESPACE="vault-ent"
VAULT_AI_NAMESPACE="vault-ai"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

DELETE_CLUSTER=false
VAULT_AI_ONLY=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --all|-a)
            DELETE_CLUSTER=true
            shift
            ;;
        --vault-ai)
            VAULT_AI_ONLY=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --vault-ai     Delete only Vault AI namespace (keep Vault and cluster)"
            echo "  --all, -a      Delete Kind cluster (includes everything)"
            echo "  --help, -h     Show this help message"
            echo ""
            echo "Default behavior (no flags): Delete Vault AI namespace only"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo -e "${YELLOW}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║          Vault AI Environment Teardown                    ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if cluster exists
if ! kind get clusters 2>/dev/null | grep -q "^${KIND_CLUSTER_NAME}$"; then
    log_warn "Kind cluster '$KIND_CLUSTER_NAME' not found"

    # Also stop any Docker Compose services if running
    log_info "Checking for Docker Compose services..."
    cd "$PROJECT_DIR"
    docker compose down 2>/dev/null || log_warn "No Docker Compose services running"

    log_success "Teardown complete (cluster not found)"
    exit 0
fi

# Set kubectl context
kubectl config use-context "kind-${KIND_CLUSTER_NAME}" 2>/dev/null || true

# Delete Vault AI namespace
if kubectl get namespace "$VAULT_AI_NAMESPACE" &>/dev/null; then
    log_info "Deleting Vault AI namespace '$VAULT_AI_NAMESPACE'..."
    kubectl delete namespace "$VAULT_AI_NAMESPACE" --timeout=60s || {
        log_warn "Timeout deleting namespace, forcing..."
        kubectl delete namespace "$VAULT_AI_NAMESPACE" --force --grace-period=0 2>/dev/null || true
    }
    log_success "Vault AI namespace deleted"
else
    log_warn "Vault AI namespace '$VAULT_AI_NAMESPACE' not found"
fi

# If only deleting Vault AI, stop here
if [ "$VAULT_AI_ONLY" = true ]; then
    log_success "Vault AI teardown complete (Vault and cluster preserved)"
    exit 0
fi

# Delete Kind cluster if requested
if [ "$DELETE_CLUSTER" = true ]; then
    log_info "Deleting Kind cluster '$KIND_CLUSTER_NAME'..."
    kind delete cluster --name "$KIND_CLUSTER_NAME"
    log_success "Kind cluster deleted"
else
    log_warn "Kind cluster preserved. Use --all to delete it."
    echo ""
    echo "Remaining resources:"
    echo "  - Kind cluster: $KIND_CLUSTER_NAME"
    echo "  - Vault namespace: $VAULT_NAMESPACE"
    echo ""
    echo "To fully cleanup:"
    echo "  $0 --all"
fi

# Stop any port-forwards
log_info "Stopping any port-forwards..."
pkill -f "kubectl.*port-forward" 2>/dev/null || true

# Stop any Docker Compose services (legacy)
log_info "Stopping any Docker Compose services..."
cd "$PROJECT_DIR"
docker compose down 2>/dev/null || true

echo ""
log_success "Teardown complete!"
