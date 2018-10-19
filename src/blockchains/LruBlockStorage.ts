import { Block, BlockStorage } from '../interfaces'

import Diag from '../lib/Diag'
import Lru from '../lib/Lru'

const D = new Diag('LruBlockStorage')

const blockTime = 150
const secondsPerDay = 60*60*24
const blocksPerDay = secondsPerDay / blockTime
const maxCacheItems = blocksPerDay * 7

export default class LruBlockStorage extends BlockStorage<Block> {
  private readonly heightToHashCache: Lru<number, Promise<string>>
  private readonly hashToBlockCache: Lru<string, Promise<Block>>

  constructor (
    private readonly realStorage: BlockStorage<Block>,
    public readonly maxSize = maxCacheItems
  ) {
    super()
    if (!this.realStorage) {
      throw new Error('realStorage must be provided')
    }
    this.heightToHashCache = new Lru<number, Promise<string>>(maxSize, height => realStorage.getBlockHash(height))
    this.hashToBlockCache = new Lru<string, Promise<Block>>(maxSize, hash => realStorage.getBlock(hash))
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
    return this.hashToBlockCache.get(blockHash)
  }
}
