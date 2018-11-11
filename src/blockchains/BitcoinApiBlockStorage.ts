import * as _ from "lodash"
import { Block, BlockStorage } from "../interfaces"
import { FetchImpl as fetch } from "../services"
import { JsonBlock } from "../lib"

/**
 * A Bitcoin Storage using a public internet-accessible API for data.
 */
export class BitcoinApiBlockStorage extends BlockStorage<Block> {
  async getBlockCount(): Promise<number> {
    let resp = await fetch("https://api.blockchair.com/bitcoin/stats")
    let json = await resp.json()
    return json.data.blocks
  }

  async getBlockHash(height: number): Promise<string> {
    if (!_.isInteger(height))
      throw new Error(
        `height must be provided as a positive integer, but was "${height}"`
      )
    let resp = await fetch(
      `https://api.blockchair.com/bitcoin/blocks?q=id(${height})`
    )
    let json = await resp.json()
    if (_.size(json.data) === 0)
      throw new Error(`no block found for height "${height}"`)
    return json.data[0].hash
  }

  async getBlock(blockHash: string): Promise<Block> {
    if (!blockHash) throw new Error("blockHash must be provided")
    let resp = await fetch(
      `https://api.blockchair.com/bitcoin/blocks?q=hash(${blockHash})`
    )
    let json = await resp.json()
    if (_.size(json.data) === 0)
      throw new Error(`no block found for blockHash "${blockHash}"`)
    const block = json.data[0]
    // TODO: stupid blockchair doesn't provide prevHash! Consider blockchain api
    const prevHash = block.id > 0 ? await this.getBlockHash(block.id - 1) : ""
    return new JsonBlock(
      this,
      block.hash,
      block.id,
      new Date(block.time).valueOf() / 1000,
      prevHash,
      block.chainwork
    )
  }
}
