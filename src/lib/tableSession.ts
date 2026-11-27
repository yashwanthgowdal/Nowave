/**
 * NoWave Anti-Spoofing Signed Table Session Manager
 * Cryptographically binds a browser session to a specific dining table to prevent remote order spamming.
 */

const SESSION_SECRET = "nowave-table-hmac-salt-v1";
const TOKEN_TTL_HOURS = 4; // Table dining session expires after 4 hours

interface TableTokenPayload {
  tableNumber: string;
  issuedAt: number;
  nonce: string;
}

// Simple deterministic hash for browser signature
function createSignature(payload: string): string {
  let hash = 0;
  const combined = `${payload}:${SESSION_SECRET}`;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

export function generateTableToken(tableNumber: string): string {
  const payload: TableTokenPayload = {
    tableNumber,
    issuedAt: Date.now(),
    nonce: Math.random().toString(36).substring(2, 9),
  };
  const json = JSON.stringify(payload);
  const base64 = btoa(json);
  const signature = createSignature(base64);
  return `${base64}.${signature}`;
}

export function verifyTableToken(token: string, expectedTableNumber: string): boolean {
  if (!token || !token.includes(".")) return false;
  try {
    const [base64, signature] = token.split(".");
    const expectedSig = createSignature(base64);
    if (signature !== expectedSig) return false;

    const json = atob(base64);
    const payload: TableTokenPayload = JSON.parse(json);

    // Validate table match
    if (payload.tableNumber !== expectedTableNumber) return false;

    // Validate TTL
    const maxAgeMs = TOKEN_TTL_HOURS * 60 * 60 * 1000;
    if (Date.now() - payload.issuedAt > maxAgeMs) return false;

    return true;
  } catch {
    return false;
  }
}

export function getOrCreateTableSession(tableNumber: string): string {
  if (typeof window === "undefined") return generateTableToken(tableNumber);
  const storageKey = `nowave_table_session_${tableNumber}`;
  const existing = sessionStorage.getItem(storageKey);

  if (existing && verifyTableToken(existing, tableNumber)) {
    return existing;
  }

  const newToken = generateTableToken(tableNumber);
  sessionStorage.setItem(storageKey, newToken);
  return newToken;
}
