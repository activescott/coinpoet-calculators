/* eslint-env mocha */
import { expect } from "chai"
import * as sinon from "sinon"
import * as _ from "lodash"
import { ZChainApiBlockStorage } from "../../src/blockchains/ZChainApiBlockStorage"

describe("ZChainApiBlockStorage", function() {
  let sandbox: sinon.SinonSandbox
  let storage: ZChainApiBlockStorage

  beforeEach(() => {
    sandbox = sinon.sandbox.create()
    storage = new ZChainApiBlockStorage()
  })

  afterEach(() => {
    sandbox.restore()
    sandbox = null
  })

  describe("getBlockCount", function() {
    it("should return correct count", async function() {
      let count = await storage.getBlockCount()
      expect(count).to.be.greaterThan(335000)
    })
  })

  describe("getBlockHash", function() {
    it("should return correct hash", async function() {
      expect(await storage.getBlockHash(27884)).to.equal(
        "0000000031a021fe49de76ba35cce20ce1cbd071c30dbfebeda7bb403df9ecea"
      )
    })

    it("should validate height is integer", async function() {
      const fn = () => storage.getBlockHash(1.01)
      return expect(fn()).to.be.rejectedWith(
        /height must be provided as a positive integer, but was/
      )
    })

    it("should validate height is not null", async function() {
      const fn = () => storage.getBlockHash(null)
      return expect(fn()).to.be.rejectedWith(
        /height must be provided as a positive integer, but was/
      )
    })

    it("should support block 0", async function() {
      const fn = () => storage.getBlockHash(0)
      return expect(fn()).to.eventually.equal(
        "00040fe8ec8471911baa1db1266ea15dd06b4a8a5c453883c000b031973dce08"
      )
    })
  })

  describe("getBlock", function() {
    it("should return correct block", async function() {
      const b = await storage.getBlock(
        "0000000031a021fe49de76ba35cce20ce1cbd071c30dbfebeda7bb403df9ecea"
      )
      expect(b).to.have.property(
        "hash",
        "0000000031a021fe49de76ba35cce20ce1cbd071c30dbfebeda7bb403df9ecea"
      )
      expect(b).to.have.property("height", 27884)
    })

    it("should validate blockHash", async function() {
      const fn = () => storage.getBlock(null)
      return expect(fn()).to.be.rejectedWith(/blockHash must be provided/)
    })

    it("should support block 0", async function() {
      return expect(
        storage.getBlock(
          "00040fe8ec8471911baa1db1266ea15dd06b4a8a5c453883c000b031973dce08"
        )
      ).to.eventually.have.property("height", 0)
    })

    describe("block reward", function() {
      it("should know reward era 1", async function() {
        // Reward blocks & havling info: https://z.cash/support/faq/#zec-per-block
        // Founders reward: https://z.cash/blog/funding
        // NOTE: We exclude founder's reward and provide only the "miner's reward".
        return expect(
          await storage.getBlock(
            "00040fe8ec8471911baa1db1266ea15dd06b4a8a5c453883c000b031973dce08"
          )
        ).to.have.property("reward", 10)
      })

      it("should know reward era 3", async function() {
        return expect(
          await storage.getBlock(
            "0000000031a021fe49de76ba35cce20ce1cbd071c30dbfebeda7bb403df9ecea"
          )
        ).to.have.property("reward", 10)
      })
    })
  })
})
