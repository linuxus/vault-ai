/**
 * TLS configuration for outbound connections to Vault (and the optional
 * vault-mcp-server). Node's global `fetch` (undici) ignores the classic
 * `https.Agent`, so to trust a private/self-signed CA — or to skip
 * verification in dev — we build an undici `Agent` (a Dispatcher) and pass it
 * per-request. Scoping it per-request (rather than `setGlobalDispatcher`)
 * keeps these settings off unrelated calls such as the Anthropic API.
 *
 * Honoured environment variables (named to match the Vault CLI):
 *   VAULT_CACERT          Path to a PEM CA bundle that signed Vault's cert
 *   VAULT_CAPATH          Path to a directory of PEM CA files
 *   VAULT_CLIENT_CERT     Path to a client certificate (mTLS, optional)
 *   VAULT_CLIENT_KEY      Path to the client certificate key (mTLS, optional)
 *   VAULT_TLS_SERVER_NAME Override the SNI / certificate hostname (optional)
 *   VAULT_SKIP_VERIFY     "true"/"1" to disable verification (DEV ONLY)
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { Agent, type Dispatcher } from 'undici';

/** `fetch` init widened with the undici-only `dispatcher` option. */
type UndiciRequestInit = RequestInit & { dispatcher?: Dispatcher };

function isTruthy(value: string | undefined): boolean {
  if (!value) return false;
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

/** Read a file, rethrowing with the env var name so misconfig is obvious. */
function readOrExplain(path: string, envName: string): Buffer {
  try {
    return readFileSync(path);
  } catch (e) {
    throw new Error(`Failed to read ${envName} at "${path}": ${(e as Error).message}`);
  }
}

function readCaBundle(): Buffer[] | undefined {
  const bundles: Buffer[] = [];

  const caCert = process.env.VAULT_CACERT?.trim();
  if (caCert) {
    bundles.push(readOrExplain(caCert, 'VAULT_CACERT'));
  }

  const caPath = process.env.VAULT_CAPATH?.trim();
  if (caPath) {
    let entries: string[];
    try {
      entries = readdirSync(caPath);
    } catch (e) {
      throw new Error(`Failed to read VAULT_CAPATH directory "${caPath}": ${(e as Error).message}`);
    }
    for (const entry of entries) {
      const full = join(caPath, entry);
      if (statSync(full).isFile()) {
        bundles.push(readOrExplain(full, 'VAULT_CAPATH'));
      }
    }
  }

  return bundles.length > 0 ? bundles : undefined;
}

function readClientCert(): { cert: Buffer; key: Buffer } | undefined {
  const certPath = process.env.VAULT_CLIENT_CERT?.trim();
  const keyPath = process.env.VAULT_CLIENT_KEY?.trim();
  if (certPath && keyPath) {
    return {
      cert: readOrExplain(certPath, 'VAULT_CLIENT_CERT'),
      key: readOrExplain(keyPath, 'VAULT_CLIENT_KEY'),
    };
  }
  if (certPath || keyPath) {
    // Half-configured mTLS would otherwise be silently dropped and surface as a
    // confusing handshake/permission error later.
    console.warn(
      '[tls] VAULT_CLIENT_CERT and VAULT_CLIENT_KEY must both be set for mutual TLS — client certificate not configured.'
    );
  }
  return undefined;
}

/**
 * Build the undici connect options from the TLS env vars. Returns `undefined`
 * when no custom TLS configuration is requested, so callers fall back to
 * Node's default trust store with verification enabled.
 */
function buildConnectOptions(): Record<string, unknown> | undefined {
  const skipVerify = isTruthy(process.env.VAULT_SKIP_VERIFY);
  const ca = readCaBundle();
  const clientCert = readClientCert();
  const servername = process.env.VAULT_TLS_SERVER_NAME?.trim() || undefined;

  if (!skipVerify && !ca && !clientCert && !servername) {
    return undefined;
  }

  const connect: Record<string, unknown> = {};
  if (skipVerify) {
    connect.rejectUnauthorized = false;
  }
  if (ca) {
    connect.ca = ca;
  }
  if (clientCert) {
    connect.cert = clientCert.cert;
    connect.key = clientCert.key;
  }
  if (servername) {
    connect.servername = servername;
  }
  return connect;
}

let cachedDispatcher: Dispatcher | undefined;
let initialised = false;

/**
 * Return a shared undici dispatcher configured from the TLS env vars, or
 * `undefined` when no custom TLS handling is needed (plain HTTP, or HTTPS with
 * a publicly trusted cert). The result is cached for the process lifetime.
 */
export function getVaultDispatcher(): Dispatcher | undefined {
  if (initialised) return cachedDispatcher;
  initialised = true;

  const connect = buildConnectOptions();
  if (!connect) {
    cachedDispatcher = undefined;
    return undefined;
  }

  if (connect.rejectUnauthorized === false) {
    console.warn(
      '[tls] VAULT_SKIP_VERIFY is enabled — TLS certificate verification is DISABLED. Use only in development.'
    );
  } else if (connect.ca) {
    console.log('[tls] Loaded custom CA bundle for Vault TLS verification.');
  }

  cachedDispatcher = new Agent({ connect });
  return cachedDispatcher;
}

/**
 * `fetch` wrapper that applies the Vault TLS dispatcher when one is configured.
 * Behaves exactly like global `fetch` otherwise.
 */
export function vaultFetch(
  input: string | URL,
  init: RequestInit = {}
): Promise<Response> {
  const dispatcher = getVaultDispatcher();
  if (!dispatcher) {
    return fetch(input, init);
  }
  // `dispatcher` is a valid undici fetch option but absent from the DOM
  // RequestInit type, so widen the init object for the call.
  const withDispatcher: UndiciRequestInit = { ...init, dispatcher };
  return fetch(input, withDispatcher as RequestInit);
}

/**
 * Eagerly resolve the TLS configuration at process startup so that a bad
 * VAULT_CACERT / VAULT_CAPATH / client-cert path fails fast and loudly,
 * instead of throwing lazily on the first Vault request (where it would be
 * swallowed and look like "Vault is unreachable"). Safe to call once at boot.
 */
export function initVaultTls(): void {
  getVaultDispatcher();
}
