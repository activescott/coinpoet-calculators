import * as BbPromise from "bluebird"
import * as _fs from "fs"
import * as path from "path"
import * as _ from "lodash"
import { BlockStorage, Block } from "../interfaces"
import Diag from "../lib/Diag"
import JsonBlock from "../lib/JsonBlock"

const fs: any = BbPromise.promisifyAll(_fs)
const D = new Diag("BlockStorageFileSystem")

/**
 * Reads a blockchain as a seequence of JSON blocks in a single directory.
 * The blocks must be named as <height>.json.
 * The JSON format is expected to be bitcoin-like (e.g. bitcoin, zcash, etc.).
 * To support other formats really just need to override @see BlockStorageFileSystem.loadBlockFile.
 */
export default class BlockStorageFileSystem extends BlockStorage<Block> {
  /**
   * Creates a new instance of @see BlockStorageFileSystem.
   * The directory should contain files named like <height>.json where <height> is the height of the block and the file contains the header for that block as JSON.
   * @param dirPath {string} The path to the directory containing the blocks.
   */
  constructor(readonly dirPath: string) {
    super()
    if (!fs.existsSync(dirPath))
      throw new Error(`The path ${dirPath} does not exist.`)
    D.debug("using path:", this.dirPath)
  }

  async getBlockCount(): Promise<number> {
    const files = await fs.readdirAsync(this.dirPath)
    let m = _(files)
      .map(f => Number.parseInt(path.basename(f, ".json")))
      .max()
    return m + 1
  }

  async getBlockHash(height: number): Promise<string> {
    let b = await this.loadBlockFile(height)
    return b.hash
  }

  async getBlock(blockHash: string): Promise<Block> {
    let height = await this.lookupHeightFromHash(blockHash)
    if (height !== 0 && !height)
      throw new Error(`Block hash '${blockHash}' not found.`)
    return this.loadBlockFile(height)
  }

  private async lookupHeightFromHash(blockHash: string): Promise<number> {
    const indexDir = path.join(this.dirPath, "blockhash-to-height-index")
    const filePath = path.join(indexDir, blockHash)
    let str
    try {
      str = await fs.readFileAsync(filePath)
    } catch (err) {
      D.error(`Error reading hash index file ${filePath}: ${err.message}`)
      throw err
    }
    let num
    try {
      num = Number.parseInt(str)
    } catch (err) {
      throw new Error(`Error parsing height ${str} as a number.`)
    }
    return num
  }

  private async loadBlockFile(height: number): Promise<Block> {
    const filePath = path.join(this.dirPath, height.toString() + ".json")
    let str
    try {
      str = await fs.readFileAsync(filePath)
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
    return new JsonBlock(
      this,
      json.hash,
      json.height,
      json.time,
      json.previousblockhash,
      json.chainwork
    )
  }
}
