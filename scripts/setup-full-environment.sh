#!/bin/bash

# =============================================================================
# Vault AI Full Environment Setup Script
# =============================================================================
# This script creates a complete Vault AI development environment in Kubernetes:
#   1. Creates a Kind Kubernetes cluster (3 control-plane, 3 workers)
#   2. Deploys HashiCorp Vault Enterprise (HA with Raft)
#   3. Initializes and unseals Vault
#   4. Builds and deploys Vault AI services to Kubernetes
#   5. Validates all services are healthy
#   6. Runs demo data setup scripts (secrets, policies, users)
#
# Prerequisites:
#   - Docker installed and running
#   - kind CLI installed
#   - kubectl CLI installed
#   - helm CLI installed
#   - Vault CLI installed
#   - Vault Enterprise license file
#
# Usage:
#   chmod +x scripts/setup-full-environment.sh
#   ./scripts/setup-full-environment.sh
#
# Environment Variables (optional):
#   VAULT_LICENSE_PATH  - Path to vault.hclic (default: ~/Dev/Licenses/vault.hclic)
#   KIND_CLUSTER_NAME   - Name of Kind cluster (default: vault-kind)
#   SKIP_DEMO_DATA      - Set to "true" to skip demo data setup
#   ANTHROPIC_API_KEY   - API key for Claude (required for MCP chat features)
# =============================================================================

set -e

# =============================================================================
# Configuration
# =============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
KIND_CLUSTER_NAME="${KIND_CLUSTER_NAME:-vault-kind}"
VAULT_NAMESPACE="vault-ent"
VAULT_AI_NAMESPACE="vault-ai"
VAULT_RELEASE_NAME="vault"
VAULT_LICENSE_PATH="${VAULT_LICENSE_PATH:-$HOME/Library/CloudStorage/OneDrive-IBM/Dev/Licenses/vault.hclic}"
VAULT_INIT_FILE="$PROJECT_DIR/vault-init.json"
KIND_CONFIG_FILE="$PROJECT_DIR/kind-config.yaml"
VAULT_VALUES_FILE="$PROJECT_DIR/vault-values.yaml"
K8S_DIR="$PROJECT_DIR/k8s"

# NodePort for Vault AI Web UI
VAULT_AI_NODEPORT=30080

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# =============================================================================
# Helper Functions
# =============================================================================
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "\n${MAGENTA}${BOLD}=== $1 ===${NC}\n"; }

check_url() {
    local url=$1
    local timeout=${2:-5}
    curl -s -o /dev/null -w "%{http_code}" --connect-timeout $timeout "$url" 2>/dev/null || echo "000"
}

# =============================================================================
# Prerequisite Checks
# =============================================================================
check_prerequisites() {
    log_step "Checking Prerequisites"

    local missing=()

    # Check Docker
    if ! command -v docker &> /dev/null; then
        missing+=("docker")
    elif ! docker info &> /dev/null; then
        log_error "Docker is not running. Please start Docker Desktop."
        exit 1
    fi

    # Check kind
    if ! command -v kind &> /dev/null; then
        missing+=("kind")
    fi

    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        missing+=("kubectl")
    fi

    # Check helm
    if ! command -v helm &> /dev/null; then
        missing+=("helm")
    fi

    # Check vault CLI
    if ! command -v vault &> /dev/null; then
        missing+=("vault")
    fi

    # Check jq
    if ! command -v jq &> /dev/null; then
        missing+=("jq")
    fi

    if [ ${#missing[@]} -gt 0 ]; then
        log_error "Missing required tools: ${missing[*]}"
        log_info "Install with: brew install ${missing[*]}"
        exit 1
    fi

    log_success "All required tools are installed"

    # Check Vault license
    if [ ! -f "$VAULT_LICENSE_PATH" ]; then
        log_error "Vault license not found at: $VAULT_LICENSE_PATH"
        log_info "Set VAULT_LICENSE_PATH environment variable or place license at default location"
        exit 1
    fi
    log_success "Vault license found"

    # Check for Anthropic API key
    if [ -z "$ANTHROPIC_API_KEY" ]; then
        # Try to read from existing mcp-proxy .env
        if [ -f "$PROJECT_DIR/mcp-proxy/.env" ]; then
            ANTHROPIC_API_KEY=$(grep "^ANTHROPIC_API_KEY=" "$PROJECT_DIR/mcp-proxy/.env" | cut -d'=' -f2- || echo "")
        fi
    fi

    if [ -z "$ANTHROPIC_API_KEY" ] || [ "$ANTHROPIC_API_KEY" = "placeholder" ]; then
        log_warn "ANTHROPIC_API_KEY not set. MCP chat features will not work."
        log_info "Set ANTHROPIC_API_KEY environment variable or add it to mcp-proxy/.env"
    else
        log_success "Anthropic API key found"
    fi
}

# =============================================================================
# Create Configuration Files
# =============================================================================
create_config_files() {
    log_step "Creating Configuration Files"

    # Create Kind cluster config with NodePort mapping
    cat > "$KIND_CONFIG_FILE" << EOF
# Kind cluster with HA control-plane and NodePort exposure
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  extraPortMappings:
  - containerPort: ${VAULT_AI_NODEPORT}
    hostPort: ${VAULT_AI_NODEPORT}
    protocol: TCP
- role: control-plane
- role: control-plane
- role: worker
- role: worker
- role: worker
EOF
    log_success "Created Kind config: $KIND_CONFIG_FILE"

    # Create Vault Helm values
    cat > "$VAULT_VALUES_FILE" << 'EOF'
# Vault Enterprise HA configuration with Raft storage
global:
  namespace: vault-ent

server:
  image:
    repository: hashicorp/vault-enterprise
    tag: 1.20.4-ent
  enterpriseLicense:
    secretName: vault-ent-license
    secretKey: vault.hclic
  ha:
    enabled: true
    replicas: 3
    raft:
      enabled: true
      setNodeId: true
      config: |
        ui = true
        listener "tcp" {
          address     = "0.0.0.0:8200"
          tls_disable = 1
        }
        storage "raft" {
          path = "/vault/data"
        }
        service_registration "kubernetes" {}

        api_addr     = "http://vault.vault-ent.svc.cluster.local:8200"
        cluster_addr = "http://$(HOSTNAME).vault-internal:8201"

injector:
  enabled: true
EOF
    log_success "Created Vault values: $VAULT_VALUES_FILE"
}

# =============================================================================
# Kind Cluster Setup
# =============================================================================
setup_kind_cluster() {
    log_step "Setting Up Kind Cluster"

    # Check if cluster already exists
    if kind get clusters 2>/dev/null | grep -q "^${KIND_CLUSTER_NAME}$"; then
        log_warn "Kind cluster '$KIND_CLUSTER_NAME' already exists"
        read -p "Delete and recreate? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_info "Deleting existing cluster..."
            kind delete cluster --name "$KIND_CLUSTER_NAME"
        else
            log_info "Using existing cluster"
            kubectl cluster-info --context "kind-${KIND_CLUSTER_NAME}" &>/dev/null || {
                log_error "Cannot connect to existing cluster"
                exit 1
            }
            return 0
        fi
    fi

    log_info "Creating Kind cluster '$KIND_CLUSTER_NAME'..."
    kind create cluster --name "$KIND_CLUSTER_NAME" --config "$KIND_CONFIG_FILE"

    log_info "Waiting for cluster to be ready..."
    kubectl wait --for=condition=Ready nodes --all --timeout=120s

    log_success "Kind cluster is ready"
}

# =============================================================================
# Vault Deployment
# =============================================================================
deploy_vault() {
    log_step "Deploying Vault Enterprise"

    # Create namespace
    log_info "Creating namespace '$VAULT_NAMESPACE'..."
    kubectl create namespace "$VAULT_NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

    # Create license secret
    log_info "Creating Vault license secret..."
    kubectl create secret generic vault-ent-license \
        --namespace "$VAULT_NAMESPACE" \
        --from-file=vault.hclic="$VAULT_LICENSE_PATH" \
        --dry-run=client -o yaml | kubectl apply -f -

    # Add HashiCorp Helm repo
    log_info "Adding HashiCorp Helm repository..."
    helm repo add hashicorp https://helm.releases.hashicorp.com 2>/dev/null || true
    helm repo update

    # Install/Upgrade Vault (don't use --wait since pods won't be ready until unsealed)
    log_info "Installing Vault via Helm..."
    helm upgrade --install "$VAULT_RELEASE_NAME" hashicorp/vault \
        --namespace "$VAULT_NAMESPACE" \
        --values "$VAULT_VALUES_FILE" \
        --timeout 5m

    log_info "Waiting for Vault pods to be scheduled..."
    sleep 5

    # Wait for all vault pods to be Running (not Ready - they won't be ready until unsealed)
    log_info "Waiting for Vault pods to be in Running state..."
    for i in 0 1 2; do
        local pod="vault-$i"
        local retries=60
        while [ $retries -gt 0 ]; do
            local phase=$(kubectl get pod "$pod" -n "$VAULT_NAMESPACE" -o jsonpath='{.status.phase}' 2>/dev/null || echo "Pending")
            if [ "$phase" = "Running" ]; then
                log_success "$pod is Running"
                break
            fi
            printf "."
            sleep 2
            retries=$((retries - 1))
        done
        if [ $retries -eq 0 ]; then
            log_error "Timeout waiting for $pod to be Running"
            kubectl describe pod "$pod" -n "$VAULT_NAMESPACE"
            exit 1
        fi
    done

    log_success "All Vault pods are Running"
}

# =============================================================================
# Vault Initialization and Unsealing
# =============================================================================
initialize_vault() {
    log_step "Initializing and Unsealing Vault"

    # Give pods a moment to fully start their containers
    sleep 5

    # Check if already initialized
    local init_status=$(kubectl exec -n "$VAULT_NAMESPACE" vault-0 -- vault status -format=json 2>/dev/null | jq -r '.initialized' || echo "false")

    if [ "$init_status" = "true" ]; then
        log_warn "Vault is already initialized"

        # Check if we have init file
        if [ -f "$VAULT_INIT_FILE" ]; then
            log_info "Using existing initialization data from $VAULT_INIT_FILE"
        else
            log_error "Vault is initialized but no init file found at $VAULT_INIT_FILE"
            log_info "Please provide the unseal key and root token manually"
            exit 1
        fi
    else
        log_info "Initializing Vault on vault-0..."
        kubectl exec -n "$VAULT_NAMESPACE" vault-0 -- \
            vault operator init -key-shares=1 -key-threshold=1 -format=json > "$VAULT_INIT_FILE"
        log_success "Vault initialized. Keys saved to $VAULT_INIT_FILE"
    fi

    # Extract keys
    local UNSEAL_KEY=$(jq -r '.unseal_keys_b64[0]' "$VAULT_INIT_FILE")
    local ROOT_TOKEN=$(jq -r '.root_token' "$VAULT_INIT_FILE")

    # Step 1: Unseal vault-0 first (it's the leader)
    log_info "Unsealing vault-0 (Raft leader)..."
    local sealed=$(kubectl exec -n "$VAULT_NAMESPACE" vault-0 -- vault status -format=json 2>/dev/null | jq -r '.sealed' || echo "true")
    if [ "$sealed" = "true" ]; then
        kubectl exec -n "$VAULT_NAMESPACE" vault-0 -- vault operator unseal "$UNSEAL_KEY"
        log_success "vault-0 unsealed"
    else
        log_info "vault-0 is already unsealed"
    fi

    # Wait for vault-0 to be fully ready
    log_info "Waiting for vault-0 to be ready..."
    kubectl wait --for=condition=Ready pod/vault-0 \
        --namespace "$VAULT_NAMESPACE" \
        --timeout=60s

    # Step 2: Join vault-1 and vault-2 to Raft cluster and unseal them
    for i in 1 2; do
        local pod="vault-$i"

        # Check if already part of cluster (already initialized)
        local peer_init=$(kubectl exec -n "$VAULT_NAMESPACE" $pod -- vault status -format=json 2>/dev/null | jq -r '.initialized' || echo "false")

        if [ "$peer_init" = "false" ]; then
            log_info "Joining $pod to Raft cluster..."
            kubectl exec -n "$VAULT_NAMESPACE" $pod -- \
                vault operator raft join http://vault-0.vault-internal:8200
            log_success "$pod joined Raft cluster"
        else
            log_info "$pod is already part of the cluster"
        fi

        # Unseal the peer
        local sealed=$(kubectl exec -n "$VAULT_NAMESPACE" $pod -- vault status -format=json 2>/dev/null | jq -r '.sealed' || echo "true")
        if [ "$sealed" = "true" ]; then
            log_info "Unsealing $pod..."
            kubectl exec -n "$VAULT_NAMESPACE" $pod -- vault operator unseal "$UNSEAL_KEY"
            log_success "$pod unsealed"
        else
            log_info "$pod is already unsealed"
        fi

        # Wait for pod to be ready
        log_info "Waiting for $pod to be ready..."
        kubectl wait --for=condition=Ready pod/$pod \
            --namespace "$VAULT_NAMESPACE" \
            --timeout=60s || log_warn "$pod readiness wait timed out"
    done

    # Verify cluster status
    log_info "Verifying Raft cluster status..."
    kubectl exec -n "$VAULT_NAMESPACE" vault-0 -- vault operator raft list-peers -format=json 2>/dev/null | jq -r '.data.config.servers[] | "\(.node_id): \(.leader)"' || true

    log_success "Vault cluster is initialized and unsealed"

    # Export for later use
    export VAULT_TOKEN="$ROOT_TOKEN"
    echo ""
    log_info "Root Token: $ROOT_TOKEN"
}

# =============================================================================
# Build and Load Vault AI Images
# =============================================================================
build_vault_ai_images() {
    log_step "Building Vault AI Docker Images"

    cd "$PROJECT_DIR"

    # Build vault-ai-web image
    log_info "Building vault-ai-web image..."
    docker build -t vault-ai-web:latest -f Dockerfile .

    # Build mcp-proxy image
    log_info "Building vault-ai-mcp-proxy image..."
    docker build -t vault-ai-mcp-proxy:latest -f mcp-proxy/Dockerfile ./mcp-proxy

    log_success "Docker images built"

    # Load images into Kind cluster
    log_step "Loading Images into Kind Cluster"

    log_info "Loading vault-ai-web image..."
    kind load docker-image vault-ai-web:latest --name "$KIND_CLUSTER_NAME"

    log_info "Loading vault-ai-mcp-proxy image..."
    kind load docker-image vault-ai-mcp-proxy:latest --name "$KIND_CLUSTER_NAME"

    log_success "Images loaded into Kind cluster"
}

# =============================================================================
# Deploy Vault AI to Kubernetes
# =============================================================================
deploy_vault_ai() {
    log_step "Deploying Vault AI to Kubernetes"

    cd "$PROJECT_DIR"

    # Create namespace
    log_info "Creating namespace '$VAULT_AI_NAMESPACE'..."
    kubectl apply -f "$K8S_DIR/namespace.yaml"

    # Update the MCP proxy secret with Anthropic API key
    if [ -n "$ANTHROPIC_API_KEY" ] && [ "$ANTHROPIC_API_KEY" != "placeholder" ]; then
        log_info "Updating Anthropic API key secret..."
        kubectl create secret generic mcp-proxy-secrets \
            --namespace "$VAULT_AI_NAMESPACE" \
            --from-literal=ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" \
            --dry-run=client -o yaml | kubectl apply -f -
    fi

    # Apply all Kubernetes manifests
    log_info "Applying Kubernetes manifests..."
    kubectl apply -f "$K8S_DIR/configmap.yaml"
    kubectl apply -f "$K8S_DIR/deployment.yaml"
    kubectl apply -f "$K8S_DIR/service.yaml"

    # Wait for deployments to be ready
    log_info "Waiting for Vault AI deployments to be ready..."
    kubectl rollout status deployment/vault-ai-web -n "$VAULT_AI_NAMESPACE" --timeout=120s
    kubectl rollout status deployment/mcp-proxy -n "$VAULT_AI_NAMESPACE" --timeout=120s

    log_success "Vault AI deployed to Kubernetes"
}

# =============================================================================
# Health Validation
# =============================================================================
validate_health() {
    log_step "Validating All Services"

    local all_healthy=true

    # Check Vault pods
    log_info "Checking Vault pods..."
    local vault_ready=$(kubectl get pods -n "$VAULT_NAMESPACE" -l app.kubernetes.io/name=vault --no-headers 2>/dev/null | grep -c "Running" || echo "0")
    if [ "$vault_ready" -ge 3 ]; then
        log_success "Vault Pods: $vault_ready/3 Running"
    else
        log_error "Vault Pods: $vault_ready/3 Running"
        all_healthy=false
    fi

    # Check Vault AI pods
    log_info "Checking Vault AI pods..."
    local web_ready=$(kubectl get pods -n "$VAULT_AI_NAMESPACE" -l app.kubernetes.io/name=vault-ai-web --no-headers 2>/dev/null | grep -c "Running" || echo "0")
    local mcp_ready=$(kubectl get pods -n "$VAULT_AI_NAMESPACE" -l app.kubernetes.io/name=mcp-proxy --no-headers 2>/dev/null | grep -c "Running" || echo "0")

    if [ "$web_ready" -ge 1 ]; then
        log_success "Vault AI Web: Running"
    else
        log_error "Vault AI Web: Not Running"
        all_healthy=false
    fi

    if [ "$mcp_ready" -ge 1 ]; then
        log_success "MCP Proxy: Running"
    else
        log_error "MCP Proxy: Not Running"
        all_healthy=false
    fi

    # Check Vault AI Web via NodePort
    log_info "Checking Vault AI Web health endpoint..."
    sleep 3  # Give time for services to be ready
    local web_health=$(check_url "http://localhost:${VAULT_AI_NODEPORT}/health")
    if [ "$web_health" = "200" ]; then
        log_success "Vault AI Web: Healthy (NodePort ${VAULT_AI_NODEPORT})"
    else
        log_error "Vault AI Web: Unhealthy (HTTP $web_health)"
        all_healthy=false
    fi

    # Check Vault API through Vault AI proxy
    log_info "Checking Vault API proxy..."
    local vault_health=$(check_url "http://localhost:${VAULT_AI_NODEPORT}/v1/sys/health")
    if [ "$vault_health" = "200" ] || [ "$vault_health" = "429" ]; then
        log_success "Vault API Proxy: Working"
    else
        log_error "Vault API Proxy: Failed (HTTP $vault_health)"
        all_healthy=false
    fi

    echo ""
    if [ "$all_healthy" = true ]; then
        log_success "All services are healthy!"
    else
        log_error "Some services are unhealthy. Check logs for details."
        log_info "View Vault AI logs: kubectl logs -n vault-ai -l app.kubernetes.io/part-of=vault-ai"
        return 1
    fi
}

# =============================================================================
# Demo Data Setup
# =============================================================================
setup_demo_data() {
    if [ "${SKIP_DEMO_DATA:-false}" = "true" ]; then
        log_warn "Skipping demo data setup (SKIP_DEMO_DATA=true)"
        return 0
    fi

    log_step "Setting Up Demo Data"

    # Get root token
    local ROOT_TOKEN=$(jq -r '.root_token' "$VAULT_INIT_FILE")

    # Port-forward to Vault for setup scripts
    log_info "Starting port-forward to Vault..."
    kubectl port-forward -n "$VAULT_NAMESPACE" svc/vault 8200:8200 &>/dev/null &
    local PF_PID=$!
    sleep 3

    export VAULT_ADDR="http://localhost:8200"
    export VAULT_TOKEN="$ROOT_TOKEN"

    # Run enterprise secrets setup
    if [ -f "$SCRIPT_DIR/setup-enterprise-secrets.sh" ]; then
        log_info "Running enterprise secrets setup..."
        chmod +x "$SCRIPT_DIR/setup-enterprise-secrets.sh"
        "$SCRIPT_DIR/setup-enterprise-secrets.sh"
    else
        log_warn "Enterprise secrets script not found"
    fi

    # Run demo users setup
    if [ -f "$SCRIPT_DIR/setup-demo-users.sh" ]; then
        log_info "Running demo users setup..."
        chmod +x "$SCRIPT_DIR/setup-demo-users.sh"
        "$SCRIPT_DIR/setup-demo-users.sh"
    else
        log_warn "Demo users script not found"
    fi

    # Stop port-forward
    kill $PF_PID 2>/dev/null || true

    log_success "Demo data setup complete"
}

# =============================================================================
# Summary
# =============================================================================
print_summary() {
    local ROOT_TOKEN=$(jq -r '.root_token' "$VAULT_INIT_FILE" 2>/dev/null || echo "unknown")

    echo ""
    echo -e "${CYAN}${BOLD}============================================================${NC}"
    echo -e "${CYAN}${BOLD}           Vault AI Environment Ready!                      ${NC}"
    echo -e "${CYAN}${BOLD}============================================================${NC}"
    echo ""
    echo -e "${BOLD}Services:${NC}"
    echo -e "  Vault AI UI:     ${GREEN}http://localhost:${VAULT_AI_NODEPORT}${NC}"
    echo ""
    echo -e "${BOLD}Authentication:${NC}"
    echo -e "  Root Token:      ${YELLOW}$ROOT_TOKEN${NC}"
    echo ""
    echo -e "${BOLD}Kubernetes:${NC}"
    echo -e "  Cluster:         ${GREEN}kind-${KIND_CLUSTER_NAME}${NC}"
    echo -e "  Vault Namespace: ${GREEN}${VAULT_NAMESPACE}${NC}"
    echo -e "  Vault AI NS:     ${GREEN}${VAULT_AI_NAMESPACE}${NC}"
    echo ""
    echo -e "${BOLD}Demo Users:${NC}"
    echo -e "  api-developer    / demo-password-123"
    echo -e "  dba-admin        / demo-password-123"
    echo -e "  security-analyst / demo-password-123"
    echo -e "  devops-engineer  / demo-password-123"
    echo -e "  platform-engineer/ demo-password-123"
    echo ""
    echo -e "${BOLD}Files:${NC}"
    echo -e "  Init Data:       ${BLUE}$VAULT_INIT_FILE${NC}"
    echo -e "  Demo Tokens:     ${BLUE}$SCRIPT_DIR/demo-tokens.env${NC}"
    echo ""
    echo -e "${BOLD}Commands:${NC}"
    echo -e "  View Vault pods:    kubectl get pods -n $VAULT_NAMESPACE"
    echo -e "  View Vault AI pods: kubectl get pods -n $VAULT_AI_NAMESPACE"
    echo -e "  View Vault AI logs: kubectl logs -n $VAULT_AI_NAMESPACE -l app.kubernetes.io/part-of=vault-ai"
    echo -e "  Port-forward Vault: kubectl port-forward -n $VAULT_NAMESPACE svc/vault 8200:8200"
    echo -e "  Delete cluster:     kind delete cluster --name $KIND_CLUSTER_NAME"
    echo ""
    echo -e "${CYAN}${BOLD}============================================================${NC}"
}

# =============================================================================
# Cleanup Handler
# =============================================================================
cleanup() {
    log_warn "Caught interrupt signal. Cleaning up..."
    # Kill port-forward if running
    pkill -f "kubectl.*port-forward.*vault.*8200" 2>/dev/null || true
    exit 1
}

trap cleanup INT TERM

# =============================================================================
# Main
# =============================================================================
main() {
    echo -e "${CYAN}${BOLD}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║     Vault AI Full Environment Setup (Kubernetes)          ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    check_prerequisites
    create_config_files
    setup_kind_cluster
    deploy_vault
    initialize_vault
    build_vault_ai_images
    deploy_vault_ai
    validate_health
    setup_demo_data
    print_summary
}

main "$@"
