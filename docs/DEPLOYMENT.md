# Vault AI - Deployment Guide

## Overview

This guide covers deploying Vault AI in a self-hosted/on-premises environment using Docker containers. The deployment architecture consists of two main components:

1. **Vault AI Web** - React SPA served via nginx
2. **Vault MCP Proxy** - Bridge between web UI and Vault MCP server

---

## Prerequisites

### Required

- Docker 24.0+ and Docker Compose 2.20+
- HashiCorp Vault 1.12+ (accessible from deployment host)
- Network access to Vault server (HTTPS recommended)

### Optional

- TLS certificates for HTTPS termination
- Load balancer (for high availability)
- Container orchestrator (Kubernetes, ECS, etc.)

---

## Quick Start

### 1. Clone and Configure

```bash
# Clone the repository
git clone https://github.com/your-org/vault-ai.git
cd vault-ai

# Copy environment template
cp .env.example .env

# Edit configuration
nano .env
```

### 2. Configure Environment

```bash
# .env file
VAULT_ADDR=https://vault.example.com:8200
VAULT_SKIP_VERIFY=false

# Optional: MCP configuration
MCP_PROXY_PORT=3001
MCP_LOG_LEVEL=info

# Optional: Web UI configuration
VITE_APP_TITLE=Vault AI
VITE_VAULT_ADDR=https://vault.example.com:8200
```

### 3. Build and Run

```bash
# Build images
docker compose build

# Start services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

### 4. Access the UI

Open `http://localhost:3000` in your browser.

---

## Docker Configuration

### Dockerfile (Web UI)

```dockerfile
# Dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Configuration

```nginx
# nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    keepalive_timeout 65;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' ${VAULT_ADDR}; frame-ancestors 'none';" always;

    server {
        listen 80;
        server_name _;
        root /usr/share/nginx/html;
        index index.html;

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "OK\n";
            add_header Content-Type text/plain;
        }

        # API proxy to MCP (optional)
        location /api/mcp {
            proxy_pass http://mcp-proxy:3001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # SPA routing - serve index.html for all routes
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Static asset caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  vault-ai-web:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: vault-ai-web
    ports:
      - "3000:80"
    environment:
      - VAULT_ADDR=${VAULT_ADDR}
    depends_on:
      - mcp-proxy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:80/health"]
      interval: 30s
      timeout: 3s
      retries: 3
    networks:
      - vault-ai-network

  mcp-proxy:
    build:
      context: ./mcp-proxy
      dockerfile: Dockerfile
    container_name: vault-ai-mcp-proxy
    environment:
      - VAULT_ADDR=${VAULT_ADDR}
      - VAULT_SKIP_VERIFY=${VAULT_SKIP_VERIFY:-false}
      - MCP_LOG_LEVEL=${MCP_LOG_LEVEL:-info}
      - PORT=3001
    expose:
      - "3001"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3001/health"]
      interval: 30s
      timeout: 3s
      retries: 3
    networks:
      - vault-ai-network

networks:
  vault-ai-network:
    driver: bridge
```

### MCP Proxy Dockerfile

```dockerfile
# mcp-proxy/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copy application
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "server.js"]
```

---

## Environment Configuration

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VAULT_ADDR` | Vault server URL | `https://vault.example.com:8200` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VAULT_SKIP_VERIFY` | Skip TLS verification (dev only) | `false` |
| `VAULT_NAMESPACE` | Enterprise namespace | (none) |
| `MCP_PROXY_PORT` | MCP proxy listen port | `3001` |
| `MCP_LOG_LEVEL` | Logging verbosity | `info` |
| `VITE_APP_TITLE` | Browser tab title | `Vault AI` |
| `SESSION_TIMEOUT` | Idle session timeout (seconds) | `3600` |

### Environment File Template

```bash
# .env.example

# Vault Connection (Required)
VAULT_ADDR=https://vault.example.com:8200
VAULT_SKIP_VERIFY=false
# VAULT_NAMESPACE=admin  # Enterprise only

# MCP Proxy
MCP_PROXY_PORT=3001
MCP_LOG_LEVEL=info

# Web UI Customization
VITE_APP_TITLE=Vault AI
VITE_VAULT_ADDR=https://vault.example.com:8200

# Session Management
SESSION_TIMEOUT=3600

# TLS (if terminating at container)
# TLS_CERT_PATH=/certs/server.crt
# TLS_KEY_PATH=/certs/server.key
```

---

## Vault Connectivity

### Network Requirements

| Source | Destination | Port | Protocol |
|--------|-------------|------|----------|
| vault-ai-web | mcp-proxy | 3001 | HTTP |
| mcp-proxy | Vault server | 8200 | HTTPS |
| Browser | vault-ai-web | 3000 | HTTP(S) |
| Browser | Vault server | 8200 | HTTPS (for direct API calls) |

### Vault Configuration

Ensure your Vault server allows connections from the deployment host:

```hcl
# vault.hcl (Vault server config)
listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = false
  tls_cert_file = "/path/to/cert.pem"
  tls_key_file  = "/path/to/key.pem"
}

# CORS configuration for web UI
api_addr = "https://vault.example.com:8200"
```

### Testing Connectivity

```bash
# Test Vault connectivity from Docker host
curl -s https://vault.example.com:8200/v1/sys/health | jq

# Test from within container
docker exec vault-ai-web wget -qO- https://vault.example.com:8200/v1/sys/health
```

---

## Security Hardening

### Container Security

```yaml
# docker-compose.yml additions for security
services:
  vault-ai-web:
    # ... existing config ...
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp
      - /var/run
      - /var/cache/nginx
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE

  mcp-proxy:
    # ... existing config ...
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp
    cap_drop:
      - ALL
```

### TLS Termination

#### Option 1: Nginx Container (Recommended)

```yaml
# docker-compose.yml with TLS
services:
  vault-ai-web:
    # ... existing config ...
    volumes:
      - ./certs:/etc/nginx/certs:ro
    environment:
      - TLS_CERT=/etc/nginx/certs/server.crt
      - TLS_KEY=/etc/nginx/certs/server.key
```

Updated nginx.conf:
```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /etc/nginx/certs/server.crt;
    ssl_certificate_key /etc/nginx/certs/server.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    # ... rest of config
}

server {
    listen 80;
    return 301 https://$host$request_uri;
}
```

#### Option 2: External Load Balancer

When using an external load balancer (AWS ALB, nginx, HAProxy):

```yaml
# docker-compose.yml - internal only
services:
  vault-ai-web:
    ports:
      - "127.0.0.1:3000:80"  # Bind to localhost only
```

### Network Isolation

```yaml
# docker-compose.yml with network isolation
networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true  # No external access

services:
  vault-ai-web:
    networks:
      - frontend
      - backend

  mcp-proxy:
    networks:
      - backend  # Only accessible from internal network
```

---

## Monitoring

### Health Checks

```bash
# Web UI health
curl http://localhost:3000/health

# MCP Proxy health (internal)
docker exec vault-ai-mcp-proxy wget -qO- http://localhost:3001/health
```

### Logging

```yaml
# docker-compose.yml with logging
services:
  vault-ai-web:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        labels: "service"
    labels:
      service: "vault-ai-web"
```

### Prometheus Metrics (Optional)

```yaml
# docker-compose.yml with metrics
services:
  vault-ai-web:
    # ... existing config ...

  mcp-proxy:
    # ... existing config ...
    environment:
      - METRICS_ENABLED=true
      - METRICS_PORT=9090

  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"
```

---

## Operations

### Starting Services

```bash
# Start all services
docker compose up -d

# Start specific service
docker compose up -d vault-ai-web
```

### Stopping Services

```bash
# Stop all services
docker compose down

# Stop and remove volumes
docker compose down -v
```

### Updating

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker compose build --no-cache
docker compose up -d
```

### Logs

```bash
# All logs
docker compose logs -f

# Specific service
docker compose logs -f vault-ai-web

# Last 100 lines
docker compose logs --tail=100 vault-ai-web
```

### Backup & Restore

Vault AI is stateless - no backup required for the web UI. Ensure your Vault server has proper backup procedures.

---

## Troubleshooting

### Common Issues

#### Cannot connect to Vault

```bash
# Check Vault accessibility
curl -v https://vault.example.com:8200/v1/sys/health

# Check DNS resolution
docker exec vault-ai-web nslookup vault.example.com

# Check certificates
openssl s_client -connect vault.example.com:8200 -showcerts
```

#### Container won't start

```bash
# Check logs
docker compose logs vault-ai-web

# Check container status
docker compose ps -a

# Inspect container
docker inspect vault-ai-web
```

#### MCP connection fails

```bash
# Check MCP proxy logs
docker compose logs mcp-proxy

# Test internal connectivity
docker exec vault-ai-web wget -qO- http://mcp-proxy:3001/health
```

### Debug Mode

```yaml
# docker-compose.override.yml for debugging
services:
  mcp-proxy:
    environment:
      - MCP_LOG_LEVEL=debug
      - NODE_ENV=development
```

---

## Kubernetes Deployment

For Kubernetes environments, use the following manifests:

### Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vault-ai
  labels:
    app: vault-ai
spec:
  replicas: 2
  selector:
    matchLabels:
      app: vault-ai
  template:
    metadata:
      labels:
        app: vault-ai
    spec:
      containers:
        - name: web
          image: vault-ai-web:latest
          ports:
            - containerPort: 80
          env:
            - name: VAULT_ADDR
              valueFrom:
                configMapKeyRef:
                  name: vault-ai-config
                  key: vault_addr
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "256Mi"
              cpu: "200m"
          livenessProbe:
            httpGet:
              path: /health
              port: 80
            initialDelaySeconds: 5
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 80
            initialDelaySeconds: 5
            periodSeconds: 5
```

### Service

```yaml
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: vault-ai
spec:
  selector:
    app: vault-ai
  ports:
    - port: 80
      targetPort: 80
  type: ClusterIP
```

### Ingress

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: vault-ai
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
    - hosts:
        - vault-ai.example.com
      secretName: vault-ai-tls
  rules:
    - host: vault-ai.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: vault-ai
                port:
                  number: 80
```

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-16 | Vault AI Team | Initial deployment guide |
