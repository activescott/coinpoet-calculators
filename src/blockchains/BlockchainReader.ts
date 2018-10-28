import * as _ from "lodash"
import { Block, Chain, BlockStorage } from "../interfaces"
import Diag from "../lib/Diag"

const D = new Diag("BlockchainReader")

/**
 * Provides an interface for random access reading of a blockchain.
 * Provide it a @see BlockStorage interface to read any blockchain.
 */
export default class BlockchainReader {
  constructor(readonly storage: BlockStorage<Block>) {}

  /** Returns the most recently mined block available on the blockchain. */
  async newestBlock(): Promise<Block> {
    let count = await this.storage.getBlockCount()
    return this.storage.getBlockFromHeight(count - 1)
  }

  /**
   * Returns the previous block of the specified block.
   */
  previous(block: Block): Promise<Block> {
    if (block.previousBlockHash)
      return this.storage.getBlock(block.previousBlockHash)
    else return null
  }

  /**
   * Returns a subset of a blockchain.
   * @param newestBlockTime The time of the newest block.
   * - The newest block in the returned chain will be a block at the specified time or a block that is aproximately the specified time.
   * - If no block yet exists at this time, then the newest possible block is returned.
   * @param oldestBlockTime The time that the oldest block in the return chained should be returned for.
   * - The oldest block in the returned chain will be a block at the specified time or a block that is aproximately the specified time.
   * - If no block existed at `oldestBlockTime` the genesis block will be returned.
   */
  async subset(
    oldestBlockTime: Date,
    newestBlockTime: Date
  ): Promise<Chain<Block>> {
    const oldestSeconds = oldestBlockTime.valueOf() / 1000
    const newestSeconds = newestBlockTime.valueOf() / 1000

    let oldestBlock = await this.search(oldestSeconds)
    let newestBlock = await this.search(newestSeconds)
    return Promise.resolve(new Chain(oldestBlock, newestBlock))
  }

  async search(soughtTime: number): Promise<Block> {
    let best: Block = null
    let left, mid, right
    right = (await this.storage.getBlockCount()) - 1
    left = 0
    while (left <= right) {
      mid = Math.floor((left + right) / 2)
      best = await this.storage.getBlockFromHeight(mid)
      if (!best) {
        throw new Error(`Storage returned null block for height ${mid}`)
      }
      if (best.time < soughtTime) {
        left = mid + 1
      } else if (best.time > soughtTime) {
        right = mid - 1
      } else {
        // best.time == soughtTime
        return best
      }
    }
    return best
  }
}
