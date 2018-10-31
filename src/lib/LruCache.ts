import Diag from "./Diag"

const D = new Diag("LruCache")

export default class LruCache<TKey, TValue> {
  // most recently accessed node
  private head: LruNode<TKey, TValue> = null
  private tail: LruNode<TKey, TValue> = null
  private readonly map = new Map<TKey, LruNode<TKey, TValue>>()

  constructor(
    readonly maxSize: number,
    readonly getter: (key: TKey) => TValue
  ) {
    if (maxSize < 2) {
      throw new Error("maxSize must be at least 2")
    }
    if (!getter) {
      throw new Error("getter must be provided")
    }
  }

  get size() {
    let c = 0
    let node = this.head
    while (node) {
      c++
      node = node.next
    }
    return c
  }

  _debugHead() {
    return this._debugChain(this.head, n => n.next)
  }

  _debugTail() {
    return this._debugChain(this.tail, n => n.previous)
  }

  _debugChain(
    node: LruNode<TKey, TValue>,
    nextAccessor: (n: LruNode<TKey, TValue>) => LruNode<TKey, TValue>
  ) {
    let keys = []
    while (node) {
      keys.push({
        key: node.key,
        previous: node.previous ? node.previous.key : null,
        next: node.next ? node.next.key : null
      })
      node = nextAccessor(node)
    }
    return keys
  }

  get(key: TKey): TValue {
    let node = this.map.get(key)
    if (!node) {
      D.debug("Lru cache miss for key", key, "getter:", this.getter)
      let val = this.getter(key)
      D.debug("Lru cache miss for key", key, "resolved to", val)
      node = new LruNode(key, val)
      this.map.set(key, node)
    } else {
      D.debug("Lru cache hit for key", key)
    }
    this.onNodeAccessed(node)
    return node.value
  }

  private onNodeAccessed(node: LruNode<TKey, TValue>): void {
    // maintain head:
    if (this.head !== node) {
      node.removeYourselfFromChain()
      node.insertYourselfBefore(this.head)
      this.head = node
      D.assert(!this.head.previous, "expected head.previous to be null")
    }

    // maintain cache size:
    while (
      this.tail &&
      this.map.size > this.maxSize &&
      this.tail !== this.head
    ) {
      D.debug("Lru deleting node", this.tail.key)
      this.map.delete(this.tail.key)
      let oldTail = this.tail
      this.tail = oldTail.previous
      //unhook the tail from the chain:
      oldTail.removeYourselfFromChain()
      if (this.tail) this.tail.next = null
    }
    // maintain tail:
    if (!this.tail) this.tail = node
  }
}

class LruNode<TKey, TValue> {
  constructor(
    public readonly key: TKey,
    public readonly value: TValue,
    public next: LruNode<TKey, TValue> = null,
    public previous: LruNode<TKey, TValue> = null
  ) {}

  public removeYourselfFromChain() {
    if (this.previous) this.previous.next = this.next
    if (this.next) this.next.previous = this.previous
  }

  public insertYourselfBefore(beforeNode) {
    if (beforeNode === this) return
    let myNext = beforeNode
    this.next = myNext
    if (beforeNode) {
      let myPrevious = beforeNode.previous
      this.previous = myPrevious
    }

    if (myNext) myNext.previous = this
  }
}
