/* eslint-env mocha */
import * as chai from "chai"
import * as chaiAsPromised from "chai-as-promised"
import { expect } from "chai"
import * as sinon from "sinon"

import { CachingProxyStorage } from "../../src/blockchains/CachingProxyStorage"
import { MockBlock } from "../mocks/MockBlock"
import { MockBlockStorage } from "../mocks/MockBlockStorage"
import {
  Block,
  BlockStorage,
  IWritableBlockStorage
} from "../../src/interfaces"
import { WritableBlockStorage } from "../mocks"

chai.use(chaiAsPromised)

function createWritable(): BlockStorage<Block> & IWritableBlockStorage<Block> {
  return new WritableBlockStorage()
}

describe("CachingProxyStorage", function() {
  let sandbox: sinon.SinonSandbox
  let cache: CachingProxyStorage

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

      // init
      cache = new CachingProxyStorage(mockStorage, createWritable())

      // set mock.getBlock to value A
      mockStorage.getBlock.withArgs("hash1").resolves(new MockBlock("hash1"))

      // read from cache
      expect(await cache.getBlock("hash1")).to.have.property("hash", "hash1")

      // change mock value
      mockStorage.getBlock.withArgs("hash1").resolves(new MockBlock("hash1XXX"))
      // expect cached value
      return expect(await cache.getBlock("hash1")).to.have.property(
        "hash",
        "hash1"
      )
    })

    it("can handle null", async function() {
      let mockStorage = sandbox.createStubInstance<MockBlockStorage>(
        MockBlockStorage
      )
      mockStorage.getBlock.withArgs("hash1").resolves(null)
      cache = new CachingProxyStorage(mockStorage, createWritable())
      return expect(cache.getBlock("hash1")).to.eventually.be.null
    })
  })

  describe("getBlockCount", function() {
    it("should NOT return cached value", function() {
      let mockStorage = sandbox.createStubInstance<MockBlockStorage>(
        MockBlockStorage
      )
      mockStorage.getBlockCount.resolves(100)
      cache = new CachingProxyStorage(mockStorage, createWritable())
      expect(cache.getBlockCount()).to.eventually.equal(100)
      mockStorage.getBlockCount.resolves(101)
      return expect(cache.getBlockCount()).to.eventually.equal(101)
    })
  })

  describe("getBlockHash", function() {
    it("should return cached value", async function() {
      let mockStorage = sandbox.createStubInstance<MockBlockStorage>(
        MockBlockStorage
      )

      mockStorage.getBlockHash.withArgs(100).resolves("hash100")
      mockStorage.getBlockFromHeight
        .withArgs(100)
        .resolves(new MockBlock("hash100", 100))

      cache = new CachingProxyStorage(mockStorage, createWritable())
      expect(await cache.getBlockHash(100)).to.equal("hash100")
      mockStorage.getBlockHash.withArgs(100).resolves("hash100XXX")
      return expect(await cache.getBlockHash(100)).to.equal("hash100")
    })

    it("should handle null", async function() {
      let mockStorage = sandbox.createStubInstance<MockBlockStorage>(
        MockBlockStorage
      )
      mockStorage.getBlockHash.withArgs(100).resolves(null)
      cache = new CachingProxyStorage(mockStorage, createWritable())
      return expect(cache.getBlockHash(100)).to.eventually.be.null
    })
  })
})
