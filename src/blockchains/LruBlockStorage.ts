import { Block, BlockStorage } from "../interfaces"

import Diag from "../lib/Diag"
import LruCache from "../lib/LruCache"

const D = new Diag("LruBlockStorage")

const blockTime = 150
const secondsPerDay = 60 * 60 * 24
const blocksPerDay = secondsPerDay / blockTime
const maxCacheItems = blocksPerDay * 7

export default class LruBlockStorage extends BlockStorage<Block> {
  private readonly heightToHashCache: LruCache<number, Promise<string>>
  private readonly hashToBlockCache: LruCache<string, Promise<Block>>

  constructor(
    private readonly realStorage: BlockStorage<Block>,
    public readonly maxSize = maxCacheItems
  ) {
    super()
    if (!this.realStorage) {
      throw new Error("realStorage must be provided")
    }
    this.heightToHashCache = new LruCache<number, Promise<string>>(
      maxSize,
      height => {
        D.debug("caching", height)
        return realStorage.getBlockHash(height)
      }
    )
    this.hashToBlockCache = new LruCache<string, Promise<Block>>(
      maxSize,
      hash => {
        D.debug("caching", hash)
        return realStorage.getBlock(hash)
      }
    )
  }

  get size() {
    return Math.max(this.heightToHashCache.size, this.hashToBlockCache.size)
  }

  getBlockCount(): Promise<number> {
    return this.realStorage.getBlockCount()
  }

  getBlockHash(height: number): Promise<string> {
    return this.heightToHashCache.get(height)
  }

  getBlock(blockHash: string): Promise<Block> {
    return proxyBlock(this.hashToBlockCache.get(blockHash), this)
  }
}

async function proxyBlock(
  block: Block | Promise<Block>,
  owningStorage: BlockStorage<Block>
): Promise<Block> {
  let resolvedBlock = await block
  if (resolvedBlock) {
    return {
      ...resolvedBlock,
      previous: () => owningStorage.getBlock(resolvedBlock.previousBlockHash)
    }
  } else {
    // don't turn a null/undefined value to a non-null value
    return resolvedBlock
  }
}
