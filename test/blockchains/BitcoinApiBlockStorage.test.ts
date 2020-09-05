/* eslint-env mocha */
import { expect } from "chai"
import * as sinon from "sinon"
import * as _ from "lodash"
import { BitcoinApiBlockStorage } from "../../src/blockchains/BitcoinApiBlockStorage"

describe("BitcoinApiBlockStorage", function() {
  this.timeout(10000)
  let storage: BitcoinApiBlockStorage

  beforeEach(() => {
    storage = new BitcoinApiBlockStorage()
  })

  describe("getBlockCount", function() {
    it("should return correct count", async function() {
      let count = await storage.getBlockCount()
      expect(count).to.be.greaterThan(540000)
    })
  })

  describe("getBlockHash", function() {
    it("should return correct hash", async function() {
      expect(await storage.getBlockHash(546464)).to.equal(
        "00000000000000000023fd055e1d8abb7aea81ccd5d2075d783ef95c45a7d7c0"
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

    it("should validate result contains a block", async function() {
      const fn = () => storage.getBlockHash(999999999)
      return expect(fn()).to.be.rejectedWith(
        /no block found for height "999999999"/
      )
    })

    it("should support block 0", async function() {
      const fn = () => storage.getBlockHash(0)
      return expect(fn()).to.eventually.equal(
        "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f"
      )
    })
  })

  describe("getBlock", function() {
    it("should return correct block", async function() {
      const b = await storage.getBlock(
        "00000000000000000023fd055e1d8abb7aea81ccd5d2075d783ef95c45a7d7c0"
      )
      expect(b).to.have.property(
        "hash",
        "00000000000000000023fd055e1d8abb7aea81ccd5d2075d783ef95c45a7d7c0"
      )
      return expect(b).to.have.property("height", 546464)
    })

    it("should validate blockHash", async function() {
      const fn = () => storage.getBlock(null)
      return expect(fn()).to.be.rejectedWith(/blockHash must be provided/)
    })

    it("should validate result contains a block", async function() {
      const fn = () => storage.getBlock("0000decafbad")
      return expect(fn()).to.be.rejectedWith(
        /no block found for blockHash "0000decafbad"/
      )
    })

    it("should support block 0", async function() {
      const fn = () =>
        storage.getBlock(
          "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f"
        )
      return expect(fn()).to.eventually.have.property("height", 0)
    })

    describe("block reward", function() {
      it("should know reward era 1", async function() {
        return expect(
          await storage.getBlock(
            "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f"
          )
        ).to.have.property("reward", 50)
      })

      it("should know reward era 3", async function() {
        return expect(
          await storage.getBlock(
            "00000000000000000023fd055e1d8abb7aea81ccd5d2075d783ef95c45a7d7c0"
          )
        ).to.have.property("reward", 12.5)
      })
    })
  })
})
