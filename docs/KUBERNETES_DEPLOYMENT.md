# Vault AI Kubernetes Deployment Guide

This guide covers deploying Vault AI to Kubernetes, including a local Kind cluster setup for development.

## Table of Contents

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Architecture](#architecture)
- [Automated Setup](#automated-setup)
- [Manual Deployment](#manual-deployment)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Teardown](#teardown)

## Quick Start

For a fully automated setup with Kind, Vault Enterprise, and Vault AI:

```bash
# Set your Anthropic API key (required for MCP chat features)
export ANTHROPIC_API_KEY="your-api-key"

# Run the setup script
./scripts/setup-full-environment.sh
```

Access Vault AI at: **http://localhost:30080**

## Prerequisites

### Required Tools

| Tool | Version | Installation |
|------|---------|--------------|
| Docker | 20.10+ | [docker.com](https://docker.com) |
| kind | 0.20+ | `brew install kind` |
| kubectl | 1.28+ | `brew install kubectl` |
| helm | 3.12+ | `brew install helm` |
| vault | 1.15+ | `brew install vault` |
| jq | 1.6+ | `brew install jq` |

### Vault Enterprise License

A Vault Enterprise license file is required. Set the path via environment variable:

```bash
export VAULT_LICENSE_PATH="/path/to/vault.hclic"
```

### Anthropic API Key

For MCP chat features, set your Anthropic API key:

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

Or add it to `mcp-proxy/.env`:

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

## Architecture

### Kubernetes Namespaces

| Namespace | Purpose |
|-----------|---------|
| `vault-ent` | HashiCorp Vault Enterprise (HA with Raft) |
| `vault-ai` | Vault AI Web UI and MCP Proxy |

### Network Topology

```
┌────────────────────────────────────────────────────────────────-─┐
│                        Kind Cluster                              │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │                    vault-ai namespace                   │     │
│  │                                                         │     │
│  │  ┌─────────────────┐      ┌─────────────────┐           │     │
│  │  │  vault-ai-web   │      │   mcp-proxy     │           │     │
│  │  │  (nginx + SPA)  │─────▶│  (Node.js)      │           │     │
│  │  │                 │      │                 │           │     │
│  │  └────────┬────────┘      └────────┬────────┘           │     │
│  │           │                        │                    │     │
│  └───────────┼────────────────────────┼────────────────────┘     │
│              │                        │                          │
│              │    K8s Service DNS     │                          │
│              ▼                        ▼                          │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │                   vault-ent namespace                   │     │
│  │                                                         │     │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐                  │     │
│  │  │ vault-0 │  │ vault-1 │  │ vault-2 │  (Raft HA)       │     │
│  │  └─────────┘  └─────────┘  └─────────┘                  │     │
│  │                                                         │     │
│  └─────────────────────────────────────────────────────────┘     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
         │
         │ NodePort :30080
         ▼
    ┌─────────┐
    │ Browser │  http://localhost:30080
    └─────────┘
```

### Services

| Service | Type | Port | Description |
|---------|------|------|-------------|
| `vault-ai-web` | NodePort | 30080 | Web UI (nginx serving React SPA) |
| `mcp-proxy` | ClusterIP | 3001 | MCP proxy for AI chat |
| `vault-active` | ClusterIP | 8200 | Vault API (active node only) |

## Automated Setup

### Full Environment Setup

```bash
./scripts/setup-full-environment.sh
```

This script:
1. Creates a Kind cluster (3 control-plane, 3 worker nodes)
2. Deploys Vault Enterprise with HA Raft storage
3. Initializes and unseals Vault
4. Builds and loads Vault AI Docker images
5. Deploys Vault AI to Kubernetes
6. Creates demo secrets, policies, and users

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `KIND_CLUSTER_NAME` | `vault-kind` | Name of the Kind cluster |
| `VAULT_LICENSE_PATH` | (required) | Path to Vault Enterprise license file |
| `ANTHROPIC_API_KEY` | (from mcp-proxy/.env) | API key for Claude |
| `SKIP_DEMO_DATA` | `false` | Skip demo data setup |

### Example with Custom Settings

```bash
export KIND_CLUSTER_NAME="my-vault-cluster"
export VAULT_LICENSE_PATH="/path/to/vault.hclic"
export ANTHROPIC_API_KEY="sk-ant-..."

./scripts/setup-full-environment.sh
```

## Manual Deployment

### 1. Build Docker Images

```bash
# Build web UI image
docker build -t vault-ai-web:latest -f Dockerfile .

# Build MCP proxy image
docker build -t vault-ai-mcp-proxy:latest -f mcp-proxy/Dockerfile ./mcp-proxy
```

### 2. Load Images into Kind

```bash
kind load docker-image vault-ai-web:latest --name vault-kind
kind load docker-image vault-ai-mcp-proxy:latest --name vault-kind
```

### 3. Create Namespace

```bash
kubectl apply -f k8s/namespace.yaml
```

### 4. Configure Secrets

```bash
# Create MCP proxy secrets with your Anthropic API key
kubectl create secret generic mcp-proxy-secrets \
  --namespace vault-ai \
  --from-literal=ANTHROPIC_API_KEY="your-api-key"
```

### 5. Apply Manifests

```bash
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

Or using Kustomize:

```bash
kubectl apply -k k8s/
```

### 6. Verify Deployment

```bash
# Check pods
kubectl get pods -n vault-ai

# Check services
kubectl get svc -n vault-ai

# Test health endpoint
curl http://localhost:30080/health
```

## Configuration

### Kubernetes Manifests

| File | Description |
|------|-------------|
| `k8s/namespace.yaml` | Namespace definition |
| `k8s/configmap.yaml` | nginx config, MCP proxy config, secrets |
| `k8s/deployment.yaml` | Deployments for web and MCP proxy |
| `k8s/service.yaml` | Services (NodePort and ClusterIP) |
| `k8s/kustomization.yaml` | Kustomize configuration |

### Nginx Configuration

The nginx configuration is stored in a ConfigMap and mounted into the vault-ai-web pod. Key features:

- Proxies `/v1/*` to Vault at `vault-active.vault-ent.svc.cluster.local:8200`
- Proxies `/api/mcp/*` to MCP proxy at `mcp-proxy.vault-ai.svc.cluster.local:3001`
- Serves the React SPA with proper routing

### MCP Proxy Configuration

Environment variables for MCP proxy:

| Variable | Value | Description |
|----------|-------|-------------|
| `VAULT_ADDR` | `http://vault-active.vault-ent.svc.cluster.local:8200` | Vault active node DNS |
| `PORT` | `3001` | Proxy port |
| `FRONTEND_ORIGIN` | `http://localhost:30080` | CORS origin |
| `ANTHROPIC_API_KEY` | (from secret) | Claude API key |

### Modifying NodePort

To change the NodePort (default: 30080), update:

1. `k8s/service.yaml` - Change `nodePort` value
2. `kind-config.yaml` - Update `extraPortMappings`
3. `k8s/configmap.yaml` - Update `FRONTEND_ORIGIN`

Then recreate the Kind cluster and redeploy.

## Troubleshooting

### View Logs

```bash
# All Vault AI logs
kubectl logs -n vault-ai -l app.kubernetes.io/part-of=vault-ai

# Web UI logs
kubectl logs -n vault-ai -l app.kubernetes.io/name=vault-ai-web

# MCP Proxy logs
kubectl logs -n vault-ai -l app.kubernetes.io/name=mcp-proxy

# Vault logs
kubectl logs -n vault-ent -l app.kubernetes.io/name=vault
```

### Common Issues

#### Pods not starting

```bash
# Check pod status
kubectl describe pod -n vault-ai <pod-name>

# Check events
kubectl get events -n vault-ai --sort-by='.lastTimestamp'
```

#### Image pull errors

Ensure images are loaded into Kind:

```bash
kind load docker-image vault-ai-web:latest --name vault-kind
kind load docker-image vault-ai-mcp-proxy:latest --name vault-kind
```

#### Cannot access UI on NodePort

Verify Kind cluster was created with port mapping:

```bash
docker port vault-kind-control-plane
```

If port 30080 is not mapped, recreate the cluster with the correct config.

#### Vault connection issues

Test Vault connectivity from within the cluster:

```bash
kubectl run test --rm -it --image=curlimages/curl -- \
  curl -s http://vault.vault-ent.svc.cluster.local:8200/v1/sys/health
```

### Port Forwarding (Alternative Access)

If NodePort isn't working, use port-forwarding:

```bash
# Vault AI Web
kubectl port-forward -n vault-ai svc/vault-ai-web 3000:80

# Vault (for CLI access)
kubectl port-forward -n vault-ent svc/vault 8200:8200
```

## Teardown

### Delete Vault AI Only

```bash
./scripts/teardown-environment.sh --vault-ai
```

### Delete Everything (Including Cluster)

```bash
./scripts/teardown-environment.sh --all
```

### Manual Cleanup

```bash
# Delete Vault AI namespace
kubectl delete namespace vault-ai

# Delete Vault namespace
kubectl delete namespace vault-ent

# Delete Kind cluster
kind delete cluster --name vault-kind
```

## Production Considerations

For production deployments, consider:

1. **TLS/HTTPS**: Configure TLS termination via Ingress or service mesh
2. **Persistent Storage**: Use PersistentVolumeClaims for Vault data
3. **Resource Limits**: Adjust CPU/memory limits based on load
4. **High Availability**: Scale Vault AI deployments for redundancy
5. **Secrets Management**: Use external secrets operator or Vault itself
6. **Network Policies**: Restrict pod-to-pod communication
7. **RBAC**: Configure Kubernetes RBAC for least privilege
8. **Monitoring**: Deploy Prometheus/Grafana for observability
