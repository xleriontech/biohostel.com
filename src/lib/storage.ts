import { promises as fs } from "node:fs";
import path from "node:path";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// Capa de persistencia dual:
// - En Cloudflare Workers: D1 (tabla kv_store) + R2 (uploads)
// - En local (next dev): archivos JSON en .data/ + public/uploads/

type D1Binding = {
  prepare: (q: string) => {
    bind: (...args: unknown[]) => {
      first: <T>(col?: string) => Promise<T | null>;
      run: () => Promise<unknown>;
    };
  };
};

type R2Binding = {
  put: (key: string, value: Uint8Array, opts?: { httpMetadata?: { contentType?: string } }) => Promise<unknown>;
  get: (key: string) => Promise<{ body: ReadableStream; httpMetadata?: { contentType?: string } } | null>;
  delete: (key: string) => Promise<void>;
  list: (opts?: { prefix?: string }) => Promise<{ objects: { key: string }[] }>;
};

function cfEnv(): Record<string, unknown> {
  try {
    return (getCloudflareContext()?.env ?? {}) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function getD1(): D1Binding | null {
  const db = cfEnv().DB as D1Binding | undefined;
  return db && typeof db.prepare === "function" ? db : null;
}

function getBucket(): R2Binding | null {
  const b = cfEnv().UPLOADS as R2Binding | undefined;
  return b && typeof b.put === "function" ? b : null;
}

export function getEnvVar(key: string, fallback = ""): string {
  const v = cfEnv()[key];
  if (typeof v === "string" && v) return v;
  if (typeof process.env[key] === "string" && process.env[key]) return process.env[key] as string;
  return fallback;
}

const DIR = path.join(process.cwd(), ".data");
async function ensureDir() {
  await fs.mkdir(DIR, { recursive: true });
}

async function readLocal<T>(name: string, seed: () => T[]): Promise<T[]> {
  await ensureDir();
  const file = path.join(DIR, `${name}.json`);
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as T[];
  } catch {
    const initial = seed();
    await fs.writeFile(file, JSON.stringify(initial, null, 2));
    return initial;
  }
}

async function writeLocal<T>(name: string, rows: T[]): Promise<void> {
  await ensureDir();
  await fs.writeFile(path.join(DIR, `${name}.json`), JSON.stringify(rows, null, 2));
}

export async function readTable<T>(name: string, seed: () => T[]): Promise<T[]> {
  const db = getD1();
  if (db) {
    try {
      const row = await db.prepare("SELECT v FROM kv_store WHERE k = ?").bind(name).first<{ v: string }>("v");
      if (typeof row?.v === "string") return JSON.parse(row.v) as T[];
      const initial = seed();
      await db.prepare("INSERT OR REPLACE INTO kv_store (k, v) VALUES (?, ?)").bind(name, JSON.stringify(initial)).run();
      return initial;
    } catch {
      return readLocal(name, seed);
    }
  }
  return readLocal(name, seed);
}

export async function writeTable<T>(name: string, rows: T[]): Promise<void> {
  const db = getD1();
  if (db) {
    try {
      await db.prepare("INSERT OR REPLACE INTO kv_store (k, v) VALUES (?, ?)").bind(name, JSON.stringify(rows)).run();
      return;
    } catch {
      return writeLocal(name, rows);
    }
  }
  return writeLocal(name, rows);
}

export async function saveUpload(name: string, bytes: Uint8Array, mime: string): Promise<void> {
  const bucket = getBucket();
  if (bucket) {
    try {
      await bucket.put(`uploads/${name}`, bytes, { httpMetadata: { contentType: mime } });
      return;
    } catch {
      /* cae a local */
    }
  }
  await fs.mkdir(path.join(process.cwd(), "public", "uploads"), { recursive: true });
  await fs.writeFile(path.join(process.cwd(), "public", "uploads", name), bytes);
}

export async function readUpload(name: string): Promise<{ bytes: Uint8Array; mime: string } | null> {
  const bucket = getBucket();
  if (bucket) {
    try {
      const obj = await bucket.get(`uploads/${name}`);
      if (obj) {
        const buf = await new Response(obj.body).arrayBuffer();
        return { bytes: new Uint8Array(buf), mime: obj.httpMetadata?.contentType ?? "image/jpeg" };
      }
    } catch {
      /* cae a local */
    }
  }
  try {
    const bytes = new Uint8Array(await fs.readFile(path.join(process.cwd(), "public", "uploads", name)));
    return { bytes, mime: "image/jpeg" };
  } catch {
    return null;
  }
}

export async function deleteUpload(name: string): Promise<void> {
  const bucket = getBucket();
  if (bucket) {
    await bucket.delete(`uploads/${name}`).catch(() => null);
  }
  await fs.unlink(path.join(process.cwd(), "public", "uploads", name)).catch(() => null);
}

export async function listUploads(): Promise<string[]> {
  const bucket = getBucket();
  if (bucket) {
    try {
      const r = await bucket.list({ prefix: "uploads/" }).catch(() => ({ objects: [] }));
      if (r.objects.length) return r.objects.map((o) => `/api/files/${o.key.replace(/^uploads\//, "")}`);
    } catch {
      /* cae a local */
    }
  }
  const dir = path.join(process.cwd(), "public", "uploads");
  const files = await fs.readdir(dir).catch(() => [] as string[]);
  return files.filter((f) => /\.(png|jpe?g|gif|webp)$/i.test(f)).map((f) => `/api/files/${f}`);
}
