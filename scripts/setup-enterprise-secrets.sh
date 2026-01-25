#!/bin/bash

# =============================================================================
# Enterprise Vault KV v2 Secrets Setup Script
# =============================================================================
# This script creates a realistic enterprise secrets structure for testing
# Vault AI's management and operations capabilities.
#
# Prerequisites:
#   - Vault CLI installed and in PATH
#   - VAULT_ADDR environment variable set
#   - VAULT_TOKEN environment variable set (with admin privileges)
#
# Usage:
#   chmod +x scripts/setup-enterprise-secrets.sh
#   ./scripts/setup-enterprise-secrets.sh
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    if ! command -v vault &> /dev/null; then
        log_error "Vault CLI not found. Please install it first."
        exit 1
    fi

    if [ -z "$VAULT_ADDR" ]; then
        log_error "VAULT_ADDR environment variable not set."
        exit 1
    fi

    if [ -z "$VAULT_TOKEN" ]; then
        log_error "VAULT_TOKEN environment variable not set."
        exit 1
    fi

    # Test connection
    if ! vault status &> /dev/null; then
        log_error "Cannot connect to Vault at $VAULT_ADDR"
        exit 1
    fi

    log_success "Prerequisites check passed. Connected to Vault at $VAULT_ADDR"
}

# Enable KV v2 secrets engine at a path
enable_kv_engine() {
    local path=$1
    local description=$2

    if vault secrets list | grep -q "^${path}/"; then
        log_warn "Secrets engine already enabled at ${path}/, skipping..."
    else
        vault secrets enable -path="${path}" -description="${description}" kv-v2
        log_success "Enabled KV v2 at ${path}/"
        # Wait for KV v2 engine to finish upgrading to versioned data
        sleep 2
    fi
}

# Write a secret (handles JSON properly)
write_secret() {
    local path=$1
    shift
    vault kv put "$path" "$@"
}

# =============================================================================
# MOUNT 1: applications - Application-specific secrets by environment
# =============================================================================
setup_applications_mount() {
    log_info "Setting up 'applications' mount..."
    enable_kv_engine "applications" "Application secrets organized by service and environment"

    # --- User Service ---
    log_info "  Creating user-service secrets..."

    # Development
    write_secret applications/user-service/dev/database \
        host="dev-postgres.internal:5432" \
        database="users_dev" \
        username="user_svc_dev" \
        password="dev-password-123" \
        ssl_mode="disable" \
        max_connections="10"

    write_secret applications/user-service/dev/redis \
        host="dev-redis.internal:6379" \
        password="redis-dev-pass" \
        database="0"

    write_secret applications/user-service/dev/jwt \
        secret="dev-jwt-secret-key-not-for-production" \
        expiry="24h" \
        issuer="user-service-dev"

    # Staging
    write_secret applications/user-service/staging/database \
        host="staging-postgres.internal:5432" \
        database="users_staging" \
        username="user_svc_staging" \
        password="St@g1ng-Secur3-P@ss!" \
        ssl_mode="require" \
        max_connections="25"

    write_secret applications/user-service/staging/redis \
        host="staging-redis.internal:6379" \
        password="r3d1s-st@g1ng-s3cr3t" \
        database="0" \
        cluster_mode="true"

    # Production
    write_secret applications/user-service/prod/database \
        host="prod-postgres-primary.internal:5432" \
        database="users_prod" \
        username="user_svc_prod" \
        password="Pr0d-Sup3r-S3cur3-P@ssw0rd-2024!" \
        ssl_mode="verify-full" \
        ssl_cert_path="/etc/ssl/postgres/client-cert.pem" \
        max_connections="100" \
        read_replica="prod-postgres-replica.internal:5432"

    write_secret applications/user-service/prod/redis \
        host="prod-redis-cluster.internal:6379" \
        password="Pr0d-R3d1s-Cl@st3r-K3y!" \
        database="0" \
        cluster_mode="true" \
        sentinel_master="mymaster"

    write_secret applications/user-service/prod/jwt \
        secret="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9-PROD-SIGNING-KEY" \
        expiry="1h" \
        issuer="user-service-prod" \
        refresh_expiry="7d"

    # --- Payment Service ---
    log_info "  Creating payment-service secrets..."

    write_secret applications/payment-service/dev/stripe \
        api_key="sk_test_51ABC123DEF456" \
        webhook_secret="whsec_test_abc123" \
        publishable_key="pk_test_51ABC123DEF456"

    write_secret applications/payment-service/prod/stripe \
        api_key="sk_live_51XYZ789GHI012" \
        webhook_secret="whsec_live_xyz789" \
        publishable_key="pk_live_51XYZ789GHI012"

    write_secret applications/payment-service/prod/database \
        host="prod-payments-db.internal:5432" \
        database="payments" \
        username="payment_svc" \
        password="P@ym3nts-Pr0d-DB-2024!" \
        ssl_mode="verify-full" \
        encryption_key="aes256-payments-encryption-key-prod"

    # --- API Gateway ---
    log_info "  Creating api-gateway secrets..."

    write_secret applications/api-gateway/prod/rate-limiting \
        redis_host="prod-ratelimit-redis.internal:6379" \
        redis_password="R@t3L1m1t-R3d1s-Pr0d" \
        default_limit="1000" \
        window_seconds="60"

    write_secret applications/api-gateway/prod/oauth \
        client_id="api-gateway-oauth-client" \
        client_secret="0Auth-Cl13nt-S3cr3t-Pr0d!" \
        token_endpoint="https://auth.company.com/oauth/token" \
        jwks_uri="https://auth.company.com/.well-known/jwks.json"

    # --- Notification Service ---
    log_info "  Creating notification-service secrets..."

    write_secret applications/notification-service/prod/smtp \
        host="smtp.sendgrid.net" \
        port="587" \
        username="apikey" \
        password="SG.xxxxxxxxxxxxxxxxxxxx" \
        from_address="noreply@company.com"

    write_secret applications/notification-service/prod/twilio \
        account_sid="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
        auth_token="your-twilio-auth-token-here" \
        from_number="+15551234567"

    write_secret applications/notification-service/prod/firebase \
        project_id="company-notifications" \
        server_key="AAAAxxxxxxxxx:APA91bxxxxxxxxxxxxxxxxx" \
        sender_id="123456789012"

    log_success "Applications mount setup complete"
}

# =============================================================================
# MOUNT 2: infrastructure - Infrastructure and platform secrets
# =============================================================================
setup_infrastructure_mount() {
    log_info "Setting up 'infrastructure' mount..."
    enable_kv_engine "infrastructure" "Infrastructure, cloud, and platform secrets"

    # --- AWS Credentials ---
    log_info "  Creating AWS credentials..."

    write_secret infrastructure/aws/dev \
        access_key_id="AKIAIOSFODNN7EXAMPLE" \
        secret_access_key="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" \
        region="us-west-2" \
        account_id="123456789012"

    write_secret infrastructure/aws/prod \
        access_key_id="AKIAI44QH8DHBEXAMPLE" \
        secret_access_key="je7MtGbClwBF/2Zp9Utk/h3yCo8nvbEXAMPLEKEY" \
        region="us-east-1" \
        account_id="987654321098" \
        role_arn="arn:aws:iam::987654321098:role/VaultAssumeRole"

    write_secret infrastructure/aws/s3-backup \
        bucket="company-backups-prod" \
        access_key_id="AKIAZ5BACKUP7EXAMPLE" \
        secret_access_key="BackupSecretKey123EXAMPLEKEY" \
        kms_key_id="arn:aws:kms:us-east-1:987654321098:key/12345678-1234-1234-1234-123456789012"

    # --- Kubernetes ---
    log_info "  Creating Kubernetes secrets..."

    write_secret infrastructure/kubernetes/dev-cluster \
        api_server="https://k8s-dev.internal:6443" \
        ca_cert="LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0t..." \
        token="eyJhbGciOiJSUzI1NiIsImtpZCI6IkRFVi..." \
        namespace="default"

    write_secret infrastructure/kubernetes/prod-cluster \
        api_server="https://k8s-prod.internal:6443" \
        ca_cert="LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0t..." \
        token="eyJhbGciOiJSUzI1NiIsImtpZCI6IlBST0Qt..." \
        namespace="production" \
        service_account="vault-auth"

    # --- Terraform ---
    log_info "  Creating Terraform secrets..."

    write_secret infrastructure/terraform/backend \
        bucket="company-terraform-state" \
        dynamodb_table="terraform-locks" \
        region="us-east-1" \
        encrypt="true"

    write_secret infrastructure/terraform/cloud \
        organization="company-org" \
        token="atlasv1.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
        workspace_prefix="company-"

    # --- Docker Registry ---
    log_info "  Creating Docker registry secrets..."

    write_secret infrastructure/docker/ecr \
        registry="987654321098.dkr.ecr.us-east-1.amazonaws.com" \
        username="AWS" \
        region="us-east-1"

    write_secret infrastructure/docker/dockerhub \
        registry="docker.io" \
        username="companybot" \
        password="D0ck3rHub-T0k3n-2024!" \
        email="devops@company.com"

    write_secret infrastructure/docker/ghcr \
        registry="ghcr.io" \
        username="company-bot" \
        token="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

    # --- Monitoring ---
    log_info "  Creating monitoring secrets..."

    write_secret infrastructure/monitoring/datadog \
        api_key="ddxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
        app_key="ddxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
        site="datadoghq.com"

    write_secret infrastructure/monitoring/pagerduty \
        api_key="u+xxxxxxxxxxxxxxxxxx" \
        service_key="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
        escalation_policy="PABCDEF"

    write_secret infrastructure/monitoring/grafana \
        url="https://grafana.company.com" \
        admin_user="admin" \
        admin_password="Gr@f@n@-Adm1n-2024!" \
        api_key="eyJrIjoixxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

    # --- DNS ---
    log_info "  Creating DNS secrets..."

    write_secret infrastructure/dns/cloudflare \
        api_token="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
        zone_id="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
        account_id="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

    write_secret infrastructure/dns/route53 \
        hosted_zone_id="Z1234567890ABC" \
        access_key_id="AKIADNS12345EXAMPLE" \
        secret_access_key="DNSSecretKey123EXAMPLEKEY"

    log_success "Infrastructure mount setup complete"
}

# =============================================================================
# MOUNT 3: teams - Team-specific secrets and shared credentials
# =============================================================================
setup_teams_mount() {
    log_info "Setting up 'teams' mount..."
    enable_kv_engine "teams" "Team-specific secrets and shared credentials"

    # --- Platform Team ---
    log_info "  Creating platform team secrets..."

    write_secret teams/platform/shared/github \
        org="company-platform" \
        token="ghp_platformteamtoken123456789012345678" \
        webhook_secret="platform-webhook-secret"

    write_secret teams/platform/shared/jira \
        url="https://company.atlassian.net" \
        username="platform-bot@company.com" \
        api_token="ATATT3xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

    write_secret teams/platform/shared/confluence \
        url="https://company.atlassian.net/wiki" \
        username="platform-bot@company.com" \
        api_token="ATATT3xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

    # --- Security Team ---
    log_info "  Creating security team secrets..."

    write_secret teams/security/scanning/snyk \
        org_id="company-security" \
        api_token="snyk-api-token-xxxxxxxxxxxxxxxx"

    write_secret teams/security/scanning/sonarqube \
        url="https://sonar.company.com" \
        token="squ_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
        project_key="company-main"

    write_secret teams/security/siem/splunk \
        url="https://splunk.company.com:8089" \
        token="Splunk xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" \
        index="security_events"

    write_secret teams/security/vault-admin/emergency \
        root_token="hvs.EMERGENCY-ROOT-TOKEN-DO-NOT-USE" \
        unseal_key_1="UNSEAL-KEY-1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
        unseal_key_2="UNSEAL-KEY-2-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
        unseal_key_3="UNSEAL-KEY-3-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
        recovery_shares="5" \
        recovery_threshold="3"

    # --- DevOps Team ---
    log_info "  Creating devops team secrets..."

    write_secret teams/devops/ci-cd/jenkins \
        url="https://jenkins.company.com" \
        username="jenkins-admin" \
        api_token="11xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
        crumb_issuer="true"

    write_secret teams/devops/ci-cd/github-actions \
        app_id="123456" \
        app_private_key="-----BEGIN RSA PRIVATE KEY-----\nMIIE...\n-----END RSA PRIVATE KEY-----" \
        installation_id="12345678"

    write_secret teams/devops/ci-cd/argocd \
        url="https://argocd.company.com" \
        username="admin" \
        password="Arg0CD-Adm1n-P@ss!" \
        auth_token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.argocd..."

    write_secret teams/devops/artifacts/nexus \
        url="https://nexus.company.com" \
        username="deployer" \
        password="N3xus-D3pl0y3r-2024!" \
        docker_port="8082" \
        npm_port="8081"

    # --- Data Team ---
    log_info "  Creating data team secrets..."

    write_secret teams/data/warehouses/snowflake \
        account="company.us-east-1" \
        username="DATA_PIPELINE_USER" \
        password="Sn0wfl@k3-P1p3l1n3-2024!" \
        warehouse="COMPUTE_WH" \
        database="ANALYTICS" \
        role="DATA_ENGINEER"

    write_secret teams/data/warehouses/bigquery \
        project_id="company-data-prod" \
        credentials_json='{"type":"service_account","project_id":"company-data-prod","private_key_id":"abc123"}' \
        dataset="analytics"

    write_secret teams/data/streaming/kafka \
        bootstrap_servers="kafka-1.company.com:9092,kafka-2.company.com:9092,kafka-3.company.com:9092" \
        username="data-pipeline" \
        password="K@fk@-Pr0duc3r-2024!" \
        schema_registry="https://schema-registry.company.com:8081" \
        security_protocol="SASL_SSL"

    log_success "Teams mount setup complete"
}

# =============================================================================
# MOUNT 4: third-party - External service integrations and API keys
# =============================================================================
setup_third_party_mount() {
    log_info "Setting up 'third-party' mount..."
    enable_kv_engine "third-party" "External service integrations and API keys"

    # --- Analytics ---
    log_info "  Creating analytics integrations..."

    write_secret third-party/analytics/google-analytics \
        tracking_id="UA-123456789-1" \
        measurement_id="G-XXXXXXXXXX" \
        api_secret="xxxxxxxxxxxxxxxxxxx"

    write_secret third-party/analytics/mixpanel \
        project_token="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
        api_secret="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

    write_secret third-party/analytics/segment \
        write_key="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
        workspace_slug="company"

    # --- Communication ---
    log_info "  Creating communication integrations..."

    write_secret third-party/communication/slack \
        bot_token="xoxb-xxxxxxxxxxxx-xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx" \
        signing_secret="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
        app_token="xapp-x-xxxxxxxxxxxx-xxxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
        webhook_url="https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX"

    write_secret third-party/communication/discord \
        bot_token="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
        client_id="123456789012345678" \
        client_secret="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
        webhook_url="https://discord.com/api/webhooks/123456789012345678/xxxx"

    write_secret third-party/communication/intercom \
        app_id="xxxxxxxx" \
        api_key="dG9rOmxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
        identity_verification_secret="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

    # --- AI/ML Services ---
    log_info "  Creating AI/ML service integrations..."

    write_secret third-party/ai/openai \
        api_key="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
        organization_id="org-xxxxxxxxxxxxxxxxxxxxxxxx" \
        default_model="gpt-4"

    write_secret third-party/ai/anthropic \
        api_key="sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
        default_model="claude-3-opus"

    write_secret third-party/ai/huggingface \
        api_token="hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
        organization="company-ml"

    # --- Maps & Location ---
    log_info "  Creating maps integrations..."

    write_secret third-party/maps/google-maps \
        api_key="AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
        places_api_key="AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

    write_secret third-party/maps/mapbox \
        access_token="pk.eyJ1IjoiY29tcGFueSIsImEiOiJjxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
        secret_token="sk.eyJ1IjoiY29tcGFueSIsImEiOiJjxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

    # --- Payment Processors ---
    log_info "  Creating payment processor integrations..."

    write_secret third-party/payments/paypal \
        client_id="AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxB" \
        client_secret="ExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxF" \
        mode="live"

    write_secret third-party/payments/square \
        application_id="sq0idp-xxxxxxxxxxxxxxxxxxxx" \
        access_token="EAAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
        location_id="LXXXXXXXXXXXXXXXXXX"

    # --- Authentication Providers ---
    log_info "  Creating auth provider integrations..."

    write_secret third-party/auth/auth0 \
        domain="company.auth0.com" \
        client_id="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
        client_secret="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
        audience="https://api.company.com"

    write_secret third-party/auth/okta \
        domain="company.okta.com" \
        client_id="0oaxxxxxxxxxxxxxxxxxx" \
        client_secret="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
        issuer="https://company.okta.com/oauth2/default"

    log_success "Third-party mount setup complete"
}

# =============================================================================
# MOUNT 5: certificates - TLS certificates and keys
# =============================================================================
setup_certificates_mount() {
    log_info "Setting up 'certificates' mount..."
    enable_kv_engine "certificates" "TLS certificates, keys, and CA bundles"

    # --- Wildcard Certificates ---
    log_info "  Creating wildcard certificates..."

    write_secret certificates/wildcard/company-com \
        common_name="*.company.com" \
        certificate="-----BEGIN CERTIFICATE-----\nMIIFxxxxxxxxxx...\n-----END CERTIFICATE-----" \
        private_key="-----BEGIN RSA PRIVATE KEY-----\nMIIExxxxxxxxxx...\n-----END RSA PRIVATE KEY-----" \
        chain="-----BEGIN CERTIFICATE-----\nMIIFxxxxxxxxxx...\n-----END CERTIFICATE-----" \
        expiry="2025-12-31" \
        issuer="DigiCert"

    write_secret certificates/wildcard/internal \
        common_name="*.internal.company.com" \
        certificate="-----BEGIN CERTIFICATE-----\nMIIExxxxxxxxxx...\n-----END CERTIFICATE-----" \
        private_key="-----BEGIN RSA PRIVATE KEY-----\nMIIDxxxxxxxxxx...\n-----END RSA PRIVATE KEY-----" \
        expiry="2025-06-30" \
        issuer="Internal CA"

    # --- Service Certificates ---
    log_info "  Creating service certificates..."

    write_secret certificates/services/api-gateway \
        common_name="api.company.com" \
        certificate="-----BEGIN CERTIFICATE-----\nMIIFxxxxxxxxxx...\n-----END CERTIFICATE-----" \
        private_key="-----BEGIN RSA PRIVATE KEY-----\nMIIExxxxxxxxxx...\n-----END RSA PRIVATE KEY-----" \
        san="api.company.com,api-v2.company.com,gateway.company.com"

    write_secret certificates/services/database-tls \
        common_name="db.internal.company.com" \
        ca_cert="-----BEGIN CERTIFICATE-----\nMIIDxxxxxxxxxx...\n-----END CERTIFICATE-----" \
        client_cert="-----BEGIN CERTIFICATE-----\nMIIDxxxxxxxxxx...\n-----END CERTIFICATE-----" \
        client_key="-----BEGIN RSA PRIVATE KEY-----\nMIIExxxxxxxxxx...\n-----END RSA PRIVATE KEY-----"

    # --- CA Bundles ---
    log_info "  Creating CA bundles..."

    write_secret certificates/ca/internal-root \
        certificate="-----BEGIN CERTIFICATE-----\nMIIFxxxxxxxxxx...\n-----END CERTIFICATE-----" \
        private_key="-----BEGIN RSA PRIVATE KEY-----\nMIIJxxxxxxxxxx...\n-----END RSA PRIVATE KEY-----" \
        serial="01" \
        expiry="2030-01-01"

    write_secret certificates/ca/internal-intermediate \
        certificate="-----BEGIN CERTIFICATE-----\nMIIExxxxxxxxxx...\n-----END CERTIFICATE-----" \
        private_key="-----BEGIN RSA PRIVATE KEY-----\nMIIHxxxxxxxxxx...\n-----END RSA PRIVATE KEY-----" \
        parent="internal-root" \
        serial="02"

    log_success "Certificates mount setup complete"
}

# =============================================================================
# MOUNT 6: shared - Organization-wide shared secrets
# =============================================================================
setup_shared_mount() {
    log_info "Setting up 'shared' mount..."
    enable_kv_engine "shared" "Organization-wide shared secrets and configurations"

    # --- Global Configurations ---
    log_info "  Creating global configurations..."

    write_secret shared/config/feature-flags \
        provider="launchdarkly" \
        sdk_key="sdk-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" \
        client_id="xxxxxxxxxxxxxxxxxxxxxxxx"

    write_secret shared/config/logging \
        level="info" \
        format="json" \
        elasticsearch_url="https://logs.company.com:9200" \
        elasticsearch_user="logger" \
        elasticsearch_password="L0gg3r-ES-2024!"

    # --- Encryption Keys ---
    log_info "  Creating encryption keys..."

    write_secret shared/encryption/data-at-rest \
        algorithm="AES-256-GCM" \
        key="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
        key_version="3" \
        rotation_date="2024-06-01"

    write_secret shared/encryption/pii \
        algorithm="AES-256-CBC" \
        key="yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy" \
        iv="zzzzzzzzzzzzzzzzzzzzzz" \
        purpose="PII field encryption"

    # --- Signing Keys ---
    log_info "  Creating signing keys..."

    write_secret shared/signing/webhook \
        algorithm="HMAC-SHA256" \
        secret="webhook-signing-secret-xxxxxxxxxxxxxxxx" \
        version="2"

    write_secret shared/signing/api-tokens \
        algorithm="RS256" \
        private_key="-----BEGIN RSA PRIVATE KEY-----\nMIIExxxxxxxxxx...\n-----END RSA PRIVATE KEY-----" \
        public_key="-----BEGIN PUBLIC KEY-----\nMIIBxxxxxxxxxx...\n-----END PUBLIC KEY-----"

    # --- License Keys ---
    log_info "  Creating license keys..."

    write_secret shared/licenses/enterprise-tools \
        jetbrains="XXXX-XXXX-XXXX-XXXX-XXXX" \
        github_enterprise="ghe-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
        jira="AAAA-BBBB-CCCC-DDDD" \
        confluence="EEEE-FFFF-GGGG-HHHH"

    log_success "Shared mount setup complete"
}

# =============================================================================
# Summary function
# =============================================================================
print_summary() {
    echo ""
    echo "============================================================================="
    echo -e "${GREEN}Enterprise Vault Secrets Setup Complete!${NC}"
    echo "============================================================================="
    echo ""
    echo "Created the following KV v2 secret mounts:"
    echo ""
    echo "  1. applications/     - Application secrets by service and environment"
    echo "     └── user-service/, payment-service/, api-gateway/, notification-service/"
    echo ""
    echo "  2. infrastructure/   - Infrastructure and platform secrets"
    echo "     └── aws/, kubernetes/, terraform/, docker/, monitoring/, dns/"
    echo ""
    echo "  3. teams/            - Team-specific secrets and shared credentials"
    echo "     └── platform/, security/, devops/, data/"
    echo ""
    echo "  4. third-party/      - External service integrations and API keys"
    echo "     └── analytics/, communication/, ai/, maps/, payments/, auth/"
    echo ""
    echo "  5. certificates/     - TLS certificates, keys, and CA bundles"
    echo "     └── wildcard/, services/, ca/"
    echo ""
    echo "  6. shared/           - Organization-wide shared secrets"
    echo "     └── config/, encryption/, signing/, licenses/"
    echo ""
    echo "============================================================================="
    echo "Total secrets created: ~60+ secrets across 6 mounts"
    echo "============================================================================="
    echo ""
    echo "You can now test the Vault AI interface with commands like:"
    echo "  - 'List all secrets in applications/user-service/prod'"
    echo "  - 'Show me the database credentials for the payment service'"
    echo "  - 'What AWS credentials do we have?'"
    echo "  - 'Find all secrets related to Stripe'"
    echo ""
}

# =============================================================================
# Main execution
# =============================================================================
main() {
    echo ""
    echo "============================================================================="
    echo "Enterprise Vault KV v2 Secrets Setup Script"
    echo "============================================================================="
    echo ""

    check_prerequisites

    echo ""
    log_info "Starting secrets setup..."
    echo ""

    setup_applications_mount
    echo ""
    setup_infrastructure_mount
    echo ""
    setup_teams_mount
    echo ""
    setup_third_party_mount
    echo ""
    setup_certificates_mount
    echo ""
    setup_shared_mount

    print_summary
}

# Run main function
main "$@"
