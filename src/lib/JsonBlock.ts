import { Block, BlockStorage } from "../interfaces"
import { BigNumber } from "bignumber.js"
import { createLogger } from "../services"
import * as _ from "lodash"

const D = createLogger("JsonBlock")

/**
 * Provides a @see Block implementation that works from a JSON-based block.
 */
export class JsonBlock implements Block {
  readonly chainWork: BigNumber
  constructor(
    readonly owningStorage: BlockStorage<Block>,
    readonly hash: string,
    readonly height: number,
    readonly time: number,
    readonly previousBlockHash: string,
    readonly chainWorkString: string,
    readonly reward: number
  ) {
    if (!owningStorage) throw new Error("owningStorage must be provided")
    if (_.isEmpty(hash)) throw new Error("block hash must be provided")
    if (!_.isInteger(height)) throw new Error("block height must be an integer")
    if (height < 0) throw new Error("block height must be a positive integer")
    const MILLISECONDS_PER_SECOND = 1000
    const blockTimestamp = new Date(time * MILLISECONDS_PER_SECOND)
    if (blockTimestamp < new Date(2009, 0, 3)) {
      throw new Error(
        `Expected block time to be later than year 2009, but found "${blockTimestamp}".`
      )
    }
    // NOTE: previousBlockHash is okay to be empty for block 0
    if (_.isEmpty(previousBlockHash) && height > 0)
      throw new Error(
        `previousBlockHash must be provided but was "${previousBlockHash}" for height "${height}".`
      )
    this.chainWork = new BigNumber("0x" + chainWorkString)
  }

  async previous(): Promise<Block> {
    if (this.height == 0) return null
    return this.owningStorage.getBlock(this.previousBlockHash)
  }
}
