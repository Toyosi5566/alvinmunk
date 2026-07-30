/**
 * /api/push/subscribe — store or remove a push subscription.
 *
 * POST  { subscription: PushSubscriptionJSON, walletAddress: string, vouchId: number }
 *   → Upserts a subscription record keyed by endpoint.
 *   → Adds `vouchId` to the set of vouch IDs the voucher wants notified about.
 *
 * DELETE { endpoint: string }
 *   → Removes the subscription record.
 *
 * Storage strategy (order of preference):
 *   1. Vercel KV (if @vercel/kv is installed and KV_REST_API_URL is set)
 *   2. In-memory Map (single serverless instance — fine for testnet demos; subscriptions
 *      survive as long as the function warm instance lives)
 *
 * The in-memory fallback is intentional for environments without KV configured. It means
 * subscriptions are lost on cold-start but avoids a hard dependency. Switch to KV by
 * setting KV_REST_API_URL + KV_REST_API_TOKEN in the Vercel dashboard.
 */

import { NextRequest, NextResponse } from 'next/server';

// ─── Storage abstraction ─────────────────────────────────────────────────────

export interface StoredSubscription {
  endpoint: string;
  subscription: PushSubscriptionJSON;
  walletAddress: string;
  /** All vouch IDs this device should receive notifications for. */
  vouchIds: number[];
  updatedAt: number;
}

/** Attempt to load Vercel KV at runtime — falls back to in-memory if unavailable. */
async function getKv(): Promise<{
  get: (key: string) => Promise<StoredSubscription | null>;
  set: (key: string, value: StoredSubscription) => Promise<void>;
  del: (key: string) => Promise<void>;
  smembers: (key: string) => Promise<string[]>;
  sadd: (key: string, member: string) => Promise<void>;
} | null> {
  try {
    if (!process.env.KV_REST_API_URL) return null;
    // Use a variable to prevent tsc from trying to resolve @vercel/kv statically.
    // If the package is installed this resolves at runtime; otherwise the .catch returns null.
    const specifier = '@vercel/kv';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const kvModule: any = await import(/* webpackIgnore: true */ specifier).catch(() => null);
    if (!kvModule) return null;
    const kv = kvModule.kv;
    return {
      get: (key: string) => kv.get(key) as Promise<StoredSubscription | null>,
      set: (key: string, value: StoredSubscription) => kv.set(key, value) as Promise<void>,
      del: (key: string) => kv.del(key) as Promise<void>,
      smembers: (key: string) => kv.smembers(key) as Promise<string[]>,
      sadd: (key: string, member: string) => kv.sadd(key, member) as Promise<void>,
    };
  } catch {
    return null;
  }
}

// In-memory fallback — module-level Map that survives within a single warm instance.
const memStore = new Map<string, StoredSubscription>();
/** wallet → Set of endpoints */
const walletIndex = new Map<string, Set<string>>();

function memGet(key: string): StoredSubscription | null {
  return memStore.get(key) ?? null;
}
function memSet(key: string, value: StoredSubscription): void {
  memStore.set(key, value);
  const wallet = value.walletAddress.toLowerCase();
  if (!walletIndex.has(wallet)) walletIndex.set(wallet, new Set());
  walletIndex.get(wallet)!.add(key);
}
function memDel(key: string): void {
  const existing = memStore.get(key);
  if (existing) {
    const wallet = existing.walletAddress.toLowerCase();
    walletIndex.get(wallet)?.delete(key);
  }
  memStore.delete(key);
}

// ─── Exported helper used by /api/push/notify ────────────────────────────────

/**
 * Retrieve all subscriptions for a wallet address.
 * Exported so /api/push/notify can call it within the same module scope.
 */
export async function getSubscriptionsForWallet(walletAddress: string): Promise<StoredSubscription[]> {
  const kv = await getKv();
  const wallet = walletAddress.toLowerCase();

  if (kv) {
    // With real KV we maintain a set of endpoints under `wallet:<addr>`.
    const endpoints = await kv.smembers(`wallet:${wallet}`).catch(() => [] as string[]);
    const subs = await Promise.all(
      endpoints.map((ep) => kv.get(`sub:${ep}`).catch(() => null)),
    );
    return subs.filter(Boolean) as StoredSubscription[];
  } else {
    const endpoints = walletIndex.get(wallet) ?? new Set<string>();
    return [...endpoints].map((ep) => memGet(`sub:${ep}`)).filter(Boolean) as StoredSubscription[];
  }
}

// ─── Route handlers ──────────────────────────────────────────────────────────

const MAX_BODY = 4096;

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Reject oversized bodies.
  const contentLength = Number(req.headers.get('content-length') ?? 0);
  if (contentLength > MAX_BODY) {
    return NextResponse.json({ error: 'body too large' }, { status: 413 });
  }

  let body: { subscription?: PushSubscriptionJSON; walletAddress?: string; vouchId?: number };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const { subscription, walletAddress, vouchId } = body;

  if (
    !subscription ||
    typeof subscription.endpoint !== 'string' ||
    !subscription.endpoint.startsWith('https://') ||
    !walletAddress ||
    typeof walletAddress !== 'string' ||
    typeof vouchId !== 'number'
  ) {
    return NextResponse.json({ error: 'missing or invalid fields' }, { status: 422 });
  }

  // Sanitize: cap endpoint length to avoid KV key blowup.
  const endpoint = subscription.endpoint.slice(0, 512);
  const key = `sub:${endpoint}`;
  const wallet = walletAddress.toLowerCase();

  const kv = await getKv();

  if (kv) {
    const existing = await kv.get(key);
    const vouchIds = Array.from(new Set([...(existing?.vouchIds ?? []), vouchId]));
    await kv.set(key, {
      endpoint,
      subscription,
      walletAddress: wallet,
      vouchIds,
      updatedAt: Date.now(),
    });
    // Maintain wallet → endpoint index.
    await kv.sadd(`wallet:${wallet}`, endpoint);
  } else {
    const existing = memGet(key);
    const vouchIds = Array.from(new Set([...(existing?.vouchIds ?? []), vouchId]));
    memSet(key, {
      endpoint,
      subscription,
      walletAddress: wallet,
      vouchIds,
      updatedAt: Date.now(),
    });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  let body: { endpoint?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  if (!body.endpoint || typeof body.endpoint !== 'string') {
    return NextResponse.json({ error: 'endpoint required' }, { status: 422 });
  }

  const endpoint = body.endpoint.slice(0, 512);
  const key = `sub:${endpoint}`;
  const kv = await getKv();

  if (kv) {
    await kv.del(key);
  } else {
    memDel(key);
  }

  return NextResponse.json({ ok: true });
}
