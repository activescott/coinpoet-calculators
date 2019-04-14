/* eslint-env mocha */
import * as chai from "chai"
import * as chaiAsPromised from "chai-as-promised"
import { expect } from "chai"
import * as sinon from "sinon"

import { LruBlockStorage } from "../../src/blockchains/LruBlockStorage"
import { MockBlock } from "../mocks/MockBlock"
import { MockBlockStorage } from "../mocks/MockBlockStorage"

chai.use(chaiAsPromised)

describe("LruBlockStorage", function() {
  let sandbox: sinon.SinonSandbox
  let lru: LruBlockStorage

  beforeEach(() => {
    sandbox = sinon.sandbox.create()
  })

  afterEach(() => {
    sandbox.restore()
    sandbox = null
  })

  describe("getBlock", function() {
    it("should read from cache", async function() {
      let mockStorage = sandbox.createStubInstance<MockBlockStorage>(
        MockBlockStorage
      )

      // init LRU
      lru = new LruBlockStorage(mockStorage)

      // set mock.getBlock to value A
      mockStorage.getBlock.withArgs("hash1").resolves(new MockBlock("hash1"))

      // read from LRU
      expect(await lru.getBlock("hash1")).to.have.property("hash", "hash1")

      // change mockBlockStorage value
      mockStorage.getBlock.withArgs("hash1").resolves(new MockBlock("hash1XXX"))
      // expect cached value
      return expect(await lru.getBlock("hash1")).to.have.property(
        "hash",
        "hash1"
      )
    })

    it("should maintain maxSize", async function() {
      let mockStorage = sandbox.createStubInstance<MockBlockStorage>(
        MockBlockStorage
      )

      const MAX_SIZE = 9
      lru = new LruBlockStorage(mockStorage, MAX_SIZE)

      for (let n = 1; n < 100; n++) {
        mockStorage.getBlock
          .withArgs(`hash${n}`)
          .resolves(new MockBlock(`hash${n}`))
      }

      // read from LRU
      for (let n = 1; n < 100; n++) {
        await expect(lru.getBlock(`hash${n}`)).to.eventually.have.property(
          "hash",
          `hash${n}`
        )
        // console.log('! head:', (lru as any).hashToBlockCache._debugHead())
        // console.log('! tail:', (lru as any).hashToBlockCache._debugTail())
        await expect(lru.size).to.be.equal(Math.min(MAX_SIZE, n))
      }
    })

    it("can handle null", async function() {
      let mockStorage = sandbox.createStubInstance<MockBlockStorage>(
        MockBlockStorage
      )
      mockStorage.getBlock.withArgs("hash1").resolves(null)
      lru = new LruBlockStorage(mockStorage)
      return expect(lru.getBlock("hash1")).to.eventually.be.null
    })
  })

  describe("getBlockCount", function() {
    it("should NOT return cached value", async function() {
      let mockStorage = sandbox.createStubInstance<MockBlockStorage>(
        MockBlockStorage
      )
      mockStorage.getBlockCount.resolves(100)
      lru = new LruBlockStorage(mockStorage)
      expect(await lru.getBlockCount()).to.equal(100)
      mockStorage.getBlockCount.resolves(101)
      return expect(await lru.getBlockCount()).to.equal(101)
    })
  })

  describe("getBlockHash", function() {
    it("should return cached value", function() {
      let mockStorage = sandbox.createStubInstance<MockBlockStorage>(
        MockBlockStorage
      )
      mockStorage.getBlockHash.withArgs(100).resolves("hash100")
      lru = new LruBlockStorage(mockStorage)
      expect(lru.getBlockHash(100)).to.eventually.equal("hash100")
      mockStorage.getBlockHash.withArgs(100).resolves("hash100XXX")
      return expect(lru.getBlockHash(100)).to.eventually.equal("hash100")
    })
  })
})
