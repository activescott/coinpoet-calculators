import { expect } from "chai"
import * as sinon from "sinon"
import * as _ from "lodash"
import { DynamoDBStorage } from "../../src/blockchains/DynamoDB/DynamoDBStorage"
import { MockBlock } from "../mocks"
import { DDB } from "../../src/blockchains/DynamoDB/DDB"
import { SinonStubbedInstance } from "sinon"

describe("DynamoDBStorage", function() {
  let storage: DynamoDBStorage
  let sandbox: sinon.SinonSandbox
  let ddbMock: SinonStubbedInstance<DDB>
  // true, this class mocks DDB. Else, will use DynamoDB Local @ http://localhost:8000
  let doMocks: boolean = true

  beforeEach(async function() {
    // TODO: Use an environment variable to use DynamoDB Local. If not found, use mocks for DDB.
    // Assumes DynamoDB Local is running on default port
    this.timeout(26000)
    sandbox = sinon.sandbox.create()
    ddbMock = doMocks ? sandbox.createStubInstance<DDB>(DDB) : null
    storage = new DynamoDBStorage("LOCAL", "test-zcash-blocks", ddbMock)
    if (!doMocks) {
      await storage.createTable(true)
    }
  })

  afterEach(function() {
    if (sandbox) sandbox.restore()
    sandbox = null
  })

  describe("getBlockCount", function() {
    it("should be zero when empty", async function() {
      if (doMocks) {
        ddbMock.get.resolves({
          Item: { hash: "0" }
        })
      }
      return expect(await storage.getBlockCount()).to.equal(0)
    })

    it("putBlock + getBlockCount", async function() {
      if (doMocks) {
        ddbMock.get
          .onCall(0)
          .resolves({
            Item: null
          })
          .onCall(1)
          .resolves({
            Item: { hash: "101" }
          })
          .onCall(2)
          .resolves({
            Item: { hash: "101" }
          })
          .onCall(3)
          .resolves({
            Item: { hash: "201" }
          })
      }

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
      if (doMocks) {
        ddbMock.get
          .onCall(0)
          .resolves({})
          .onCall(2)
          .resolves({
            Item: { hash: "b1", height: 100 }
          })
      }
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
      if (doMocks) {
        ddbMock.get
          .onCall(0)
          .resolves({}) // getBlockFromHeight
          .onCall(1)
          .resolves({}) // putBlock
          .onCall(2)
          .resolves({
            // getBlockFromHeight > getBlockHash
            Item: { hash: "b1", height: 100 }
          })
        ddbMock.query.onCall(0).resolves({
          // getBlockFromHeight > getBlock
          Items: [{ hash: "b1", height: 100 }]
        })
      }
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
      if (doMocks) {
        ddbMock.query
          .onCall(0)
          .resolves({})
          .onCall(1)
          .resolves({
            Items: [{ hash: "b102", height: 102 }]
          })
      }
      expect(await storage.getBlock("b102"), "shouldn't exist before put").to.be
        .null

      // putting three blocks, get the one in the middle since putBlock uses query and potentially gets multiple results.
      await storage.putBlock(new MockBlock("b101", 101))
      await storage.putBlock(new MockBlock("b102", 102))
      await storage.putBlock(new MockBlock("b103", 103))

      expect(
        await storage.getBlock("b102"),
        "should exist after put"
      ).to.have.property("hash", "b102")
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
