import { fetch } from 'cross-fetch'
import * as _ from 'lodash'
import { BigNumber } from 'bignumber.js'
import { BlockchainReader, BlockWithChainWork, BlockWithChain, Chain } from '../interfaces'
import Diag from '../Diag'

const D = new Diag('ZCashBlockchainReader')

export default class ZCashBlockchainReader implements BlockchainReader<ZCashRawBlock> {
  // holds the chain in reverse order. The block at position 0 is the most recent block (with greatest height).
  private _chain = new Array<ZCashRawBlock>()
  // Offset into the paging in the API. The value is the offset that should be read on the next API call.
  private _apiOffset = 0
  private fetchImpl: any // whatwg fetch impl

  constructor (fetchImpl) {
    this.fetchImpl = fetchImpl || fetch
  }

  async newestBlock (): Promise<ZCashRawBlock> {
    await this.readBackUntil(new Date())
    return _.first(this._chain)
  }

  async subset (oldestBlockTime: Date, newestBlockTime: Date): Promise<Chain<ZCashRawBlock>> {
    await this.readBackUntil(oldestBlockTime)
    //TODO: Update below with binary search instead of linear...
    const newestBlockTimeSeconds = newestBlockTime.valueOf() / 1000
    const oldestBlockTimeSeconds = oldestBlockTime.valueOf() / 1000
    // going from newest to oldest, find earliest/oldest block created on or after `newestBlockTime`.
    //  first, find the newest block *before* newestBlockTime (then we'll grab his next)
    let newestBlockIndex = _.findIndex(this._chain, b => b.timestamp < newestBlockTimeSeconds)
    if (newestBlockIndex > 0) newestBlockIndex--
    if (this._chain[newestBlockIndex].timestamp < newestBlockTimeSeconds)
      D.warn('newest block didn\'t exist at the newestBlockTime')
    // now, going from oldest to newest, find the newest block that exists at/AFTER oldestBlockTime
    let oldestBlockIndex = _.findLastIndex(this._chain, b => b.timestamp >= oldestBlockTimeSeconds)
    if (this._chain[oldestBlockIndex].timestamp < oldestBlockTimeSeconds)
      D.warn('oldest block didn\'t exist at the oldestBlockTime')
    return {
      newestBlock: this._chain[newestBlockIndex],
      oldestBlock: this._chain[oldestBlockIndex]
    }
  }

  oldestBlock () {
    return _.last(this._chain)
  }

  haveBlockEarlierThan (date: Date): boolean {
    let block = this.oldestBlock()
    return block && block.timestamp <= (date.valueOf() / 1000)
  }

  async readBackUntil (date: Date) {
    D.debug('readBackUntil using fetchIml:', this.fetchImpl)
    while (!this.haveBlockEarlierThan(date)) {
      // cache all the blocks locally? too big? Skip slices until we get to something relevant?
      // do we need to store the hash in blocks too? It should probably be on Block interface
      D.debug('Fetching offset', this._apiOffset)
      const res = await this.fetchImpl(`https://api.zcha.in/v2/mainnet/blocks?sort=height&direction=descending&limit=20&offset=${this._apiOffset}`)
      let blocks = await res.json()
      D.debug('Offset', this._apiOffset, 'fetched.')
      if (!_.isArray(blocks)) {
        throw new Error(`Expected blocks from API to be a JSON array but was ${JSON.stringify(blocks)}`)
      }
      D.debug('read', blocks.length, 'blocks.')
      blocks = _.map(blocks, b => new ZCashRawBlock(b.hash, b.timestamp, b.height, new BigNumber('0x' + b.chainWork)))
      for (let i = blocks.length - 2; i--; i >= 0) {
        blocks[i + 1].previous = blocks[i]
      }
      this._chain = this._chain.concat(blocks)
      D.debug(`Oldest block read: height=${this.oldestBlock().height}, timestamp:${new Date(this.oldestBlock().timestamp*1000)}`)
      this._apiOffset += blocks.length
    }
    D.debug('readBackUntil finished with', _.size(this._chain), 'blocks cached')
  }
}

class ZCashRawBlock implements BlockWithChain<ZCashRawBlock>, BlockWithChainWork {
  constructor (hash: string, timestamp: number, height: number, chainWork: BigNumber) {
    this.hash = hash
    this.timestamp = timestamp
    this.height = height
    this.chainWork = chainWork
  }
  readonly timestamp: number
  get timestampDate(): Date {
    return new Date(this.timestamp * 1000)
  }
  readonly hash
  readonly height
  readonly chainWork: BigNumber
  previous: ZCashRawBlock
}