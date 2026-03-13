import * as SecureStore from 'expo-secure-store';

const SECURE_KEY = 'lifearc_time_verification';

// ── Stored verification record ─────────────────────────────────────────────────

interface StoredVerification {
  server_time: string;  // ISO — skutečný ověřený čas serveru
  system_time: string;  // ISO — lokální systémový čas v momentě ověření
  source: string;       // název serveru
}

// ── Public result type ─────────────────────────────────────────────────────────

export interface TimeCheckResult {
  allowed: boolean;
  online: boolean;
  source?: string;
  offlineFallback: boolean;
  offlineDriftHours?: number;
  verifiedTime?: Date;
  blockedReason?:
    | 'not_yet'           // čas ještě nenastal
    | 'offline_expired'   // offline příliš dlouho (přesáhlo toleranci)
    | 'no_verification'   // nikdy neproběhlo ověření + jsme offline
    | 'clock_went_back';  // systémové hodiny šly dozadu — podezřelé
}

// ── Helpers ────────────────────────────────────────────────────────────────────

async function fetchWithTimeout(
  url: string,
  timeoutMs: number,
  method = 'GET'
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { method, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// Vrátí první non-null výsledek z pole slibů, nebo null pokud vše selže.
function firstSuccess<T>(
  promises: Array<Promise<T | null>>
): Promise<T | null> {
  return new Promise((resolve) => {
    let pending = promises.length;
    let resolved = false;
    if (pending === 0) { resolve(null); return; }
    for (const p of promises) {
      p.then((val) => {
        if (!resolved && val !== null) {
          resolved = true;
          resolve(val);
        }
      })
        .catch(() => {})
        .finally(() => {
          pending--;
          if (pending === 0 && !resolved) resolve(null);
        });
    }
  });
}

// ── Time server fetchers ───────────────────────────────────────────────────────

async function tryWorldTimeApi(): Promise<{ time: Date; source: string } | null> {
  try {
    const r = await fetchWithTimeout('https://worldtimeapi.org/api/ip', 5000);
    if (!r.ok) return null;
    const d = await r.json();
    const t = new Date(d.datetime);
    if (isNaN(t.getTime())) return null;
    return { time: t, source: 'worldtimeapi.org' };
  } catch {
    return null;
  }
}

async function tryCloudflare(): Promise<{ time: Date; source: string } | null> {
  try {
    const r = await fetchWithTimeout('https://time.cloudflare.com/cdn-cgi/trace', 5000);
    if (!r.ok) return null;
    const text = await r.text();
    const match = text.match(/ts=(\d+(?:\.\d+)?)/);
    if (!match) return null;
    const t = new Date(parseFloat(match[1]) * 1000);
    if (isNaN(t.getTime())) return null;
    return { time: t, source: 'cloudflare' };
  } catch {
    return null;
  }
}

async function tryGoogle(): Promise<{ time: Date; source: string } | null> {
  try {
    const r = await fetchWithTimeout('https://www.google.com', 5000, 'HEAD');
    const dateHeader = r.headers.get('Date') ?? r.headers.get('date');
    if (!dateHeader) return null;
    const t = new Date(dateHeader);
    if (isNaN(t.getTime())) return null;
    return { time: t, source: 'google.com' };
  } catch {
    return null;
  }
}

async function tryTimeApiIo(): Promise<{ time: Date; source: string } | null> {
  try {
    const r = await fetchWithTimeout(
      'https://timeapi.io/api/time/current/zone?timeZone=UTC',
      5000
    );
    if (!r.ok) return null;
    const d = await r.json();
    const iso: string = d.dateTime ?? '';
    const t = new Date(iso.endsWith('Z') ? iso : iso + 'Z');
    if (isNaN(t.getTime())) return null;
    return { time: t, source: 'timeapi.io' };
  } catch {
    return null;
  }
}

// ── Core: get verified time from any server ────────────────────────────────────

export async function getVerifiedTime(): Promise<{ time: Date; source: string } | null> {
  return firstSuccess([
    tryWorldTimeApi(),
    tryCloudflare(),
    tryGoogle(),
    tryTimeApiIo(),
  ]);
}

// ── Persistence ────────────────────────────────────────────────────────────────

export async function saveVerification(serverTime: Date, source: string): Promise<void> {
  const stored: StoredVerification = {
    server_time: serverTime.toISOString(),
    system_time: new Date().toISOString(),
    source,
  };
  try {
    await SecureStore.setItemAsync(SECURE_KEY, JSON.stringify(stored));
  } catch {
    // SecureStore selhání je nekritické — pokračujeme
  }
}

async function loadVerification(): Promise<StoredVerification | null> {
  try {
    const raw = await SecureStore.getItemAsync(SECURE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredVerification;
  } catch {
    return null;
  }
}

// ── Main check ─────────────────────────────────────────────────────────────────
//
// offlineTolerance: počet hodin po které smíme věřit systémovým hodinám bez
//                  nového online ověření. null = vždy požaduj online.
//
// Offline výpočet:
//   systemElapsed = systémový čas nyní − systémový čas při ověření
//   estimatedRealTime = serverTime (z ověření) + systemElapsed
//   → manipulace hodin dopředu zvýší elapsed, ale estimatedRealTime
//     stále musí dosáhnout unlock_date
//   → pokud elapsed > tolerance → zamítnuto, příliš dlouho offline

export async function isUnlockTimeReached(
  unlockDateIso: string,
  offlineTolerance: number | null
): Promise<TimeCheckResult> {
  const unlockDate = new Date(unlockDateIso);
  const systemNow = new Date();

  // 1. Zkus online servery ────────────────────────────────────────────────────
  const verified = await getVerifiedTime();

  if (verified !== null) {
    await saveVerification(verified.time, verified.source);
    const allowed = verified.time >= unlockDate;
    return {
      allowed,
      online: true,
      source: verified.source,
      offlineFallback: false,
      verifiedTime: verified.time,
      blockedReason: allowed ? undefined : 'not_yet',
    };
  }

  // 2. Všechny servery selhaly — zkus offline fallback ───────────────────────
  if (offlineTolerance === null) {
    return {
      allowed: false,
      online: false,
      offlineFallback: false,
      blockedReason: 'no_verification',
    };
  }

  const stored = await loadVerification();
  if (!stored) {
    return {
      allowed: false,
      online: false,
      offlineFallback: false,
      blockedReason: 'no_verification',
    };
  }

  const storedSystemTime = new Date(stored.system_time);
  const storedServerTime = new Date(stored.server_time);
  const systemElapsedMs = systemNow.getTime() - storedSystemTime.getTime();

  // Hodiny šly dozadu → podezřelá manipulace
  if (systemElapsedMs < 0) {
    return {
      allowed: false,
      online: false,
      offlineFallback: true,
      blockedReason: 'clock_went_back',
    };
  }

  const toleranceMs = offlineTolerance * 60 * 60 * 1000;
  const driftHours = systemElapsedMs / 3600000;

  // Přesáhli jsme offline toleranci
  if (systemElapsedMs > toleranceMs) {
    return {
      allowed: false,
      online: false,
      offlineFallback: true,
      offlineDriftHours: driftHours,
      blockedReason: 'offline_expired',
      source: stored.source,
    };
  }

  // Odhadni skutečný čas = serverTime + uplynulý systémový čas
  const estimatedRealTime = new Date(storedServerTime.getTime() + systemElapsedMs);
  const allowed = estimatedRealTime >= unlockDate;

  return {
    allowed,
    online: false,
    source: stored.source,
    offlineFallback: true,
    offlineDriftHours: driftHours,
    verifiedTime: estimatedRealTime,
    blockedReason: allowed ? undefined : 'not_yet',
  };
}
