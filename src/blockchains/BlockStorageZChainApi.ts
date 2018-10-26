import * as _ from "lodash"
import { inspect } from "util"
import { BlockStorage, Block } from "../interfaces"
import { FetchImpl as fetch } from "../services"
import Diag from "../lib/Diag"
import JsonBlock from "../lib/JsonBlock"

const D = new Diag("BlockStorageZChainApi")

/**
 * A @see BlockStorage implementation that retrieves ZCash blocks from the ZCha.in API (https://zcha.in/api).
 */
export default class BlockStorageZChainApi extends BlockStorage<Block> {
  async getBlockCount(): Promise<number> {
    let resp = await fetch("https://api.zcha.in/v2/mainnet/network")
    let json = await resp.json()
    return json.blockNumber
  }

  async getBlockHash(height: number): Promise<string> {
    if (!Number.isInteger(height))
      throw new Error(
        `height must be provided as a positive integer, but was ${inspect(
          height
        )} (${typeof height}).`
      )
    let resp = await fetch(
      `https://api.zcha.in/v2/mainnet/blocks?sort=height&direction=ascending&limit=1&offset=${height -
        1}`
    )
    let json = await resp.json()
    if (!_.isArrayLike(json))
      throw new Error("expected response to be an array.")
    json = json[0]
    return json.hash
  }

  async getBlock(blockHash: string): Promise<Block> {
    if (!blockHash) throw new Error("blockHash must be provided")
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
      json.chainWork
    )
  }
}
