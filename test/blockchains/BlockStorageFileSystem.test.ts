/* eslint-env mocha */
import { expect } from "chai"
import * as sinon from "sinon"
import * as _ from "lodash"
import Config from "../../src/Config"
import BlockStorageFileSystem from "../../src/blockchains/BlockStorageFileSystem"

describe("BlockStorageFileSystem", function() {
  let sandbox: sinon.SinonSandbox
  let bsfs: BlockStorageFileSystem

  beforeEach(() => {
    sandbox = sinon.sandbox.create()
    bsfs = new BlockStorageFileSystem(Config.zcashBlocksPath)
  })

  afterEach(() => {
    sandbox.restore()
    sandbox = null
  })

  describe("getBlockCount", function() {
    it("should return correct count", async function() {
      expect(await bsfs.getBlockCount()).to.equal(334483)
    })
  })

  describe("getBlockHash", function() {
    it("should return correct hash", async function() {
      expect(await bsfs.getBlockHash(334482)).to.equal(
        "0000000000be5c830d318b7312a28d396bcb30bac277919bf0db2a5218b41a4e"
      )
    })
  })

  describe("getBlock", function() {
    it("should return correct block", async function() {
      const b = await bsfs.getBlock(
        "000000000899b1bf24331b35b500089d75318a46abdf08644609918e68134c3f"
      )
      expect(b).to.have.property(
        "hash",
        "000000000899b1bf24331b35b500089d75318a46abdf08644609918e68134c3f"
      )
      expect(b).to.have.property("height", 334480)
    })
  })
})
