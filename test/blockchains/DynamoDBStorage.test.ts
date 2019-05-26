import { expect } from "chai"
import * as sinon from "sinon"
import * as _ from "lodash"
import { DynamoDBStorage } from "../../src/blockchains/DynamoDB/DynamoDBStorage"
import { MockBlock } from "../mocks"
import { setTimeout } from "timers"

describe("DynamoDBStorage", function() {
  let storage: DynamoDBStorage
  let sandbox: sinon.SinonSandbox

  beforeEach(async function() {
    // TODO: Use an environment variable to use DynamoDB Local. If not found, use mocks for DDB.
    // Assumes DynamoDB Local is running on default port
    this.timeout(26000)
    storage = new DynamoDBStorage("LOCAL", "test-zcash-blocks")
    await storage.createTable(true)
    sandbox = sinon.sandbox.create()
  })

  afterEach(function() {
    if (sandbox) sandbox.restore()
    sandbox = null
  })

  describe("getBlockCount", function() {
    it("should be zero when empty", async function() {
      return expect(await storage.getBlockCount()).to.equal(0)
    })

    it("putBlock + getBlockCount", async function() {
      let block = new MockBlock("b1", 100)
      await storage.putBlock(block)
      expect(await storage.getBlockCount()).to.equal(101)

      block = new MockBlock("b2", 200)
      await storage.putBlock(block)
      return expect(await storage.getBlockCount()).to.equal(201)
    })
  })

  describe("putBlock + getBlockHash", function() {
    it("should find hash", async function() {
      let block = new MockBlock("b1", 100)
      expect(
        await storage.getBlockHash(block.height),
        "shouldn't exist before put"
      ).to.be.null
      await storage.putBlock(block)
      expect(
        await storage.getBlockHash(block.height),
        "should exist after put"
      ).to.equal(block.hash)
    })
  })

  describe("putBlock + getBlockFromHeight", function() {
    it("should find block", async function() {
      let block = new MockBlock("b1", 100)
      expect(
        await storage.getBlockFromHeight(block.height),
        "shouldn't exist before put"
      ).to.be.null
      await storage.putBlock(block)
      expect(
        await storage.getBlockFromHeight(block.height),
        "should exist after put"
      ).to.have.property("height", block.height)
    })
  })

  describe("putBlock + getBlock", function() {
    it("should put a block and find block", async function() {
      let block = new MockBlock("b1", 100)
      expect(await storage.getBlock(block.hash), "shouldn't exist before put")
        .to.be.null
      await storage.putBlock(block)
      expect(
        await storage.getBlock(block.hash),
        "should exist after put"
      ).to.have.property("hash", block.hash)
    })
  })

  describe("putBlock validation", function() {
    it("should enforce non-empty hash", async function() {
      let block = new MockBlock("", 100)
      expect(storage.putBlock(block)).to.be.rejectedWith(
        /block hash must be a non-empty string/
      )
      block = new MockBlock(null, 100)
      expect(storage.putBlock(block)).to.be.rejectedWith(
        /block hash must be a non-empty string/
      )
    })

    it("should enforce non-negative height", async function() {
      let block = new MockBlock("blah", -1)
      expect(storage.putBlock(block)).to.be.rejectedWith(
        /block height must be a positive integer/
      )
    })

    it("should enforce non-null height", async function() {
      let block = new MockBlock("blah", null)
      expect(storage.putBlock(block)).to.be.rejectedWith(
        /block height must be a positive integer/
      )
    })

    it("should enforce non-null block", async function() {
      let block = null
      expect(storage.putBlock(block)).to.be.rejectedWith(/block cannot be null/)
    })
  })
})
