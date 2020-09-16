import * as path from "path"
import { promises as fs } from "fs"
import { existsSync, statSync } from "fs"
import { inspect } from "util"
import fetch from "node-fetch"
import { createLogger } from "./services"
import { mkdir } from "./fsutil"
import * as _ from "lodash"

const D = createLogger("BitcoinNodeBlockDownloader")

/**
 * Downloads blocks from a Bitcoin full node's JSON-RPC API and saves them to local disk.
 * Also supports Bitcoin-like full nodes such as ZCash.
 * The downloaded files have the following properites:
 * - Each block exists in a file with <height>.json where <height> is the height number of the block and file contains corresponding blocks' block header content in JSON.
 * - There is a "blockhash-to-height-index" subdirectory that contains a set of files where the name of the file is <blockhash> and the content is the corresponding block's height.
 * See https://en.bitcoin.it/wiki/Original_Bitcoin_client/API_calls_list.
 */
export class BitcoinNodeBlockDownloader {
  private readonly indexDir: string

  constructor(
    private readonly localDir: string,
    private readonly nodeUrl: string
  ) {
    if (!localDir) throw new Error("localDir must be provided")
    if (!nodeUrl) throw new Error("nodeUrl must be provided")
    this.indexDir = path.join(localDir, "blockhash-to-height-index")
  }

  /**
   * Downloads data from the RPC endpoint/API on a ZCash node and puts it in the configured directory.
   * @param maxBlockHeight 0 to get the highest block and all preceeding. Or the max height of a block to get and work back from.
   * @param blockCount The number of blocks to download (working backwards from maxBlockHeight).
   */
  public async download(highestBlockHeight = 0, blockCount = 0) {
    try {
      if (!existsSync(this.indexDir)) {
        D.info("Creating indexDir", this.indexDir, "...")
        mkdir(this.indexDir)
        D.info("Creating indexDir complete.")
      }
      if (highestBlockHeight === 0) {
        highestBlockHeight = await this.getBlockCount()
        if (blockCount === 0) {
          blockCount = highestBlockHeight + 1
        }
      }
      D.info("Getting current blockheight")
      let height = highestBlockHeight
      let pendingPromises = []
      const downloadStart = Date.now()
      let downloadedBlocks = 0
      let skippedBlocks = 0
      // values over 15 seem to trigger a "Work queue depth exceeded". Can be configured when running the node though with -rpc
      const BATCH_SIZE = Math.min(15, blockCount)
      while (highestBlockHeight - height < blockCount) {
        let dest = path.join(this.localDir, `${height}.json`)
        if (!existsSync(dest)) {
          D.info("Fetching header at height", height)
          const headerPromise = this.getBlockHeaderFromHeight(height)
          headerPromise
            .then(async header => {
              if (!header)
                throw new Error("Attempting to write empty header to file")
              console.error("Writing header to file", dest)
              await fs.writeFile(dest, JSON.stringify(header))
              return header
            })
            .then(header => {
              if (!header) throw new Error("WTF header not there??")
              downloadedBlocks++
              return this.addIndexFile(header)
            })
            .catch(err => {
              console.log("There was an error writing block?", err)
              process.exit(10)
            })
          pendingPromises.push(headerPromise)
        } else {
          skippedBlocks++
          console.log(`File ${dest} exists. Skipping...`)
        }
        height--
        if ((highestBlockHeight - height) % BATCH_SIZE == 0) {
          if (pendingPromises.length > 0) {
            console.log(`Awaiting ${pendingPromises.length} promises...`)
            await Promise.all(pendingPromises)
            pendingPromises = []
          }
          if (highestBlockHeight - height >= blockCount) {
            // we've downloaded the maximum number of blocks, so stop
            break
          }
          /*if (height + BATCH_SIZE >= max_block_height) {
            console.log('Fetching fresh block count')
            max_block_height = await getBlockCount()
          }*/
        }
      }
      const downloadEnd = Date.now()
      const downloadSeconds = (downloadEnd - downloadStart) / 1000
      console.log(
        `Downloaded ${downloadedBlocks} blocks in ${downloadSeconds} seconds. Skipped ${skippedBlocks} because they were already downloaded.`
      )
    } catch (err) {
      console.log("There was an error fetching or writing the block:", err)
      process.exit(20)
    }
  }

  private async rpcRequest(method: string, ...params): Promise<any> {
    params = params || []
    let rpcResultStr: string
    try {
      let resp = await fetch(this.nodeUrl, {
        body: JSON.stringify({
          jsonrpc: "1.0",
          method: method,
          params: params
        }),
        headers: {
          "content-type": "text/plain",
          Authorization:
            // FIXME: make user/pw options!
            "Basic " + Buffer.from("activescott:123456").toString("base64")
        },
        method: "POST"
      })
      rpcResultStr = await resp.text()
    } catch (err) {
      let msg = `Error fetching RPC method ${method} with args ${inspect(
        params
      )}.
      Result was: ${rpcResultStr}
      Exception was: ${err}
      `
      console.error(msg)
      throw new Error(msg)
    }
    let parsed: any
    try {
      parsed = JSON.parse(rpcResultStr)
    } catch (err) {
      throw new Error(
        `Error parsing JSON result for RPC method ${method} with args ${inspect(
          params
        )}. The result before attempting parsing was: '${rpcResultStr}'`
      )
    }
    // console.debug(`rpcRequest ${method} (${inspect(params)}):`, parsed)
    return Promise.resolve(parsed)
  }

  private async getBlockCount() {
    let json = await this.rpcRequest("getblockcount")
    return json.result
  }

  private async getBlockHeaderFromHeight(height: number) {
    if (!_.isInteger(height)) {
      throw new Error(`height must be an integer but was ${inspect(height)}`)
    }
    let json = await this.rpcRequest("GetBlockHash".toLocaleLowerCase(), height)
    let hash = json.result
    json = await this.rpcRequest("GetBlockHeader".toLocaleLowerCase(), hash)
    const header = json.result
    if (!header) {
      throw new Error(
        `Failed to read header from node for block height ${height}.`
      )
    }
    return header
  }

  private addIndexFile(block) {
    if (!block) throw new Error("block must be provided")
    let dest
    try {
      dest = path.join(this.indexDir, block.hash)
      if (existsSync(dest)) {
        D.info("Skipping existing index file", dest)
        return
      }
      D.info(`Writing index for ${block.hash} -> ${block.height}`)
      return fs.writeFile(dest, block.height.toString())
    } catch (err) {
      throw new Error(`Error writing file ${dest}:` + err.message)
    }
  }

  /**
   * Rebuilds the blockHash -> height index files in a subfolder
   */
  public async rebuildBlockhashIndex() {
    mkdir(this.indexDir)
    D.info("Getting list of block files...")
    const blockFiles = await fs.readdir(this.localDir)
    D.info("Getting list of block files complete.")
    const maxPending = 50
    let pending = []
    for (let f of blockFiles) {
      let blockPath, block
      try {
        if (_.includes([".", ".."], f)) continue
        blockPath = path.join(this.localDir, f)
        if (statSync(blockPath).isDirectory()) continue
        block = await this.loadBlockFile(blockPath)
        if (!block) {
          throw new Error(`Fund undefined block in file ${blockPath}`)
        }
      } catch (err) {
        throw new Error(
          `Error loading block from path '${blockPath}':` + err.message
        )
      }
      pending.push(this.addIndexFile(block))
      if (pending.length >= maxPending) {
        console.log(`Awaiting ${pending.length} pending index writes`)
        await Promise.all(pending)
        pending = []
      }
    }
    console.log(`Awaiting ${pending.length} pending index writes`)
    await Promise.all(pending)
  }

  private async loadBlockFile(filePath): Promise<any> {
    let str
    try {
      str = await fs.readFile(filePath)
    } catch (err) {
      D.error(`Error reading file ${filePath}: ${err.message}`)
      throw err
    }
    let json
    try {
      json = JSON.parse(str)
    } catch (err) {
      D.error(`Error parsing json in file ${filePath}: ${err.message}`)
      throw err
    }
    return json
  }
}
