import * as _ from "lodash"
import { Block, BlockStorage } from "../interfaces"
import { FetchImpl as fetch } from "../services"
import { JsonBlock } from "../lib"
import Diag from "../lib/Diag"

const D = Diag.createLogger("BitcoinApiBlockStorage")

/**
 * A Bitcoin Storage using a public internet-accessible API for data.
 */
export class BitcoinApiBlockStorage extends BlockStorage<Block> {
  async fetchJson(url: URL): Promise<any> {
    let resp = await fetch(this.authorizeRequest(url).toString())
    if (!resp.ok) {
      throw new Error(
        `Error HTTP response fetching url "${url}". Error was: ${
          resp.status
        }: ${resp.statusText}`
      )
    }
    return resp.json()
  }

  authorizeRequest(url: URL): URL {
    const BLOCKCHAIR_KEY = "BLOCKCHAIR_KEY"
    if (
      url.hostname === "api.blockchair.com" &&
      process.env[BLOCKCHAIR_KEY] &&
      !url.searchParams.has("key")
    ) {
      console.log("adding BLOCKCHAIR_KEY to request!")
      url.searchParams.append("key", process.env[BLOCKCHAIR_KEY])
    }
    return url
  }

  async getBlockCount(): Promise<number> {
    const json = await this.fetchJson(
      new URL("https://api.blockchair.com/bitcoin/stats")
    )
    return json.data.blocks
  }

  async getBlockHash(height: number): Promise<string> {
    if (!_.isInteger(height))
      throw new Error(
        `height must be provided as a positive integer, but was "${height}"`
      )
    const json = await this.fetchJson(
      new URL(`https://api.blockchair.com/bitcoin/blocks?q=id(${height})`)
    )
    if (_.size(json.data) === 0)
      throw new Error(`no block found for height "${height}"`)
    return json.data[0].hash
  }

  async getBlock(blockHash: string): Promise<Block> {
    if (!blockHash) throw new Error("blockHash must be provided")
    let json
    try {
      json = await this.fetchJson(
        new URL(
          `https://api.blockchair.com/bitcoin/blocks?q=hash(${blockHash})`
        )
      )
    } catch (err) {
      throw new Error(
        `no block found for blockHash "${blockHash}". Error was: ${err.message}`
      )
    }
    const block = json.data[0]
    // TODO: stupid blockchair doesn't provide prevHash! Consider blockchain api
    const prevHash = block.id > 0 ? await this.getBlockHash(block.id - 1) : ""
    return new JsonBlock(
      this,
      block.hash,
      block.id,
      new Date(block.time).valueOf() / 1000,
      prevHash,
      block.chainwork,
      BitcoinApiBlockStorage.calculateRewardForBlockHeight(block.id)
    )
  }

  static calculateRewardForBlockHeight(blockHeight: number): number {
    // https://en.bitcoin.it/wiki/Controlled_supply
    let reward = 50.0
    const halvings = Math.floor(blockHeight / 210000)
    for (let i = 0; i < halvings; i++) {
      reward /= 2
    }
    return reward
  }
}
