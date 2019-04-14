/* eslint-env mocha */
import { expect } from "chai"
import * as sinon from "sinon"
import * as _ from "lodash"
import { existsSync } from "fs"
import { Config } from "../../src/Config"
import { BlockchainReader } from "../../src/blockchains/BlockchainReader"
import { BlockStorageFileSystem } from "../../src/blockchains/BlockStorageFileSystem"
import { ZChainApiBlockStorage } from "../../src/blockchains/ZChainApiBlockStorage"
import { MockBlock, MockBlockStorage } from "../mocks"

describe("BlockchainReader", function() {
  let sandbox: sinon.SinonSandbox
  let reader: BlockchainReader

  beforeEach(() => {
    sandbox = sinon.sandbox.create()
    if (existsSync(Config.zcashLargeTestDataPath)) {
      reader = new BlockchainReader(
        new BlockStorageFileSystem(
          Config.zcashLargeTestDataPath,
          true,
          ZChainApiBlockStorage.calculateRewardForBlockHeight
        )
      )
    } else {
      // This one is damn slow but the tests will at least pass:
      console.log("********** ********** ********** **********")
      console.log("Local ZCash blocks not available.")
      console.log("Fallling back to SLOOOOOW ZChain API.")
      console.log("********** ********** ********** **********")
      reader = new BlockchainReader(new ZChainApiBlockStorage())
    }
  })

  afterEach(() => {
    sandbox.restore()
    sandbox = null
  })

  it("should have newestBlock", async function() {
    let b = await reader.newestBlock()
    expect(b)
      .to.have.property("height")
      .greaterThan(334481)
    expect(b)
      .to.have.property("time")
      .greaterThan(1528013876)
  })

  describe("subset", function() {
    it("should work with exact start/end block times", async function() {
      this.timeout(5000)
      if (!existsSync(Config.zcashLargeTestDataPath)) {
        this.skip()
      }

      const testOldestBlock = {
        height: 334480,
        datestamp: new Date(1528013209 * 1000)
      }
      const testNewestBlock = {
        height: 334482,
        datestamp: new Date(1528013877 * 1000)
      }
      let chain = await reader.subset(
        testOldestBlock.datestamp,
        testNewestBlock.datestamp
      )
      expect(chain.oldestBlock).to.have.property(
        "height",
        testOldestBlock.height,
        "oldestBlock height"
      )
      return expect(chain.newestBlock).to.have.property(
        "height",
        testNewestBlock.height,
        "newestBlock height"
      )
    })

    it("should read to first block", async function() {
      this.timeout(5000)
      if (!existsSync(Config.zcashLargeTestDataPath)) {
        this.skip()
      }
      // deliberately old date will require reading to oldest block
      let chain = await reader.subset(new Date(1900, 1, 1), new Date())
      return expect(chain.oldestBlock).has.property(
        "hash",
        "00040fe8ec8471911baa1db1266ea15dd06b4a8a5c453883c000b031973dce08"
      )
    })

    it("should handle a misbehaving BlockStorage that returns null block", async function() {
      let mockStorage = sandbox.createStubInstance<MockBlockStorage>(
        MockBlockStorage
      )
      mockStorage.getBlockCount.resolves(10)
      mockStorage.getBlockHash.resolves(null)
      mockStorage.getBlock.resolves(null)

      reader = new BlockchainReader(mockStorage)
      let chainPromise = reader.subset(new Date(1900, 1, 1), new Date())
      return expect(chainPromise).to.be.rejectedWith(
        /Storage returned null block for height \d+/
      )
    })

    it.skip("should work with start time after block's time, end time before end block's time", async function() {})
  })

  describe("previous", function() {
    beforeEach(() => {
      reader = new BlockchainReader(
        new BlockStorageFileSystem(
          Config.zcashTinyTestDataBlocksPath,
          false,
          ZChainApiBlockStorage.calculateRewardForBlockHeight
        )
      )
    })

    it("should return a single ancestor", async function() {
      let b = reader.newestBlock()
      let prev = reader.previous(await b)
      return expect(prev).to.eventually.not.be.null
    })

    it("should return multiple ancestors", async function() {
      let b = await reader.newestBlock()
      let prev0 = reader.previous(await b)
      let prev1 = reader.previous(await prev0)
      let prev2 = reader.previous(await prev1)

      return Promise.all([
        expect(prev0).to.eventually.not.be.null,
        expect(prev1).to.eventually.not.be.null,
        expect(prev2).to.eventually.be.null
      ])
    })

    it("should support genesis block", async function() {
      let mockBlock: MockBlock = new MockBlock(
        "one",
        1,
        Date.now() / 1000,
        null
      )
      let mockStorage = sandbox.createStubInstance<MockBlockStorage>(
        MockBlockStorage
      )
      mockStorage.getBlockCount.resolves(1)
      mockStorage.getBlockFromHeight
        .withArgs(mockBlock.height - 1)
        .resolves(mockBlock)
      reader = new BlockchainReader(mockStorage)

      let newest = reader.newestBlock()
      let prev = reader.previous(await newest)

      return expect(prev).to.eventually.be.null
    })
  })
})
