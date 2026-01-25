const pptxgen = require('pptxgenjs');
const path = require('path');

// Color palette - Vault/Security themed (no # prefix for pptxgenjs)
const colors = {
  primary: '7B61FF',
  primaryDark: '5B41DF',
  dark: '1C1C2E',
  darkAlt: '2D2D44',
  light: 'F8F7FC',
  white: 'FFFFFF',
  green: '10B981',
  red: 'EF4444',
  gray: '6B7280',
  grayLight: 'E5E7EB',
  text: '1F2937',
  textLight: '9CA3AF'
};

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_16x9';
pptx.title = 'Vault AI - RBAC Demo';
pptx.author = 'Vault AI Team';

// Slide 1: Title
let slide = pptx.addSlide();
slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: colors.dark } });
slide.addText('Vault AI', { x: 0.5, y: 2, w: 9, h: 1, fontSize: 54, color: colors.white, align: 'center', bold: true });
slide.addShape(pptx.shapes.RECTANGLE, { x: 4, y: 3.1, w: 2, h: 0.08, fill: { color: colors.primary } });
slide.addText('Enterprise Secrets Management', { x: 0.5, y: 3.4, w: 9, h: 0.6, fontSize: 28, color: colors.primary, align: 'center' });
slide.addText('Secure by Design: RBAC & Policy Enforcement', { x: 0.5, y: 4.1, w: 9, h: 0.5, fontSize: 18, color: colors.grayLight, align: 'center' });

// Slide 2: The Challenge
slide = pptx.addSlide();
slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: '100%', h: 0.9, fill: { color: colors.dark } });
slide.addText('The Challenge', { x: 0.5, y: 0.2, w: 9, h: 0.6, fontSize: 28, color: colors.white, bold: true });

slide.addText('Traditional Pain Points', { x: 0.5, y: 1.2, w: 4.5, h: 0.4, fontSize: 18, color: colors.dark, bold: true });
slide.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 1.6, w: 4.3, h: 0.04, fill: { color: colors.primary } });
slide.addText([
  { text: 'Engineers struggle to find secrets across complex hierarchies', options: { bullet: true } },
  { text: 'Manual navigation through nested paths is error-prone', options: { bullet: true } },
  { text: 'No natural language interface for common operations', options: { bullet: true } },
  { text: 'Context switching between tools slows productivity', options: { bullet: true } }
], { x: 0.5, y: 1.8, w: 4.5, h: 2.5, fontSize: 14, color: colors.text, valign: 'top' });

slide.addText('The Risk with AI + Secrets', { x: 5.2, y: 1.2, w: 4.5, h: 0.4, fontSize: 18, color: colors.dark, bold: true });
slide.addShape(pptx.shapes.RECTANGLE, { x: 5.2, y: 1.6, w: 4.3, h: 0.04, fill: { color: colors.primary } });
slide.addText([
  { text: 'AI assistants need guardrails', options: { bullet: true } },
  { text: 'Users might accidentally access unauthorized data', options: { bullet: true } },
  { text: 'Privilege escalation concerns', options: { bullet: true } }
], { x: 5.2, y: 1.8, w: 4.5, h: 1.5, fontSize: 14, color: colors.text, valign: 'top' });

slide.addShape(pptx.shapes.RECTANGLE, { x: 5.2, y: 3.5, w: 4.3, h: 0.8, fill: { color: colors.red }, rectRadius: 0.05 });
slide.addText('"AI should help users access secrets they\'re authorized to see—not bypass security controls"',
  { x: 5.3, y: 3.55, w: 4.1, h: 0.7, fontSize: 12, color: colors.white, italic: true, valign: 'middle' });

// Slide 3: Solution Architecture
slide = pptx.addSlide();
slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: '100%', h: 0.9, fill: { color: colors.dark } });
slide.addText('Vault AI Solution Architecture', { x: 0.5, y: 0.2, w: 9, h: 0.6, fontSize: 28, color: colors.white, bold: true });

// Architecture tiers
slide.addShape(pptx.shapes.RECTANGLE, { x: 1.5, y: 1.2, w: 7, h: 0.8, fill: { color: colors.light }, line: { color: colors.primary, width: 2 }, rectRadius: 0.1 });
slide.addText('Browser (React SPA)', { x: 1.5, y: 1.25, w: 7, h: 0.4, fontSize: 16, color: colors.dark, bold: true, align: 'center' });
slide.addText('User authenticates with Vault token stored in sessionStorage', { x: 1.5, y: 1.6, w: 7, h: 0.35, fontSize: 11, color: colors.gray, align: 'center' });

slide.addText('▼ Uses USER\'S token ▼', { x: 1.5, y: 2.05, w: 7, h: 0.35, fontSize: 12, color: colors.primary, align: 'center', bold: true });

slide.addShape(pptx.shapes.RECTANGLE, { x: 1.5, y: 2.4, w: 7, h: 0.8, fill: { color: colors.darkAlt }, rectRadius: 0.1 });
slide.addText('MCP Proxy + Claude AI', { x: 1.5, y: 2.45, w: 7, h: 0.4, fontSize: 16, color: colors.white, bold: true, align: 'center' });
slide.addText('Processes natural language → Vault API calls (passes through user token)', { x: 1.5, y: 2.8, w: 7, h: 0.35, fontSize: 11, color: colors.grayLight, align: 'center' });

slide.addText('▼ X-Vault-Token header ▼', { x: 1.5, y: 3.25, w: 7, h: 0.35, fontSize: 12, color: colors.primary, align: 'center', bold: true });

slide.addShape(pptx.shapes.RECTANGLE, { x: 1.5, y: 3.6, w: 7, h: 0.8, fill: { color: colors.dark }, rectRadius: 0.1 });
slide.addText('HashiCorp Vault Server', { x: 1.5, y: 3.65, w: 7, h: 0.4, fontSize: 16, color: colors.white, bold: true, align: 'center' });
slide.addText('Policy enforcement at API level: Allowed → Returns secret | Denied → 403', { x: 1.5, y: 4, w: 7, h: 0.35, fontSize: 11, color: colors.grayLight, align: 'center' });

slide.addShape(pptx.shapes.RECTANGLE, { x: 1.5, y: 4.6, w: 7, h: 0.55, fill: { color: colors.green }, rectRadius: 0.05 });
slide.addText('Key Insight: AI operations inherit the user\'s permissions—no privilege escalation possible',
  { x: 1.6, y: 4.65, w: 6.8, h: 0.45, fontSize: 13, color: colors.white, align: 'center', bold: true, valign: 'middle' });

// Slide 4: Demo Personas
slide = pptx.addSlide();
slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: '100%', h: 0.9, fill: { color: colors.dark } });
slide.addText('Demo Personas - Five Enterprise Roles', { x: 0.5, y: 0.2, w: 9, h: 0.6, fontSize: 28, color: colors.white, bold: true });

const tableData = [
  [{ text: 'Role', options: { fill: colors.primary, color: colors.white, bold: true } },
   { text: 'Team', options: { fill: colors.primary, color: colors.white, bold: true } },
   { text: 'Primary Access', options: { fill: colors.primary, color: colors.white, bold: true } },
   { text: 'Restricted From', options: { fill: colors.primary, color: colors.white, bold: true } }],
  ['api-developer', 'API Team', 'API Gateway, Third-party APIs', 'Database secrets, Infrastructure'],
  ['dba-admin', 'Database Team', 'All database credentials', 'API keys, Cloud infrastructure'],
  ['security-analyst', 'Security Team', 'Certificates, Audit (read-only)', 'Cannot modify anything'],
  ['devops-engineer', 'DevOps Team', 'Infrastructure, CI/CD', 'Payment systems'],
  ['platform-engineer', 'Platform Team', 'Shared configs, Notifications', 'Security secrets, Payments']
];

slide.addTable(tableData, {
  x: 0.4, y: 1.2, w: 9.2, h: 3.5,
  fontSize: 12,
  border: { pt: 0.5, color: colors.grayLight },
  colW: [2, 1.8, 2.8, 2.6],
  valign: 'middle'
});

// Slide 5: Policy Example
slide = pptx.addSlide();
slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: '100%', h: 0.9, fill: { color: colors.dark } });
slide.addText('Policy Example - API Developer', { x: 0.5, y: 0.2, w: 9, h: 0.6, fontSize: 28, color: colors.white, bold: true });

slide.addText('What They CAN Access', { x: 0.5, y: 1.15, w: 4.5, h: 0.4, fontSize: 16, color: colors.green, bold: true });
slide.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 1.5, w: 4.3, h: 0.04, fill: { color: colors.green } });

slide.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 1.65, w: 4.5, h: 2.8, fill: { color: colors.dark }, rectRadius: 0.05 });
slide.addText([
  { text: '# API Gateway - full access\n', options: { color: colors.gray } },
  { text: 'path ', options: { color: colors.primary } },
  { text: '"applications/data/api-gateway/*"\n', options: { color: colors.green } },
  { text: '  capabilities = ["create", "read",\n', options: { color: colors.grayLight } },
  { text: '    "update", "delete", "list"]\n\n', options: { color: colors.grayLight } },
  { text: '# Third-party APIs\n', options: { color: colors.gray } },
  { text: 'path ', options: { color: colors.primary } },
  { text: '"third-party/data/ai/*"\n', options: { color: colors.green } },
  { text: '  capabilities = ["read", "list"]', options: { color: colors.grayLight } }
], { x: 0.6, y: 1.75, w: 4.3, h: 2.6, fontSize: 10, fontFace: 'Courier New', valign: 'top' });

slide.addText('What They CANNOT Access', { x: 5.2, y: 1.15, w: 4.5, h: 0.4, fontSize: 16, color: colors.red, bold: true });
slide.addShape(pptx.shapes.RECTANGLE, { x: 5.2, y: 1.5, w: 4.3, h: 0.04, fill: { color: colors.red } });

slide.addShape(pptx.shapes.RECTANGLE, { x: 5.2, y: 1.65, w: 4.5, h: 2.8, fill: { color: colors.dark }, rectRadius: 0.05 });
slide.addText([
  { text: '# Explicit denial - database\n', options: { color: colors.gray } },
  { text: 'path ', options: { color: colors.primary } },
  { text: '"applications/data/*/database"\n', options: { color: colors.green } },
  { text: '  capabilities = ["deny"]\n\n', options: { color: colors.grayLight } },
  { text: '# No infrastructure access\n', options: { color: colors.gray } },
  { text: 'path ', options: { color: colors.primary } },
  { text: '"infrastructure/*"\n', options: { color: colors.green } },
  { text: '  capabilities = ["deny"]', options: { color: colors.grayLight } }
], { x: 5.3, y: 1.75, w: 4.3, h: 2.6, fontSize: 10, fontFace: 'Courier New', valign: 'top' });

// Helper function for demo slides
function addDemoSlide(persona, demos) {
  let slide = pptx.addSlide();
  slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: '100%', h: 0.9, fill: { color: colors.primary } });
  slide.addText('Live Demo', { x: 0.5, y: 0.2, w: 3, h: 0.6, fontSize: 26, color: colors.white, bold: true });
  slide.addShape(pptx.shapes.RECTANGLE, { x: 3.2, y: 0.25, w: 2, h: 0.45, fill: { color: colors.white }, rectRadius: 0.2 });
  slide.addText(persona, { x: 3.2, y: 0.25, w: 2, h: 0.45, fontSize: 14, color: colors.primary, align: 'center', valign: 'middle', bold: true });

  let yPos = 1.1;
  demos.forEach((demo, i) => {
    const statusColor = demo.allowed ? colors.green : colors.red;
    const statusText = demo.allowed ? 'ALLOWED' : 'DENIED';

    slide.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: yPos, w: 0.9, h: 0.28, fill: { color: statusColor }, rectRadius: 0.04 });
    slide.addText(statusText, { x: 0.5, y: yPos, w: 0.9, h: 0.28, fontSize: 9, color: colors.white, align: 'center', valign: 'middle', bold: true });
    slide.addText(demo.title, { x: 1.5, y: yPos - 0.02, w: 8, h: 0.32, fontSize: 14, color: colors.dark, bold: true });

    slide.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: yPos + 0.38, w: 9, h: 0.5, fill: { color: colors.light }, line: { color: colors.primary, width: 1, dashType: 'solid' }, rectRadius: 0.03 });
    slide.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: yPos + 0.38, w: 0.08, h: 0.5, fill: { color: colors.primary } });
    slide.addText(`"${demo.prompt}"`, { x: 0.7, y: yPos + 0.38, w: 8.7, h: 0.5, fontSize: 12, color: colors.text, italic: true, valign: 'middle' });

    slide.addText(`Expected: ${demo.expected}`, { x: 0.5, y: yPos + 0.95, w: 9, h: 0.25, fontSize: 10, color: colors.gray });

    yPos += 1.35;
  });

  return slide;
}

// Slide 6: Demo - API Developer
addDemoSlide('api-developer', [
  { title: 'Demo 1: Authorized Access', allowed: true, prompt: 'Show me the API Gateway OAuth configuration', expected: 'Returns OAuth client_id, client_secret, endpoints' },
  { title: 'Demo 2: Unauthorized Access', allowed: false, prompt: 'Show me the user-service production database password', expected: 'Permission denied error from Vault' },
  { title: 'Demo 3: Navigation Restriction', allowed: false, prompt: 'List all secrets in the infrastructure mount', expected: 'Only sees paths they have access to' }
]);

// Slide 7: Demo - DBA Admin
addDemoSlide('dba-admin', [
  { title: 'Demo 1: Database Access', allowed: true, prompt: 'Show me all database credentials across services', expected: 'Returns database secrets from user-service, payment-service, etc.' },
  { title: 'Demo 2: API Key Restriction', allowed: false, prompt: "What's the Stripe API key for production?", expected: "Permission denied - DBA doesn't need payment API keys" },
  { title: 'Demo 3: Infrastructure Boundary', allowed: false, prompt: 'Show me the AWS production credentials', expected: 'Permission denied - infrastructure secrets restricted' }
]);

// Slide 8: Demo - Security Analyst
addDemoSlide('security-analyst', [
  { title: 'Demo 1: Audit Access', allowed: true, prompt: 'List all TLS certificates and their expiry dates', expected: 'Returns certificate information (read-only)' },
  { title: 'Demo 2: Write Operation Blocked', allowed: false, prompt: 'Delete the expired Snyk API token', expected: 'Permission denied - analyst has read-only access' },
  { title: 'Demo 3: Cloud Credentials', allowed: false, prompt: 'Show me the AWS root credentials', expected: 'Permission denied - no cloud infrastructure access' }
]);

// Slide 9: Technical Deep Dive
slide = pptx.addSlide();
slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: '100%', h: 0.9, fill: { color: colors.dark } });
slide.addText('Technical Deep Dive - Authorization Flow', { x: 0.5, y: 0.2, w: 9, h: 0.6, fontSize: 28, color: colors.white, bold: true });

const steps = [
  { num: '1', text: 'User logs into Vault AI with their Vault token', detail: 'Token stored in browser sessionStorage only' },
  { num: '2', text: 'User sends natural language request', detail: '"Show me the production database password"' },
  { num: '3', text: 'MCP Proxy receives request with user\'s token', detail: 'Forwards token in X-Vault-Token header' },
  { num: '4', text: 'Claude determines which Vault API calls to make', detail: 'GET /v1/applications/data/user-service/prod/database' },
  { num: '5', text: 'Vault evaluates request against user\'s policies', detail: 'Policy check: Does token have \'read\' on this path?' },
  { num: '6', text: 'Vault returns result OR 403 Forbidden', detail: 'AI assistant relays result to user' }
];

let yPos = 1.1;
steps.forEach((step) => {
  slide.addShape(pptx.shapes.OVAL, { x: 0.5, y: yPos, w: 0.35, h: 0.35, fill: { color: colors.primary } });
  slide.addText(step.num, { x: 0.5, y: yPos, w: 0.35, h: 0.35, fontSize: 12, color: colors.white, align: 'center', valign: 'middle', bold: true });
  slide.addText(step.text, { x: 1, y: yPos - 0.02, w: 8.5, h: 0.35, fontSize: 13, color: colors.text });
  slide.addText(step.detail, { x: 1, y: yPos + 0.28, w: 8.5, h: 0.25, fontSize: 10, color: colors.gray, italic: true });
  yPos += 0.58;
});

slide.addShape(pptx.shapes.RECTANGLE, { x: 1, y: 4.7, w: 8, h: 0.45, fill: { color: colors.dark }, rectRadius: 0.05 });
slide.addText('No token elevation. No policy bypass. No exceptions.', { x: 1, y: 4.7, w: 8, h: 0.45, fontSize: 14, color: colors.white, align: 'center', valign: 'middle', bold: true });

// Slide 10: Security Architecture
slide = pptx.addSlide();
slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: '100%', h: 0.9, fill: { color: colors.dark } });
slide.addText('Security Architecture Principles', { x: 0.5, y: 0.2, w: 9, h: 0.6, fontSize: 28, color: colors.white, bold: true });

slide.addText('Defense in Depth', { x: 0.5, y: 1.15, w: 4.5, h: 0.4, fontSize: 18, color: colors.dark, bold: true });
slide.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 1.5, w: 4.3, h: 0.04, fill: { color: colors.primary } });

const layers = [
  { name: 'Browser Layer', desc: 'Token in sessionStorage only, cleared on close' },
  { name: 'Transport Layer', desc: 'HTTPS only, no token in URLs' },
  { name: 'MCP Proxy Layer', desc: 'Stateless, no token storage, pass-through only' },
  { name: 'Vault Layer', desc: 'Policy enforcement, audit logging, token TTL' }
];

yPos = 1.65;
layers.forEach((layer) => {
  slide.addText(layer.name, { x: 0.5, y: yPos, w: 4.5, h: 0.3, fontSize: 13, color: colors.primary, bold: true });
  slide.addText(layer.desc, { x: 0.5, y: yPos + 0.28, w: 4.5, h: 0.3, fontSize: 11, color: colors.text });
  yPos += 0.65;
});

slide.addText('What the AI Cannot Do', { x: 5.2, y: 1.15, w: 4.5, h: 0.4, fontSize: 18, color: colors.red, bold: true });
slide.addShape(pptx.shapes.RECTANGLE, { x: 5.2, y: 1.5, w: 4.3, h: 0.04, fill: { color: colors.red } });
slide.addText([
  { text: 'Access secrets outside user\'s policy', options: { bullet: true } },
  { text: 'Escalate privileges', options: { bullet: true } },
  { text: 'Store or exfiltrate tokens', options: { bullet: true } },
  { text: 'Bypass Vault\'s audit logging', options: { bullet: true } },
  { text: 'Access other users\' sessions', options: { bullet: true } }
], { x: 5.2, y: 1.65, w: 4.5, h: 2.5, fontSize: 13, color: colors.text, valign: 'top' });

// Slide 11: Audit & Compliance
slide = pptx.addSlide();
slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: '100%', h: 0.9, fill: { color: colors.dark } });
slide.addText('Audit & Compliance', { x: 0.5, y: 0.2, w: 9, h: 0.6, fontSize: 28, color: colors.white, bold: true });

slide.addText('Every AI Operation is Logged', { x: 0.5, y: 1.15, w: 5, h: 0.4, fontSize: 16, color: colors.dark, bold: true });

slide.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 1.5, w: 5, h: 3.2, fill: { color: colors.dark }, rectRadius: 0.05 });
slide.addText([
  { text: '{\n', options: { color: colors.grayLight } },
  { text: '  "type": ', options: { color: colors.primary } },
  { text: '"request",\n', options: { color: colors.green } },
  { text: '  "auth": {\n', options: { color: colors.primary } },
  { text: '    "policies": ', options: { color: colors.primary } },
  { text: '["api-developer"],\n', options: { color: colors.green } },
  { text: '    "metadata": {\n', options: { color: colors.primary } },
  { text: '      "username": ', options: { color: colors.primary } },
  { text: '"api-developer"\n', options: { color: colors.green } },
  { text: '    }\n  },\n', options: { color: colors.grayLight } },
  { text: '  "request": {\n', options: { color: colors.primary } },
  { text: '    "path": ', options: { color: colors.primary } },
  { text: '"applications/...",\n', options: { color: colors.green } },
  { text: '    "operation": ', options: { color: colors.primary } },
  { text: '"read"\n', options: { color: colors.green } },
  { text: '  },\n', options: { color: colors.grayLight } },
  { text: '  "response": { "status": 403 }\n', options: { color: colors.red } },
  { text: '}', options: { color: colors.grayLight } }
], { x: 0.6, y: 1.6, w: 4.8, h: 3, fontSize: 10, fontFace: 'Courier New', valign: 'top' });

slide.addText('Complete Traceability', { x: 5.8, y: 1.15, w: 4, h: 0.4, fontSize: 16, color: colors.dark, bold: true });
slide.addText([
  { text: 'Who accessed what', options: { bullet: true } },
  { text: 'When they accessed it', options: { bullet: true } },
  { text: 'Whether it succeeded or failed', options: { bullet: true } },
  { text: 'Which policy was applied', options: { bullet: true } },
  { text: 'Full request/response details', options: { bullet: true } }
], { x: 5.8, y: 1.6, w: 4, h: 2, fontSize: 13, color: colors.text, valign: 'top' });

slide.addShape(pptx.shapes.RECTANGLE, { x: 5.8, y: 3.8, w: 3.8, h: 0.5, fill: { color: colors.green }, rectRadius: 0.05 });
slide.addText('Same audit trail as direct API access', { x: 5.8, y: 3.8, w: 3.8, h: 0.5, fontSize: 12, color: colors.white, align: 'center', valign: 'middle', bold: true });

// Slide 12: Enterprise Benefits
slide = pptx.addSlide();
slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: '100%', h: 0.9, fill: { color: colors.dark } });
slide.addText('Enterprise Benefits', { x: 0.5, y: 0.2, w: 9, h: 0.6, fontSize: 28, color: colors.white, bold: true });

const benefits = [
  { title: 'For Security Teams', items: ['AI doesn\'t bypass existing Vault policies', 'Same audit trail as direct API access', 'No new attack surface introduced', 'Existing security controls respected'] },
  { title: 'For Development Teams', items: ['Natural language access to authorized secrets', 'Faster onboarding - ask instead of navigate', 'Reduced friction while maintaining security', 'Context-aware assistance'] },
  { title: 'For Compliance', items: ['Role-based access control enforced', 'Audit logs capture all AI operations', 'Token TTL limits exposure window', 'Full traceability for auditors'] }
];

let xPos = 0.4;
benefits.forEach((benefit) => {
  slide.addShape(pptx.shapes.RECTANGLE, { x: xPos, y: 1.1, w: 3.1, h: 3.6, fill: { color: colors.light }, rectRadius: 0.1 });
  slide.addShape(pptx.shapes.RECTANGLE, { x: xPos, y: 1.1, w: 3.1, h: 0.08, fill: { color: colors.primary } });
  slide.addText(benefit.title, { x: xPos + 0.15, y: 1.25, w: 2.8, h: 0.4, fontSize: 14, color: colors.primary, bold: true });

  let bulletText = benefit.items.map(item => ({ text: item, options: { bullet: true } }));
  slide.addText(bulletText, { x: xPos + 0.15, y: 1.7, w: 2.8, h: 2.8, fontSize: 11, color: colors.text, valign: 'top' });

  xPos += 3.2;
});

// Slide 13: Summary
slide = pptx.addSlide();
slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: colors.dark } });

slide.addText('Summary', { x: 0.5, y: 0.5, w: 9, h: 0.7, fontSize: 32, color: colors.white, bold: true });
slide.addText('Vault AI: Secure AI-Assisted Secrets Management', { x: 0.5, y: 1.1, w: 9, h: 0.5, fontSize: 18, color: colors.primary });

const features = [
  'Natural Language Interface - Ask for secrets in plain English',
  'Policy Enforcement - AI inherits user\'s exact permissions',
  'No Privilege Escalation - Token-based auth, no shortcuts',
  'Full Audit Trail - Every operation logged in Vault',
  'Session Isolation - Tokens scoped to browser session',
  'Enterprise Ready - Built for production environments'
];

yPos = 1.8;
features.forEach((feature) => {
  slide.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: yPos, w: 4.4, h: 0.5, fill: { color: colors.darkAlt }, rectRadius: 0.08 });
  slide.addText('✓', { x: 0.6, y: yPos, w: 0.4, h: 0.5, fontSize: 16, color: colors.green, valign: 'middle' });
  slide.addText(feature, { x: 1, y: yPos, w: 3.8, h: 0.5, fontSize: 11, color: colors.white, valign: 'middle' });

  if (yPos < 3.5) {
    slide.addShape(pptx.shapes.RECTANGLE, { x: 5.1, y: yPos, w: 4.4, h: 0.5, fill: { color: colors.darkAlt }, rectRadius: 0.08 });
    slide.addText('✓', { x: 5.2, y: yPos, w: 0.4, h: 0.5, fontSize: 16, color: colors.green, valign: 'middle' });
    slide.addText(features[features.indexOf(feature) + 3] || '', { x: 5.6, y: yPos, w: 3.8, h: 0.5, fontSize: 11, color: colors.white, valign: 'middle' });
  }

  yPos += 0.6;
  if (yPos > 2.8) yPos = 10; // Exit after 3 rows
});

// Slide 14: Quick Reference
slide = pptx.addSlide();
slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: '100%', h: 0.9, fill: { color: colors.primary } });
slide.addText('Quick Reference - Token Regeneration', { x: 0.5, y: 0.2, w: 9, h: 0.6, fontSize: 26, color: colors.white, bold: true });

slide.addText('Regenerate Single Token', { x: 0.5, y: 1.1, w: 4.5, h: 0.35, fontSize: 14, color: colors.dark, bold: true });
slide.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 1.45, w: 4.3, h: 0.04, fill: { color: colors.primary } });

slide.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 1.55, w: 4.5, h: 1.4, fill: { color: colors.dark }, rectRadius: 0.05 });
slide.addText([
  { text: '# Set Vault address\n', options: { color: colors.gray } },
  { text: 'export VAULT_ADDR=http://localhost:8200\n\n', options: { color: colors.green } },
  { text: '# Get new token\n', options: { color: colors.gray } },
  { text: 'vault write -field=token \\\n', options: { color: colors.green } },
  { text: '  auth/userpass/login/api-developer \\\n', options: { color: colors.green } },
  { text: '  password=demo-password-123', options: { color: colors.green } }
], { x: 0.6, y: 1.6, w: 4.3, h: 1.3, fontSize: 9, fontFace: 'Courier New', valign: 'top' });

slide.addText('Regenerate All Tokens', { x: 0.5, y: 3.1, w: 4.5, h: 0.35, fontSize: 14, color: colors.dark, bold: true });
slide.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 3.45, w: 4.3, h: 0.04, fill: { color: colors.primary } });

slide.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 3.55, w: 4.5, h: 0.7, fill: { color: colors.dark }, rectRadius: 0.05 });
slide.addText([
  { text: './scripts/setup-demo-users.sh\n', options: { color: colors.green } },
  { text: 'cat scripts/demo-tokens.env', options: { color: colors.green } }
], { x: 0.6, y: 3.6, w: 4.3, h: 0.6, fontSize: 10, fontFace: 'Courier New', valign: 'top' });

slide.addText('Demo Credentials', { x: 5.2, y: 1.1, w: 4.5, h: 0.35, fontSize: 14, color: colors.dark, bold: true });
slide.addShape(pptx.shapes.RECTANGLE, { x: 5.2, y: 1.45, w: 4.3, h: 0.04, fill: { color: colors.primary } });

const credTable = [
  [{ text: 'Username', options: { fill: colors.dark, color: colors.white, bold: true } },
   { text: 'Password', options: { fill: colors.dark, color: colors.white, bold: true } }],
  [{ text: 'api-developer', options: { color: colors.primary, bold: true } }, 'demo-password-123'],
  [{ text: 'dba-admin', options: { color: colors.primary, bold: true } }, 'demo-password-123'],
  [{ text: 'security-analyst', options: { color: colors.primary, bold: true } }, 'demo-password-123'],
  [{ text: 'devops-engineer', options: { color: colors.primary, bold: true } }, 'demo-password-123'],
  [{ text: 'platform-engineer', options: { color: colors.primary, bold: true } }, 'demo-password-123']
];

slide.addTable(credTable, {
  x: 5.2, y: 1.55, w: 4.3, h: 2.5,
  fontSize: 10,
  border: { pt: 0.5, color: colors.grayLight },
  colW: [2, 2.3],
  valign: 'middle'
});

// Save
const outputPath = path.join(__dirname, '..', 'docs', 'Vault_AI_RBAC_Demo.pptx');
pptx.writeFile({ fileName: outputPath })
  .then(() => console.log(`Presentation saved to: ${outputPath}`))
  .catch(err => console.error(err));
