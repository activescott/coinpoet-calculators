import * as _ from "lodash"
import { inspect } from "util"
import { BlockStorage, Block } from "../interfaces"
import { FetchImpl as fetch } from "../services"
import Diag from "../lib/Diag"
import { JsonBlock } from "../lib"

const D = new Diag("ZChainApiBlockStorage")

/**
 * A @see BlockStorage implementation that retrieves ZCash blocks from the ZCha.in API (https://zcha.in/api).
 */
export class ZChainApiBlockStorage extends BlockStorage<Block> {
  /**
   * Interestingly, zchain doesn't ever return block 0: https://zcha.in/blocks/0 so we handle that here:
   */
  private readonly blockZero: Block = new JsonBlock(
    this,
    "00040fe8ec8471911baa1db1266ea15dd06b4a8a5c453883c000b031973dce08",
    0,
    1477641360,
    "",
    "0000000000000000000000000000000000000000000000000000000000002000",
    ZChainApiBlockStorage.calculateRewardForBlockHeight(0)
  )

  async getBlockCount(): Promise<number> {
    let resp = await fetch("https://api.zcha.in/v2/mainnet/network")
    let json = await resp.json()
    return json.blockNumber
  }

  async getBlockHash(height: number): Promise<string> {
    if (!Number.isInteger(height)) {
      throw new Error(
        `height must be provided as a positive integer, but was ${inspect(
          height
        )} (${typeof height}).`
      )
    }
    if (height === this.blockZero.height) {
      return this.blockZero.hash
    }
    let resp = await fetch(
      `https://api.zcha.in/v2/mainnet/blocks?sort=height&direction=ascending&limit=1&offset=${height -
        1}`
    )
    let json = await resp.json()
    if (!_.isArrayLike(json))
      throw new Error(
        `expected response to be an array, but was: ${inspect(json)}`
      )
    json = json[0]
    return json.hash
  }

  async getBlock(blockHash: string): Promise<Block> {
    if (!blockHash) throw new Error("blockHash must be provided")
    if (blockHash === this.blockZero.hash) {
      return this.blockZero
    }
    D.debug("getBlock:", blockHash, "fetch...")
    let resp = await fetch(`https://api.zcha.in/v2/mainnet/blocks/${blockHash}`)
    let json = await resp.json()
    D.debug("getBlock:", blockHash, "fetched.")
    return new JsonBlock(
      this,
      json.hash,
      json.height,
      json.timestamp,
      json.prevHash,
      json.chainWork,
      ZChainApiBlockStorage.calculateRewardForBlockHeight(json.height)
    )
  }

  static calculateRewardForBlockHeight(blockHeight: number): number {
    // Reward blocks & havling info: https://z.cash/support/faq/#zec-per-block
    // Founders reward: https://z.cash/blog/funding
    // Source: https://github.com/zcash/zcash/blob/master/src/main.cpp#L1732, https://github.com/zcash/zcash/blob/62aacb5c9526a5624ea45a27315004d1757b2d9e/src/chainparams.cpp#L87
    const subsidyHalvingInterval = 840000
    const subsidySlowStartInterval = 20000
    let reward = 12.5
    // NOTE There is some shenanigans lower than subsidySlowStartInterval that we ignore (since we're already past that)
    const halvings = Math.floor(
      Math.max(0, blockHeight - subsidySlowStartInterval) /
        subsidyHalvingInterval
    )
    for (let i = 0; i < halvings; i++) {
      reward /= 2
    }
    if (halvings === 0) {
      reward *= 0.8 // remove founder's reward
    }
    return reward
  }
}
