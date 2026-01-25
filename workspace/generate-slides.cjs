const fs = require('fs');
const path = require('path');
const pptxgen = require('pptxgenjs');
const html2pptx = require('/Users/abdii/.claude/plugins/cache/anthropic-agent-skills/document-skills/69c0b1a06741/skills/pptx/scripts/html2pptx.js');

// Color palette - Vault/Security themed
const colors = {
  primary: '#7B61FF',      // Vault purple
  primaryDark: '#5B41DF',
  dark: '#1C1C2E',
  darkAlt: '#2D2D44',
  light: '#F8F7FC',
  white: '#FFFFFF',
  green: '#10B981',        // Allowed
  red: '#EF4444',          // Denied
  gray: '#6B7280',
  grayLight: '#E5E7EB',
  text: '#1F2937',
  textLight: '#6B7280'
};

const slidesDir = path.join(__dirname, 'slides');

// Slide 1: Title
const slide1 = `<!DOCTYPE html>
<html><head><style>
html { background: ${colors.white}; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; background: ${colors.dark}; }
.container { width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; }
.logo-bar { position: absolute; top: 30pt; left: 40pt; }
h1 { color: ${colors.white}; font-size: 48pt; margin: 0 0 12pt 0; text-align: center; }
.subtitle { color: ${colors.primary}; font-size: 24pt; margin: 0 0 30pt 0; text-align: center; }
.tagline { color: ${colors.grayLight}; font-size: 16pt; margin: 0; text-align: center; }
.accent-line { width: 120pt; height: 4pt; background: ${colors.primary}; margin: 20pt 0; }
</style></head><body>
<div class="container">
  <h1>Vault AI</h1>
  <div class="accent-line"></div>
  <p class="subtitle">Enterprise Secrets Management</p>
  <p class="tagline">Secure by Design: RBAC &amp; Policy Enforcement</p>
</div>
</body></html>`;

// Slide 2: The Challenge
const slide2 = `<!DOCTYPE html>
<html><head><style>
html { background: ${colors.white}; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; background: ${colors.white}; }
.header { position: absolute; top: 0; left: 0; right: 0; height: 60pt; background: ${colors.dark}; display: flex; align-items: center; padding-left: 40pt; }
.header h1 { color: ${colors.white}; font-size: 24pt; margin: 0; }
.content { margin: 80pt 40pt 30pt 40pt; display: flex; gap: 30pt; }
.col { flex: 1; }
h2 { color: ${colors.dark}; font-size: 16pt; margin: 0 0 12pt 0; border-bottom: 2pt solid ${colors.primary}; padding-bottom: 8pt; }
ul { margin: 0; padding-left: 18pt; }
li { color: ${colors.text}; font-size: 12pt; margin-bottom: 8pt; line-height: 1.4; }
.warning-box { background: ${colors.red}; padding: 12pt; margin-top: 15pt; border-radius: 4pt; }
.warning-box p { color: ${colors.white}; font-size: 11pt; margin: 0; font-style: italic; }
</style></head><body>
<div class="header"><h1>The Challenge</h1></div>
<div class="content">
  <div class="col">
    <h2>Traditional Pain Points</h2>
    <ul>
      <li>Engineers struggle to find secrets across complex hierarchies</li>
      <li>Manual navigation through nested paths is error-prone</li>
      <li>No natural language interface for common operations</li>
      <li>Context switching between tools slows productivity</li>
    </ul>
  </div>
  <div class="col">
    <h2>The Risk with AI + Secrets</h2>
    <ul>
      <li>AI assistants need guardrails</li>
      <li>Users might accidentally access unauthorized data</li>
      <li>Privilege escalation concerns</li>
    </ul>
    <div class="warning-box">
      <p>"AI should help users access secrets they're authorized to see—not bypass security controls"</p>
    </div>
  </div>
</div>
</body></html>`;

// Slide 3: Solution Architecture
const slide3 = `<!DOCTYPE html>
<html><head><style>
html { background: ${colors.white}; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; background: ${colors.white}; }
.header { position: absolute; top: 0; left: 0; right: 0; height: 60pt; background: ${colors.dark}; display: flex; align-items: center; padding-left: 40pt; }
.header h1 { color: ${colors.white}; font-size: 24pt; margin: 0; }
.content { margin: 75pt 40pt 20pt 40pt; }
.arch-container { display: flex; flex-direction: column; gap: 8pt; align-items: center; }
.tier { width: 580pt; padding: 12pt 20pt; border-radius: 6pt; text-align: center; }
.tier-browser { background: ${colors.light}; border: 2pt solid ${colors.primary}; }
.tier-proxy { background: ${colors.darkAlt}; }
.tier-vault { background: ${colors.dark}; }
.tier h3 { margin: 0 0 4pt 0; font-size: 13pt; }
.tier-browser h3 { color: ${colors.dark}; }
.tier-proxy h3, .tier-vault h3 { color: ${colors.white}; }
.tier p { margin: 0; font-size: 10pt; }
.tier-browser p { color: ${colors.gray}; }
.tier-proxy p, .tier-vault p { color: ${colors.grayLight}; }
.arrow { color: ${colors.primary}; font-size: 18pt; margin: 2pt 0; }
.key-insight { background: ${colors.green}; padding: 10pt 20pt; border-radius: 4pt; margin-top: 12pt; }
.key-insight p { color: ${colors.white}; font-size: 11pt; margin: 0; text-align: center; }
</style></head><body>
<div class="header"><h1>Vault AI Solution Architecture</h1></div>
<div class="content">
  <div class="arch-container">
    <div class="tier tier-browser">
      <h3>Browser (React SPA)</h3>
      <p>User authenticates with Vault token stored in sessionStorage</p>
    </div>
    <p class="arrow">▼ Uses USER'S token ▼</p>
    <div class="tier tier-proxy">
      <h3>MCP Proxy + Claude AI</h3>
      <p>Processes natural language → Vault API calls (passes through user token)</p>
    </div>
    <p class="arrow">▼ X-Vault-Token header ▼</p>
    <div class="tier tier-vault">
      <h3>HashiCorp Vault Server</h3>
      <p>Policy enforcement at API level: Allowed → Returns secret | Denied → 403 Forbidden</p>
    </div>
    <div class="key-insight">
      <p><b>Key Insight:</b> AI operations inherit the user's permissions—no privilege escalation possible</p>
    </div>
  </div>
</div>
</body></html>`;

// Slide 4: Demo Personas
const slide4 = `<!DOCTYPE html>
<html><head><style>
html { background: ${colors.white}; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; background: ${colors.white}; }
.header { position: absolute; top: 0; left: 0; right: 0; height: 60pt; background: ${colors.dark}; display: flex; align-items: center; padding-left: 40pt; }
.header h1 { color: ${colors.white}; font-size: 24pt; margin: 0; }
.content { margin: 75pt 30pt 20pt 30pt; }
table { width: 100%; border-collapse: collapse; font-size: 10pt; }
th { background: ${colors.primary}; color: ${colors.white}; padding: 10pt 8pt; text-align: left; font-size: 11pt; }
td { padding: 8pt; border-bottom: 1pt solid ${colors.grayLight}; color: ${colors.text}; vertical-align: top; }
tr:nth-child(even) td { background: ${colors.light}; }
.role { font-weight: bold; color: ${colors.primaryDark}; }
.allowed { color: ${colors.green}; }
.denied { color: ${colors.red}; }
</style></head><body>
<div class="header"><h1>Demo Personas - Five Enterprise Roles</h1></div>
<div class="content">
  <table>
    <tr><th>Role</th><th>Team</th><th>Primary Access</th><th>Restricted From</th></tr>
    <tr>
      <td class="role">api-developer</td>
      <td>API Team</td>
      <td class="allowed">API Gateway, Third-party APIs</td>
      <td class="denied">Database secrets, Infrastructure</td>
    </tr>
    <tr>
      <td class="role">dba-admin</td>
      <td>Database Team</td>
      <td class="allowed">All database credentials</td>
      <td class="denied">API keys, Cloud infrastructure</td>
    </tr>
    <tr>
      <td class="role">security-analyst</td>
      <td>Security Team</td>
      <td class="allowed">Certificates, Audit (read-only)</td>
      <td class="denied">Cannot modify anything</td>
    </tr>
    <tr>
      <td class="role">devops-engineer</td>
      <td>DevOps Team</td>
      <td class="allowed">Infrastructure, CI/CD</td>
      <td class="denied">Payment systems</td>
    </tr>
    <tr>
      <td class="role">platform-engineer</td>
      <td>Platform Team</td>
      <td class="allowed">Shared configs, Notifications</td>
      <td class="denied">Security secrets, Payments</td>
    </tr>
  </table>
</div>
</body></html>`;

// Slide 5: Policy Example
const slide5 = `<!DOCTYPE html>
<html><head><style>
html { background: ${colors.white}; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; background: ${colors.white}; }
.header { position: absolute; top: 0; left: 0; right: 0; height: 60pt; background: ${colors.dark}; display: flex; align-items: center; padding-left: 40pt; }
.header h1 { color: ${colors.white}; font-size: 24pt; margin: 0; }
.content { margin: 75pt 30pt 20pt 30pt; display: flex; gap: 20pt; }
.col { flex: 1; }
h2 { font-size: 14pt; margin: 0 0 10pt 0; padding-bottom: 6pt; }
.allowed-header { color: ${colors.green}; border-bottom: 2pt solid ${colors.green}; }
.denied-header { color: ${colors.red}; border-bottom: 2pt solid ${colors.red}; }
.code-block { background: ${colors.dark}; padding: 12pt; border-radius: 4pt; font-family: Courier New, monospace; font-size: 9pt; }
.code-block p { color: ${colors.grayLight}; margin: 0 0 2pt 0; line-height: 1.5; }
.comment { color: ${colors.gray}; }
.keyword { color: ${colors.primary}; }
.string { color: ${colors.green}; }
</style></head><body>
<div class="header"><h1>Policy Example - API Developer</h1></div>
<div class="content">
  <div class="col">
    <h2 class="allowed-header">What They CAN Access</h2>
    <div class="code-block">
      <p class="comment"># API Gateway - full access</p>
      <p><span class="keyword">path</span> <span class="string">"applications/data/api-gateway/*"</span></p>
      <p>  capabilities = [<span class="string">"create"</span>, <span class="string">"read"</span>,</p>
      <p>    <span class="string">"update"</span>, <span class="string">"delete"</span>, <span class="string">"list"</span>]</p>
      <p></p>
      <p class="comment"># Third-party APIs</p>
      <p><span class="keyword">path</span> <span class="string">"third-party/data/ai/*"</span></p>
      <p>  capabilities = [<span class="string">"read"</span>, <span class="string">"list"</span>]</p>
    </div>
  </div>
  <div class="col">
    <h2 class="denied-header">What They CANNOT Access</h2>
    <div class="code-block">
      <p class="comment"># Explicit denial - database secrets</p>
      <p><span class="keyword">path</span> <span class="string">"applications/data/*/database"</span></p>
      <p>  capabilities = [<span class="string">"deny"</span>]</p>
      <p></p>
      <p class="comment"># No infrastructure access</p>
      <p><span class="keyword">path</span> <span class="string">"infrastructure/*"</span></p>
      <p>  capabilities = [<span class="string">"deny"</span>]</p>
    </div>
  </div>
</div>
</body></html>`;

// Slide 6: Live Demo - API Developer
const slide6 = `<!DOCTYPE html>
<html><head><style>
html { background: ${colors.white}; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; background: ${colors.white}; }
.header { position: absolute; top: 0; left: 0; right: 0; height: 60pt; background: ${colors.primary}; display: flex; align-items: center; padding-left: 40pt; }
.header h1 { color: ${colors.white}; font-size: 22pt; margin: 0; }
.badge { background: ${colors.white}; color: ${colors.primary}; padding: 4pt 12pt; border-radius: 12pt; margin-left: 15pt; font-size: 12pt; }
.content { margin: 75pt 40pt 20pt 40pt; }
.demo-item { margin-bottom: 18pt; }
.demo-label { display: flex; align-items: center; gap: 8pt; margin-bottom: 6pt; }
.status { padding: 2pt 8pt; border-radius: 3pt; font-size: 10pt; color: ${colors.white}; }
.status-allowed { background: ${colors.green}; }
.status-denied { background: ${colors.red}; }
h3 { color: ${colors.dark}; font-size: 13pt; margin: 0; }
.prompt { background: ${colors.light}; padding: 10pt 14pt; border-radius: 4pt; border-left: 4pt solid ${colors.primary}; }
.prompt p { color: ${colors.text}; font-size: 11pt; margin: 0; font-style: italic; }
.expected { color: ${colors.gray}; font-size: 10pt; margin: 6pt 0 0 0; }
</style></head><body>
<div class="header"><h1>Live Demo</h1><span class="badge">api-developer</span></div>
<div class="content">
  <div class="demo-item">
    <div class="demo-label"><div class="status status-allowed">ALLOWED</div><h3>Demo 1: Authorized Access</h3></div>
    <div class="prompt"><p>"Show me the API Gateway OAuth configuration"</p></div>
    <p class="expected">Expected: Returns OAuth client_id, client_secret, endpoints</p>
  </div>
  <div class="demo-item">
    <div class="demo-label"><div class="status status-denied">DENIED</div><h3>Demo 2: Unauthorized Access</h3></div>
    <div class="prompt"><p>"Show me the user-service production database password"</p></div>
    <p class="expected">Expected: Permission denied error from Vault</p>
  </div>
  <div class="demo-item">
    <div class="demo-label"><div class="status status-denied">DENIED</div><h3>Demo 3: Navigation Restriction</h3></div>
    <div class="prompt"><p>"List all secrets in the infrastructure mount"</p></div>
    <p class="expected">Expected: Only sees paths they have access to</p>
  </div>
</div>
</body></html>`;

// Slide 7: Live Demo - DBA Admin
const slide7 = `<!DOCTYPE html>
<html><head><style>
html { background: ${colors.white}; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; background: ${colors.white}; }
.header { position: absolute; top: 0; left: 0; right: 0; height: 60pt; background: ${colors.primary}; display: flex; align-items: center; padding-left: 40pt; }
.header h1 { color: ${colors.white}; font-size: 22pt; margin: 0; }
.badge { background: ${colors.white}; color: ${colors.primary}; padding: 4pt 12pt; border-radius: 12pt; margin-left: 15pt; font-size: 12pt; }
.content { margin: 75pt 40pt 20pt 40pt; }
.demo-item { margin-bottom: 18pt; }
.demo-label { display: flex; align-items: center; gap: 8pt; margin-bottom: 6pt; }
.status { padding: 2pt 8pt; border-radius: 3pt; font-size: 10pt; color: ${colors.white}; }
.status-allowed { background: ${colors.green}; }
.status-denied { background: ${colors.red}; }
h3 { color: ${colors.dark}; font-size: 13pt; margin: 0; }
.prompt { background: ${colors.light}; padding: 10pt 14pt; border-radius: 4pt; border-left: 4pt solid ${colors.primary}; }
.prompt p { color: ${colors.text}; font-size: 11pt; margin: 0; font-style: italic; }
.expected { color: ${colors.gray}; font-size: 10pt; margin: 6pt 0 0 0; }
</style></head><body>
<div class="header"><h1>Live Demo</h1><span class="badge">dba-admin</span></div>
<div class="content">
  <div class="demo-item">
    <div class="demo-label"><div class="status status-allowed">ALLOWED</div><h3>Demo 1: Database Access</h3></div>
    <div class="prompt"><p>"Show me all database credentials across services"</p></div>
    <p class="expected">Expected: Returns database secrets from user-service, payment-service, etc.</p>
  </div>
  <div class="demo-item">
    <div class="demo-label"><div class="status status-denied">DENIED</div><h3>Demo 2: API Key Restriction</h3></div>
    <div class="prompt"><p>"What's the Stripe API key for production?"</p></div>
    <p class="expected">Expected: Permission denied - DBA doesn't need payment API keys</p>
  </div>
  <div class="demo-item">
    <div class="demo-label"><div class="status status-denied">DENIED</div><h3>Demo 3: Infrastructure Boundary</h3></div>
    <div class="prompt"><p>"Show me the AWS production credentials"</p></div>
    <p class="expected">Expected: Permission denied - infrastructure secrets restricted</p>
  </div>
</div>
</body></html>`;

// Slide 8: Live Demo - Security Analyst
const slide8 = `<!DOCTYPE html>
<html><head><style>
html { background: ${colors.white}; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; background: ${colors.white}; }
.header { position: absolute; top: 0; left: 0; right: 0; height: 60pt; background: ${colors.primary}; display: flex; align-items: center; padding-left: 40pt; }
.header h1 { color: ${colors.white}; font-size: 22pt; margin: 0; }
.badge { background: ${colors.white}; color: ${colors.primary}; padding: 4pt 12pt; border-radius: 12pt; margin-left: 15pt; font-size: 12pt; }
.content { margin: 75pt 40pt 20pt 40pt; }
.demo-item { margin-bottom: 18pt; }
.demo-label { display: flex; align-items: center; gap: 8pt; margin-bottom: 6pt; }
.status { padding: 2pt 8pt; border-radius: 3pt; font-size: 10pt; color: ${colors.white}; }
.status-allowed { background: ${colors.green}; }
.status-denied { background: ${colors.red}; }
h3 { color: ${colors.dark}; font-size: 13pt; margin: 0; }
.prompt { background: ${colors.light}; padding: 10pt 14pt; border-radius: 4pt; border-left: 4pt solid ${colors.primary}; }
.prompt p { color: ${colors.text}; font-size: 11pt; margin: 0; font-style: italic; }
.expected { color: ${colors.gray}; font-size: 10pt; margin: 6pt 0 0 0; }
.readonly-note { background: ${colors.dark}; color: ${colors.grayLight}; padding: 8pt 12pt; border-radius: 4pt; margin-top: 15pt; font-size: 10pt; text-align: center; }
</style></head><body>
<div class="header"><h1>Live Demo</h1><span class="badge">security-analyst</span></div>
<div class="content">
  <div class="demo-item">
    <div class="demo-label"><div class="status status-allowed">ALLOWED</div><h3>Demo 1: Audit Access</h3></div>
    <div class="prompt"><p>"List all TLS certificates and their expiry dates"</p></div>
    <p class="expected">Expected: Returns certificate information (read-only)</p>
  </div>
  <div class="demo-item">
    <div class="demo-label"><div class="status status-denied">DENIED</div><h3>Demo 2: Write Operation Blocked</h3></div>
    <div class="prompt"><p>"Delete the expired Snyk API token"</p></div>
    <p class="expected">Expected: Permission denied - analyst has read-only access</p>
  </div>
  <div class="demo-item">
    <div class="demo-label"><div class="status status-denied">DENIED</div><h3>Demo 3: Cloud Credentials</h3></div>
    <div class="prompt"><p>"Show me the AWS root credentials"</p></div>
    <p class="expected">Expected: Permission denied - no cloud infrastructure access</p>
  </div>
  <div class="readonly-note"><p>Security Analyst: READ-ONLY access for audit and compliance purposes</p></div>
</div>
</body></html>`;

// Slide 9: Technical Deep Dive
const slide9 = `<!DOCTYPE html>
<html><head><style>
html { background: ${colors.white}; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; background: ${colors.white}; }
.header { position: absolute; top: 0; left: 0; right: 0; height: 60pt; background: ${colors.dark}; display: flex; align-items: center; padding-left: 40pt; }
.header h1 { color: ${colors.white}; font-size: 24pt; margin: 0; }
.content { margin: 75pt 30pt 20pt 30pt; }
h2 { color: ${colors.dark}; font-size: 16pt; margin: 0 0 15pt 0; }
.flow-container { display: flex; flex-direction: column; gap: 6pt; }
.flow-step { display: flex; align-items: center; gap: 12pt; }
.step-num { width: 24pt; height: 24pt; background: ${colors.primary}; color: ${colors.white}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11pt; font-weight: bold; flex-shrink: 0; }
.step-text { color: ${colors.text}; font-size: 11pt; }
.step-detail { color: ${colors.gray}; font-size: 9pt; margin-left: 36pt; margin-top: -4pt; margin-bottom: 4pt; }
.bottom-box { background: ${colors.dark}; padding: 12pt 20pt; border-radius: 4pt; margin-top: 15pt; text-align: center; }
.bottom-box p { color: ${colors.white}; font-size: 12pt; margin: 0; }
</style></head><body>
<div class="header"><h1>Technical Deep Dive - Authorization Flow</h1></div>
<div class="content">
  <div class="flow-container">
    <div class="flow-step"><div class="step-num"><p>1</p></div><p class="step-text">User logs into Vault AI with their Vault token</p></div>
    <p class="step-detail">Token stored in browser sessionStorage only</p>
    <div class="flow-step"><div class="step-num"><p>2</p></div><p class="step-text">User sends natural language request</p></div>
    <p class="step-detail">"Show me the production database password"</p>
    <div class="flow-step"><div class="step-num"><p>3</p></div><p class="step-text">MCP Proxy receives request with user's token</p></div>
    <p class="step-detail">Forwards token in X-Vault-Token header</p>
    <div class="flow-step"><div class="step-num"><p>4</p></div><p class="step-text">Claude determines which Vault API calls to make</p></div>
    <p class="step-detail">GET /v1/applications/data/user-service/prod/database</p>
    <div class="flow-step"><div class="step-num"><p>5</p></div><p class="step-text">Vault evaluates request against user's policies</p></div>
    <p class="step-detail">Policy check: Does token have 'read' on this path?</p>
    <div class="flow-step"><div class="step-num"><p>6</p></div><p class="step-text">Vault returns result OR 403 Forbidden</p></div>
  </div>
  <div class="bottom-box"><p><b>No token elevation. No policy bypass. No exceptions.</b></p></div>
</div>
</body></html>`;

// Slide 10: Security Architecture
const slide10 = `<!DOCTYPE html>
<html><head><style>
html { background: ${colors.white}; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; background: ${colors.white}; }
.header { position: absolute; top: 0; left: 0; right: 0; height: 60pt; background: ${colors.dark}; display: flex; align-items: center; padding-left: 40pt; }
.header h1 { color: ${colors.white}; font-size: 24pt; margin: 0; }
.content { margin: 75pt 30pt 20pt 30pt; display: flex; gap: 25pt; }
.col { flex: 1; }
h2 { font-size: 14pt; margin: 0 0 12pt 0; padding-bottom: 6pt; border-bottom: 2pt solid ${colors.primary}; color: ${colors.dark}; }
.layer { margin-bottom: 10pt; }
.layer-name { color: ${colors.primary}; font-size: 11pt; font-weight: bold; margin: 0 0 2pt 0; }
.layer-desc { color: ${colors.text}; font-size: 10pt; margin: 0; }
h3 { color: ${colors.red}; font-size: 12pt; margin: 0 0 10pt 0; }
ul { margin: 0; padding-left: 16pt; }
li { color: ${colors.text}; font-size: 10pt; margin-bottom: 6pt; }
</style></head><body>
<div class="header"><h1>Security Architecture Principles</h1></div>
<div class="content">
  <div class="col">
    <h2>Defense in Depth</h2>
    <div class="layer">
      <p class="layer-name">Browser Layer</p>
      <p class="layer-desc">Token in sessionStorage only, cleared on close</p>
    </div>
    <div class="layer">
      <p class="layer-name">Transport Layer</p>
      <p class="layer-desc">HTTPS only, no token in URLs</p>
    </div>
    <div class="layer">
      <p class="layer-name">MCP Proxy Layer</p>
      <p class="layer-desc">Stateless, no token storage, pass-through only</p>
    </div>
    <div class="layer">
      <p class="layer-name">Vault Layer</p>
      <p class="layer-desc">Policy enforcement, audit logging, token TTL</p>
    </div>
  </div>
  <div class="col">
    <h3>What the AI Cannot Do</h3>
    <ul>
      <li>Access secrets outside user's policy</li>
      <li>Escalate privileges</li>
      <li>Store or exfiltrate tokens</li>
      <li>Bypass Vault's audit logging</li>
      <li>Access other users' sessions</li>
    </ul>
  </div>
</div>
</body></html>`;

// Slide 11: Audit & Compliance
const slide11 = `<!DOCTYPE html>
<html><head><style>
html { background: ${colors.white}; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; background: ${colors.white}; }
.header { position: absolute; top: 0; left: 0; right: 0; height: 60pt; background: ${colors.dark}; display: flex; align-items: center; padding-left: 40pt; }
.header h1 { color: ${colors.white}; font-size: 24pt; margin: 0; }
.content { margin: 75pt 40pt 20pt 40pt; display: flex; gap: 25pt; }
.col-code { flex: 1.2; }
.col-text { flex: 0.8; }
h2 { font-size: 14pt; margin: 0 0 10pt 0; color: ${colors.dark}; }
.code-block { background: ${colors.dark}; padding: 12pt; border-radius: 4pt; font-family: Courier New, monospace; font-size: 8pt; }
.code-block p { color: ${colors.grayLight}; margin: 0; line-height: 1.4; }
.key { color: ${colors.primary}; }
.string { color: ${colors.green}; }
.highlight-box { background: ${colors.green}; padding: 12pt; border-radius: 4pt; margin-top: 15pt; }
.highlight-box p { color: ${colors.white}; font-size: 11pt; margin: 0; text-align: center; }
</style></head><body>
<div class="header"><h1>Audit &amp; Compliance</h1></div>
<div class="content">
  <div class="col-code">
    <h2>Every AI Operation is Logged</h2>
    <div class="code-block">
      <p>{</p>
      <p>  <span class="key">"type"</span>: <span class="string">"request"</span>,</p>
      <p>  <span class="key">"auth"</span>: {</p>
      <p>    <span class="key">"policies"</span>: [<span class="string">"api-developer"</span>],</p>
      <p>    <span class="key">"metadata"</span>: {</p>
      <p>      <span class="key">"username"</span>: <span class="string">"api-developer"</span></p>
      <p>    }</p>
      <p>  },</p>
      <p>  <span class="key">"request"</span>: {</p>
      <p>    <span class="key">"path"</span>: <span class="string">"applications/data/...</span></p>
      <p>      <span class="string">user-service/prod/database"</span>,</p>
      <p>    <span class="key">"operation"</span>: <span class="string">"read"</span></p>
      <p>  },</p>
      <p>  <span class="key">"response"</span>: { <span class="key">"status"</span>: 403 }</p>
      <p>}</p>
    </div>
  </div>
  <div class="col-text">
    <h2>Complete Traceability</h2>
    <ul>
      <li>Who accessed what</li>
      <li>When they accessed it</li>
      <li>Whether it succeeded or failed</li>
      <li>Which policy was applied</li>
      <li>Full request/response details</li>
    </ul>
    <div class="highlight-box">
      <p><b>Same audit trail as direct API access</b></p>
    </div>
  </div>
</div>
</body></html>`;

// Slide 12: Enterprise Benefits
const slide12 = `<!DOCTYPE html>
<html><head><style>
html { background: ${colors.white}; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; background: ${colors.white}; }
.header { position: absolute; top: 0; left: 0; right: 0; height: 60pt; background: ${colors.dark}; display: flex; align-items: center; padding-left: 40pt; }
.header h1 { color: ${colors.white}; font-size: 24pt; margin: 0; }
.content { margin: 75pt 30pt 20pt 30pt; display: flex; gap: 20pt; }
.col { flex: 1; background: ${colors.light}; padding: 15pt; border-radius: 6pt; border-top: 4pt solid ${colors.primary}; }
h2 { color: ${colors.primary}; font-size: 13pt; margin: 0 0 10pt 0; }
ul { margin: 0; padding-left: 16pt; }
li { color: ${colors.text}; font-size: 10pt; margin-bottom: 8pt; line-height: 1.3; }
</style></head><body>
<div class="header"><h1>Enterprise Benefits</h1></div>
<div class="content">
  <div class="col">
    <h2>For Security Teams</h2>
    <ul>
      <li>AI doesn't bypass existing Vault policies</li>
      <li>Same audit trail as direct API access</li>
      <li>No new attack surface introduced</li>
      <li>Existing security controls respected</li>
    </ul>
  </div>
  <div class="col">
    <h2>For Development Teams</h2>
    <ul>
      <li>Natural language access to authorized secrets</li>
      <li>Faster onboarding - ask instead of navigate</li>
      <li>Reduced friction while maintaining security</li>
      <li>Context-aware assistance</li>
    </ul>
  </div>
  <div class="col">
    <h2>For Compliance</h2>
    <ul>
      <li>Role-based access control enforced</li>
      <li>Audit logs capture all AI operations</li>
      <li>Token TTL limits exposure window</li>
      <li>Full traceability for auditors</li>
    </ul>
  </div>
</div>
</body></html>`;

// Slide 13: Summary
const slide13 = `<!DOCTYPE html>
<html><head><style>
html { background: ${colors.white}; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; background: ${colors.dark}; }
.container { width: 100%; padding: 40pt; display: flex; flex-direction: column; }
h1 { color: ${colors.white}; font-size: 28pt; margin: 0 0 8pt 0; }
.subtitle { color: ${colors.primary}; font-size: 16pt; margin: 0 0 25pt 0; }
.features { display: flex; flex-wrap: wrap; gap: 12pt; }
.feature { background: ${colors.darkAlt}; padding: 12pt 16pt; border-radius: 6pt; width: 310pt; display: flex; align-items: center; gap: 10pt; }
.check { color: ${colors.green}; font-size: 16pt; }
.feature p { color: ${colors.white}; font-size: 12pt; margin: 0; }
</style></head><body>
<div class="container">
  <h1>Summary</h1>
  <p class="subtitle">Vault AI: Secure AI-Assisted Secrets Management</p>
  <div class="features">
    <div class="feature"><p class="check">✓</p><p>Natural Language Interface - Ask for secrets in plain English</p></div>
    <div class="feature"><p class="check">✓</p><p>Policy Enforcement - AI inherits user's exact permissions</p></div>
    <div class="feature"><p class="check">✓</p><p>No Privilege Escalation - Token-based auth, no shortcuts</p></div>
    <div class="feature"><p class="check">✓</p><p>Full Audit Trail - Every operation logged in Vault</p></div>
    <div class="feature"><p class="check">✓</p><p>Session Isolation - Tokens scoped to browser session</p></div>
    <div class="feature"><p class="check">✓</p><p>Enterprise Ready - Built for production environments</p></div>
  </div>
</div>
</body></html>`;

// Slide 14: Quick Reference
const slide14 = `<!DOCTYPE html>
<html><head><style>
html { background: ${colors.white}; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; background: ${colors.white}; }
.header { position: absolute; top: 0; left: 0; right: 0; height: 60pt; background: ${colors.primary}; display: flex; align-items: center; padding-left: 40pt; }
.header h1 { color: ${colors.white}; font-size: 22pt; margin: 0; }
.content { margin: 75pt 30pt 20pt 30pt; display: flex; gap: 20pt; }
.col { flex: 1; }
h2 { color: ${colors.dark}; font-size: 13pt; margin: 0 0 10pt 0; border-bottom: 2pt solid ${colors.primary}; padding-bottom: 6pt; }
.code-block { background: ${colors.dark}; padding: 10pt; border-radius: 4pt; font-family: Courier New, monospace; font-size: 8pt; margin-bottom: 12pt; }
.code-block p { color: ${colors.grayLight}; margin: 0 0 2pt 0; }
.comment { color: ${colors.gray}; }
.cmd { color: ${colors.green}; }
table { width: 100%; font-size: 9pt; border-collapse: collapse; }
th { background: ${colors.dark}; color: ${colors.white}; padding: 6pt; text-align: left; }
td { padding: 5pt; border-bottom: 1pt solid ${colors.grayLight}; color: ${colors.text}; }
.user { color: ${colors.primary}; font-weight: bold; }
</style></head><body>
<div class="header"><h1>Quick Reference - Token Regeneration</h1></div>
<div class="content">
  <div class="col">
    <h2>Regenerate Single Token</h2>
    <div class="code-block">
      <p class="comment"># Set Vault address</p>
      <p class="cmd">export VAULT_ADDR=http://localhost:8200</p>
      <p></p>
      <p class="comment"># Get new token for any user</p>
      <p class="cmd">vault write -field=token \\</p>
      <p class="cmd">  auth/userpass/login/api-developer \\</p>
      <p class="cmd">  password=demo-password-123</p>
    </div>
    <h2>Regenerate All Tokens</h2>
    <div class="code-block">
      <p class="cmd">./scripts/setup-demo-users.sh</p>
      <p class="cmd">cat scripts/demo-tokens.env</p>
    </div>
  </div>
  <div class="col">
    <h2>Demo Credentials</h2>
    <table>
      <tr><th>Username</th><th>Password</th></tr>
      <tr><td class="user">api-developer</td><td>demo-password-123</td></tr>
      <tr><td class="user">dba-admin</td><td>demo-password-123</td></tr>
      <tr><td class="user">security-analyst</td><td>demo-password-123</td></tr>
      <tr><td class="user">devops-engineer</td><td>demo-password-123</td></tr>
      <tr><td class="user">platform-engineer</td><td>demo-password-123</td></tr>
    </table>
  </div>
</div>
</body></html>`;

// Write all slides
const slides = [
  { name: 'slide01-title.html', content: slide1 },
  { name: 'slide02-challenge.html', content: slide2 },
  { name: 'slide03-solution.html', content: slide3 },
  { name: 'slide04-personas.html', content: slide4 },
  { name: 'slide05-policy.html', content: slide5 },
  { name: 'slide06-demo-api.html', content: slide6 },
  { name: 'slide07-demo-dba.html', content: slide7 },
  { name: 'slide08-demo-security.html', content: slide8 },
  { name: 'slide09-technical.html', content: slide9 },
  { name: 'slide10-security.html', content: slide10 },
  { name: 'slide11-audit.html', content: slide11 },
  { name: 'slide12-benefits.html', content: slide12 },
  { name: 'slide13-summary.html', content: slide13 },
  { name: 'slide14-reference.html', content: slide14 }
];

async function main() {
  // Write HTML files
  for (const slide of slides) {
    fs.writeFileSync(path.join(slidesDir, slide.name), slide.content);
    console.log(`Created ${slide.name}`);
  }

  // Create presentation
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.title = 'Vault AI - RBAC Demo';
  pptx.author = 'Vault AI Team';

  for (const slide of slides) {
    const htmlPath = path.join(slidesDir, slide.name);
    console.log(`Processing ${slide.name}...`);
    await html2pptx(htmlPath, pptx);
  }

  const outputPath = path.join(__dirname, '..', 'docs', 'Vault_AI_RBAC_Demo.pptx');
  await pptx.writeFile({ fileName: outputPath });
  console.log(`\nPresentation saved to: ${outputPath}`);
}

main().catch(console.error);
