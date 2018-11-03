/* eslint-env mocha */
import { expect } from "chai"
import * as sinon from "sinon"
import * as _ from "lodash"

import { LruCache } from "../../src/lib"

describe("LruCache", function() {
  describe("constructor", function() {
    it("should validate maxSize", function() {
      const ctor = () => new LruCache(0, () => null)
      return expect(ctor).to.throw(/maxSize must be at least 2/)
    })

    it("should validate getter", function() {
      const ctor = () => new LruCache(100, null)
      return expect(ctor).to.throw(/getter must be provided/)
    })
  })

  describe("get", function() {
    it("should cache hit", function() {
      let getter = sinon.stub()
      getter.withArgs(1).returns("one")

      const lru = new LruCache(100, getter)
      // hydrate cache
      lru.get(1)
      // Change getter's response so we know the cache is used
      getter.withArgs(1).returns("two")

      return expect(lru.get(1)).to.equal("one")
    })

    it("should hydrate on cache miss", function() {
      let getter = sinon.stub()
      getter.withArgs(1).returns("one")

      const lru = new LruCache(100, getter)
      return expect(lru.get(1)).to.equal("one")
    })
  })

  describe("cache expiration", function() {
    const numberWords = [
      "zero",
      "one",
      "two",
      "three",
      "four",
      "five",
      "six",
      "seven",
      "eight",
      "nine"
    ]
    const realGetter = key => numberWords[key]

    it("should expire old entries", function() {
      let mockGetter = sinon.stub()
      mockGetter.callsFake(realGetter)
      const lru = new LruCache<number, string>(2, mockGetter)
      lru.get(1)
      lru.get(2)
      lru.get(3)
      lru.get(1) // since max is 2, 1 was just expired
      expect(lru.size).to.equal(2) // < expiration keeps size at 2
      expect(mockGetter.callCount).to.equal(4) // < expiration required it to call getter for key=1 the second time around too
    })

    it("shouldn't call getter on cache hit", function() {
      let mockGetter = sinon.stub()
      mockGetter.callsFake(realGetter)
      const lru = new LruCache<number, string>(2, mockGetter)
      lru.get(1)
      lru.get(1) // since max is 2, 1 was just expired
      expect(lru.size).to.equal(1)
      expect(mockGetter.callCount).to.equal(1) // < expiration required it to call getter for key=1 the second time around too
    })
  })

  describe("_debugHead", function() {
    it("should return something", function() {
      const lru = new LruCache(100, () => "hi")
      lru.get(1)
      return expect(lru._debugHead()).to.not.be.null
    })
  })

  describe("_debugTail", function() {
    it("should return something", function() {
      const lru = new LruCache(100, () => "hi")
      lru.get(1)
      return expect(lru._debugTail()).to.not.be.null
    })
  })

  describe("size", function() {
    it("should return 0 on empty", function() {
      const lru = new LruCache(100, () => "hi")
      return expect(lru.size).to.equal(0)
    })

    it("should return > 0 when not empty", function() {
      const lru = new LruCache(100, () => "hi")
      lru.get(1)
      lru.get(2)
      return expect(lru.size).to.equal(2)
    })
  })
})
