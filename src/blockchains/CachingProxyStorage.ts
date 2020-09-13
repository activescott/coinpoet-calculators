import { Block, BlockStorage, IWritableBlockStorage } from "../interfaces"
import { createLogger } from "../services"

const D = createLogger("CachingProxyStorage")

/**
 * Provides a caching layer between the consumer and an "origin storage".
 */
export class CachingProxyStorage extends BlockStorage<Block> {
  /**
   *
   * @param originStorage A @see BlockStorage that blocks are read from.
   * @param cachingStorage A @see BlockStorage with write capabilities (@see IWritableBlockStorage) that is used as a cache. Presumably the "reads" are much faster (or cheaper in some way) than the origin storage.
   */
  constructor(
    readonly originStorage: BlockStorage<Block>,
    readonly cachingStorage: BlockStorage<Block> & IWritableBlockStorage<Block>
  ) {
    super()
  }

  getBlockCount(): Promise<number> {
    return this.originStorage.getBlockCount()
  }

  async getBlockHash(height: number): Promise<string> {
    let hash = await this.cachingStorage.getBlockHash(height)
    if (hash) {
      D.debug(`getBlockHash: cache hit for height ${height}`)
      return hash
    } else {
      D.debug(`getBlockHash: cache miss for height ${height}`)
      const block = await this.originStorage.getBlockFromHeight(height)
      D.debug(`getBlockHash: block for height ${height}:`, block)
      if (block) {
        this.cachingStorage.putBlock(block)
        return block.hash
      } else {
        D.info("getBlockHash: No block for height", height)
        return null
      }
    }
  }

  async getBlock(blockHash: string): Promise<Block> {
    let block = await this.cachingStorage.getBlock(blockHash)
    if (block) {
      D.debug("getBlock: cache hit for hash", blockHash)
      return block
    } else {
      D.debug("getBlock: cache miss for hash", blockHash)
      const block = await this.originStorage.getBlock(blockHash)
      if (block) {
        this.cachingStorage.putBlock(block)
        return block
      } else {
        D.info("getBlock: No block for hash", blockHash)
        return null
      }
    }
  }
}
