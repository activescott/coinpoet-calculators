import * as _ from 'lodash'
import { BigNumber } from 'bignumber.js'
import { BlockchainReader, BlockWithChainWork, Chain } from '../interfaces'
import ServiceProvder from '../ServiceProvider'
import Diag from '../Diag'

const D = new Diag('ZCashBlockchainReader')

export default class ZCashBlockchainReader implements BlockchainReader<BlockWithChainWork> {
  //TODO: Change this to a skip list. We need ordered fast access.
  // holds the chain in reverse order. The block at position 0 is the most recent block (with greatest height).
  private _chainNewest = null
  private _chainOldest = null
  // Offset into the paging in the API. The value is the offset that should be read on the next API call.
  private _apiOffset = 0

  constructor () {
    D.info('Using fetch implementation:', ServiceProvder.Fetch)
  }

  async newestBlock (): Promise<ZCashRawBlock> {
    await this.readBackUntil(new Date())
    return this._chainNewest
  }

  private oldestBlock () {
    return this._chainOldest
  }

  /**
   * returns the newest block older than (created before at at same time as) the specified date
   */
  private findNewestBlockOlderThan (date: Date): ZCashRawBlock {
    let dateSeconds = date.valueOf() / 1000
    let current = this._chainNewest
    do {
      if (current.timestamp <= dateSeconds)
        return current
      current = current.previous
    } while (current != null)
  }

  private findOldestBlockNewerThan (date: Date): ZCashRawBlock {
    let dateSeconds = date.valueOf() / 1000
    let current = this._chainOldest
    do {
      if (current.timestamp >= dateSeconds)
        return current
      current = current.next
    } while (current != null)
  }

  async subset (oldestBlockTime: Date, newestBlockTime: Date): Promise<Chain<BlockWithChainWork>> {
    await this.readBackUntil(oldestBlockTime)
    // going from newest to oldest, find earliest/oldest block created on or after `newestBlockTime`.
    //  first, find the newest block *before* newestBlockTime (then we'll grab his next)
    let newestBlock = this.findNewestBlockOlderThan(newestBlockTime)
    if (!newestBlock) {
      D.warn('no block existed at the newestBlockTime?')
      newestBlock = this.oldestBlock()
    }
    // now, going from oldest to newest, find the newest block that exists at/AFTER oldestBlockTime
    let oldestBlock = this.findOldestBlockNewerThan(oldestBlockTime)
    if (!oldestBlock) {
      D.warn('oldest block didn\'t exist at the oldestBlockTime?')
      oldestBlock = this.oldestBlock()
    }
    return {
      newestBlock,
      oldestBlock
    }
  }

  async ancestors (block: BlockWithChainWork, count: number): Promise<BlockWithChainWork[]> {
    //console.assert(block is ZCashRawBlock)
    if (count <= 0)
      throw new Error('count must be greater than zero.')
    let b = (block as ZCashRawBlock)
    let ancestors: BlockWithChainWork[] = []
    while (count > 0) {
      ancestors.push(b.previous)
      count --
    }
    return ancestors
  }

  private haveBlockEarlierThan (date: Date): boolean {
    let block = this.oldestBlock()
    return block && block.timestamp <= (date.valueOf() / 1000)
  }

  private async readBackUntil (date: Date): Promise<number> {
    let totalCount = 0
    while (!this.haveBlockEarlierThan(date)) {
      let pageCount = await this.loadNextPage()
      if (pageCount == 0)
        break
      totalCount += pageCount
    }
    D.debug('readBackUntil read', totalCount, 'new blocks')
    return totalCount
  }

  /**
   * Loads the next page of blocks. This is the previous/ancestor blocks as we read them in reverse order.
   * Returns true if there is another offset or false if there are no more to read.
   */
  private async loadNextPage (): Promise<number> {
    D.debug('Fetching offset', this._apiOffset)
    const res = await ServiceProvder.Fetch(`https://api.zcha.in/v2/mainnet/blocks?sort=height&direction=descending&limit=20&offset=${this._apiOffset}`)
    let blocks = await res.json()
    D.debug('Offset', this._apiOffset, 'fetched. Read', _.size(blocks), 'blocks.')
    if (!_.isArray(blocks)) {
      throw new Error(`Expected blocks from API to be a JSON array but was ${JSON.stringify(blocks)}`)
    }
    blocks = _.map(blocks, b => new ZCashRawBlock(b.hash, b.timestamp, b.height, new BigNumber('0x' + b.chainWork)))
    // setup links in linked list:
    for (let i = 0; i < blocks.length - 1; i++) {
      blocks[i].previous = blocks[i + 1]
      blocks[i + 1].next = blocks[i]
    }
    // link to existing chain
    if (this._chainOldest) {
      this._chainOldest.previous = blocks[0]
      blocks[0].next = this._chainOldest
    }
    this._chainOldest = blocks[blocks.length - 1]
    if (!this._chainNewest) {
      this._chainNewest = blocks[0]
    }
    D.debug(`Oldest block read: height=${this.oldestBlock().height}, timestamp:${new Date(this.oldestBlock().timestamp*1000)}`)
    this._apiOffset += blocks.length
    return blocks.length
  }
}

class ZCashRawBlock implements BlockWithChainWork {
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
  next: ZCashRawBlock
}