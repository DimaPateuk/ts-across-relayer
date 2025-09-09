import {
  createPublicClient,
  http,
  type PublicClient,
  type Transport,
  type Chain,
} from "viem";
import { chainFromId } from "../config/networks";
import { getRpc } from "../config/chains";

export type AnyPublic = PublicClient<Transport, Chain>;

const cache = new Map<number, AnyPublic>();

export function getPublic(chainId: number): AnyPublic {
  const cached = cache.get(chainId);
  if (cached) return cached;

  const client = createPublicClient({
    chain: chainFromId(chainId),
    transport: http(getRpc(chainId)),
  }) as AnyPublic;

  cache.set(chainId, client);
  return client;
}
