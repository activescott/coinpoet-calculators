import { Block, BlockStorage } from "../interfaces"
import { BigNumber } from "bignumber.js"
import Diag from "../lib/Diag"
import * as _ from "lodash"

const D = new Diag("JsonBlock")

/**
 * Provides a @see Block implementation that works from a JSON-based block.
 */
export default class JsonBlock implements Block {
  readonly chainWork: BigNumber
  constructor(
    readonly owningStorage: BlockStorage<Block>,
    readonly hash: string,
    readonly height: number,
    readonly time: number,
    readonly previousBlockHash: string,
    readonly chainWorkString: string
  ) {
    if (!owningStorage) throw new Error("owningStorage must be provided")
    if (_.isEmpty(hash)) throw new Error("empty block hash")
    if (height < 0) throw new Error("invalid block height")
    const MILLISECONDS_PER_SECOND = 1000
    const blockTimestamp = new Date(time * MILLISECONDS_PER_SECOND)
    if (blockTimestamp < new Date(2000, 1, 1)) {
      throw new Error(
        `Expected block time to be later than year 2000, but found ${blockTimestamp}.`
      )
    }
    // NOTE: previousBlockHash is okay to be empty for block 0
    if (_.isEmpty(previousBlockHash) && height > 0)
      throw new Error(`invalid previousBlockHash: ${previousBlockHash}`)
    this.chainWork = new BigNumber("0x" + chainWorkString)
  }

  previous(): Promise<Block> {
    if (this.height == 0 || !this.previousBlockHash) return null
    return this.owningStorage.getBlock(this.previousBlockHash)
  }
}
