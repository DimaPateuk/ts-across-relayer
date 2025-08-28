import {
  createPublicClient,
  http,
  type PublicClient,
  type Transport,
  type Chain,
} from "viem";
import { mainnet, arbitrum, optimism } from "viem/chains";

export type AnyPublic = PublicClient<Transport, Chain>;
const cache = new Map<number, AnyPublic>();

export function getPublic(chainId: number): AnyPublic {
  const c = cache.get(chainId);
  if (c) return c;

  const pub =
    chainId === mainnet.id
      ? (createPublicClient({
          chain: mainnet,
          transport: http(process.env.ETHEREUM_RPC!),
        }) as AnyPublic)
      : chainId === arbitrum.id
      ? (createPublicClient({
          chain: arbitrum,
          transport: http(process.env.ARBITRUM_RPC!),
        }) as AnyPublic)
      : chainId === optimism.id
      ? (createPublicClient({
          chain: optimism,
          transport: http(process.env.OPTIMISM_RPC!),
        }) as AnyPublic)
      : (() => {
          throw new Error(`unsupported chainId ${chainId}`);
        })();

  cache.set(chainId, pub);
  return pub;
}
