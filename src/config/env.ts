import "dotenv/config";
import { getAddress, type Address } from "viem";

/** CHAINS=1,10,42161 -> [1,10,42161] */
export function parseChains(envName = "CHAINS"): number[] {
  const raw = process.env[envName] ?? "";
  const ids = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => Number(s));
  if (!ids.length || ids.some((n) => !Number.isInteger(n))) {
    throw new Error(`Invalid or empty ${envName}. Example: CHAINS=1,10,42161`);
  }
  return ids;
}

function must(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

/** Build a map<number,string> from RPC_{id} vars */
export function buildRpcMap(chains: number[]): Record<number, string> {
  const out: Record<number, string> = {};
  for (const id of chains) {
    const key = `RPC_${id}`;
    const url = must(key);
    if (!/^https?:\/\//i.test(url)) throw new Error(`Invalid URL in ${key}`);
    out[id] = url;
  }
  return out;
}

/** Build a map<number,Address> from WETH_{id} vars */
export function buildWethMap(chains: number[]): Record<number, Address> {
  const out: Record<number, Address> = {};
  for (const id of chains) {
    const key = `WETH_${id}`;
    out[id] = getAddress(must(key) as `0x${string}`);
  }
  return out;
}

/** Build a map<number,Address> from SPOKEPOOL_{id} vars */
export function buildSpokePoolMap(chains: number[]): Record<number, Address> {
  const out: Record<number, Address> = {};
  for (const id of chains) {
    const key = `SPOKEPOOL_${id}`;
    out[id] = getAddress(must(key) as `0x${string}`);
  }
  return out;
}

/** Simple getters with defaults */
export const envNum = (name: string, def: number) =>
  Number(process.env[name] ?? def);
export const envStr = (name: string, def: string) =>
  String(process.env[name] ?? def);
export const envBool = (name: string, def = false) => {
  const v = process.env[name];
  if (v == null) return def;
  return /^(1|true|yes)$/i.test(v);
};
