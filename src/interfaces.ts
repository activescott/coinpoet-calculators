import { BigNumber } from 'bignumber.js'

/**
 * The root of the block type system.
 */
export interface Block {
  readonly hash: string
  readonly height: number
  /** Block timestamp (seconds since 1970-01-01T00:00 UTC). */
  readonly time: number
  readonly previousBlockHash: string
  /** The estimated number of block header hashes/solutions miners had to attempt from the genesis block to this block. */
  readonly chainWork: BigNumber
  /** Returns the previous block in the chain. */
  previous (): Promise<Block>
}

/**
 * Can be derived from a Block via `Estimator.estimateNetworkHashRate`.
 */
export interface BlockWithNetworkHashRate extends Block {
  /** The network hash rate at the time this block was mined. */
  networkHashRate: BigNumber
}

/**
 * Provides blocks from the best chain in a storage.
 */
export abstract class BlockStorage<TBlock extends Block> {
  /**
   * For a chain with only the hard-coded genesis block, this number will be 0.
   * For the first mined block, it will be 1.
   */
  abstract async getBlockCount (): Promise<number>

  /**
   * Returns the hash of a block at the given height in the best block chain.
   * @param height {number} The height of the block whose hash is to be returned.
   */
  abstract async getBlockHash (height: number): Promise<string>

  /**
   * Returns the block with the given header hash from the blockchain.
   * @param blockHash {string} The hash of the block to be returned.
   */
  abstract async getBlock (blockHash: string): Promise<TBlock>
  
  /**
   * Returns a block at the given height in the local best block chain.
   * @param height {number} The height of the block to be returned.
   */
  async getBlockFromHeight (height: number): Promise<TBlock> {
    let hash
    try {
      hash = await this.getBlockHash(height)
    } catch (err) {
      throw new Error(`An error occured retrieving hash for block height ${height}:` + err.message)
    }
    if (!hash)
      throw new Error(`A block for height ${height} was not found.`)
    try {
      return this.getBlock(hash)
    } catch (err) {
      throw new Error(`An error occured retrieving block for block height ${height}:` + err.message)
    }
  }
}

/**
 * Represents block chain providing the newest and oldest blocks in the chain.
 * Use oldest.previous to iterate through the chain.
 */
export class Chain<TBlock extends Block> {
  constructor (readonly oldestBlock: TBlock, readonly newestBlock: TBlock) {
  }
}
