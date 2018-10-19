import { Block, BlockStorage } from '../interfaces'

import Diag from '../Diag'
import { stringify } from 'querystring';

const D = new Diag('LruBlockStorage')

const blockTime = 150
const secondsPerDay = 60*60*24
const blocksPerDay = secondsPerDay / blockTime
const maxCacheItems = blocksPerDay * 7

export default class LruBlockStorage extends BlockStorage<Block> {
  private readonly heightToHashCache: Lru<number, Promise<string>>
  private readonly hashToBlockCache: Lru<string, Promise<Block>>

  constructor (
    private readonly realStorage: BlockStorage<Block>,
    public readonly maxSize = maxCacheItems
  ) {
    super()
    if (!this.realStorage) {
      throw new Error('realStorage must be provided')
    }
    this.heightToHashCache = new Lru<number, Promise<string>>(maxSize, height => realStorage.getBlockHash(height))
    this.hashToBlockCache = new Lru<string, Promise<Block>>(maxSize, hash => realStorage.getBlock(hash))
  }

  get size() {
    return Math.max(this.heightToHashCache.size, this.hashToBlockCache.size)
  }

  getBlockCount(): Promise<number> {
    return this.realStorage.getBlockCount()
  }
  
  getBlockHash(height: number): Promise<string> {
    return this.heightToHashCache.get(height)
  }
  
  getBlock(blockHash: string): Promise<Block> {
    return this.hashToBlockCache.get(blockHash)
  }
}

class Lru<TKey, TValue> {
  // most recently accessed node
  private head: LruNode<TKey, TValue> = null
  private tail: LruNode<TKey, TValue> = null
  private readonly map = new Map<TKey, LruNode<TKey, TValue>>()

  constructor (
    readonly maxSize: number,
    readonly getter: (key: any) => TValue) {
      if (maxSize < 2) {
        throw new Error('maxSize must be at least 2')
      }
      if (!getter) {
        throw new Error('getter must be provided')
      }
  }

  get size () {
    let c = 0
    let node = this.head
    while (node) {
      D.log('size:', node.key)
      c++
      node = node.next
    }
    D.debug('size:', c)
    return c
  }

  get (key: TKey): TValue {
    let node = this.map.get(key);
    if (!node) {
      D.debug('Lru cache miss for key', key)
      let val = this.getter(key)
      D.debug('getter returned:', val)
      if (val) {
        node = new LruNode(key, val)
        this.map.set(key, node)
      }
    } else {
      D.debug('Lru cache hit for key', key)
    }
    this.onNodeAccessed(node)
    return node.value
  }

  private onNodeAccessed(node: LruNode<TKey, TValue>): void {
    D.log('onNodeAccessed:', node.key)
    // maintain head:
    if (this.head != node) {
      node.insertYourselfBefore(this.head)
      this.head = node
    }

    // maintain tail:
    if (this.tail != node) {
      node.insertYourselfAfter(this.tail)
      this.tail = node
    }

    // maintain cache size:
    while (this.tail && this.map.size > this.maxSize) {
      D.log('Lru deleting node', this.tail.key)
      this.map.delete(this.tail.key)
      let oldTail = this.tail
      this.tail = oldTail.previous
      if (oldTail)
        oldTail.next = this.tail
      this.tail.next = null
    }
  }
}

class LruNode<TKey, TValue> {
  constructor (
    public readonly key: TKey,
    public readonly value: TValue,
    public next: LruNode<TKey, TValue> = null,
    public previous: LruNode<TKey, TValue> = null
    ) {
  }

  public insertYourselfBefore (beforeNode) {
    if (!beforeNode)
      return
    // ignore request to insert before ourselves:
    if (this === beforeNode)
      return
    // ignore if we're already before it:
    if (beforeNode && beforeNode.previous === this)
      return
    let myPrevious = beforeNode.previous
    let myNext = beforeNode
    if (myPrevious) myPrevious.next = this
    if (myNext) myNext.previous = this
    this.previous = myPrevious
    this.next = myNext
  }

  public insertYourselfAfter(afterNode) {
    if (!afterNode)
      return
    // ignore request to insert after ourselves
    if (this === afterNode)
      return
    // ignore request to insert after ourselves
    if (afterNode && afterNode.next === this)
      return
    let myPrevious = afterNode
    let myNext = afterNode.next
    if (myPrevious) myPrevious.next = this
    if (myNext) myNext.previous = this
    this.previous = myPrevious
    this.next = myNext
  }
}
