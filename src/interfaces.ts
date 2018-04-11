import { BigNumber } from 'bignumber.js'

/**
 * The root of the block type system. Every block has a time at the very least.
 */
export interface Block {
  readonly hash: string
  /** Block timestamp (seconds since 1970-01-01T00:00 UTC). */
  readonly timestamp: number
}

export interface BlockWithChainWork extends Block {
  /** The estimated number of block header hashes/solutions miners had to attempt from the genesis block to this block. */
  readonly chainWork: BigNumber
}

/**
 * Can be derived from a BlockWithChainWork via `Estimator.estimateNetworkHashRate`.
 */
export interface BlockWithNetworkHashRate extends Block {
  /** The network hash rate at the time this block was mined. */
  networkHashRate: BigNumber
}

export interface BlockchainReader<TBlock extends BlockWithChainWork> {
  /** The most recently mined block available on the blockchain. */
  newestBlock (): Promise<TBlock>
  
  /**
   * Returns a subset of a blockchain.
   * @param newestBlockTime The time of the newest block. 
   * - The newest block in the returned chain will be the earliest/oldest block existed at `newestBlockTime`.
   * - If no block yet exists at this time, then the newest possible block is returned.
   * @param oldestBlockTime The time that the oldest block in the return chained should be returned for.
   * - The oldest block in the returned chain will be the earliest/oldest block that existed at `oldestBlockTime`.
   * - If no block existed at `oldestBlockTime` the genesis block will be returned.
   */
  subset (oldestBlockTime: Date, newestBlockTime: Date): Promise<Chain<TBlock>>

  /**
   * Returns an array of ancestor blocks before the specified block the chain.
   * Use this method to get the previous blocks so that the reader can lazily load blocks.
   * @param block The block to get the previous blocks to.
   * @param count Indicates the number of blocks to read.
   */
  ancestors (block: TBlock, count: number): Promise<TBlock[]>
}

/**
 * Represents block chain providing the newest and oldest blocks in the chain.
 * Use oldest.previous to iterate through the chain.
 */
export interface Chain<TBlock extends BlockWithChainWork> {
  newestBlock: TBlock
  oldestBlock: TBlock
}
