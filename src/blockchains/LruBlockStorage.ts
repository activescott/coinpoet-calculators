import { Block, BlockStorage } from "../interfaces"

import Diag from "../lib/Diag"
import { LruCache } from "../lib"
import proxyBlock from "./proxyBlock"

const D = Diag.createLogger("LruBlockStorage")

const blockTime = 150
const secondsPerDay = 60 * 60 * 24 // 86,400
const blocksPerDay = secondsPerDay / blockTime // 576
// const maxCacheItems = blocksPerDay * 7       // ~82
const maxCacheItems = blocksPerDay * 30 // 17,280 VERY rarely would we go beyond 30 days.
/* NOTE: 
 * 1 JSON block is ~3442 bytes
 * Very roughly the overhead per block (mostly due to LruCache):
 * - 3442 bytes: disk size of a json block
 * - heightToHashCache
 *  - +256 bytes: 4 pointers per LruNode
 *  - +32 bytes: the height number as LruNode key
 *  - +128 bytes: 64 chararacter string of hash as value
 * - hashToBlockCache
 *  - +256 bytes: 4 pointers per LruNode
 *  - +128 bytes: 64 chararacter string of hash as key
 *  - (value is block itself)
 * == 4,242 bytes == 4.2K
 * 
 * So 100MB of in memory blocks would be: ~24K blocks
*/

export class LruBlockStorage extends BlockStorage<Block> {
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
        D.debug("caching", height, `(size ${this.size})`)
        return realStorage.getBlockHash(height)
      }
    )
    this.hashToBlockCache = new LruCache<string, Promise<Block>>(
      maxSize,
      hash => {
        D.debug("caching", hash, `(size ${this.size})`)
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
