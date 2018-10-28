/* eslint-env mocha */
import { expect } from "chai"
import * as sinon from "sinon"
import * as _ from "lodash"

import JsonBlock from "../../src/lib/JsonBlock"
import { MockBlockStorage } from "../mocks/MockBlockStorage"

describe("JsonBlock", function() {
  const mockTime = new Date(2009, 1, 3).valueOf() / 1000

  describe("constructor", function() {
    it("should require owningStorage", function() {
      const ctor = () =>
        new JsonBlock(
          null,
          "hash",
          100,
          mockTime,
          "previous hash",
          "909099090090990"
        )
      return expect(ctor).to.throw(/owningStorage must be provided/)
    })

    it("should require hash", function() {
      const ctor = () =>
        new JsonBlock(
          new MockBlockStorage(),
          null,
          100,
          mockTime,
          "previous hash",
          "909099090090990"
        )
      return expect(ctor).to.throw(/block hash must be provided/)
    })

    it("should require height", function() {
      const ctor = () =>
        new JsonBlock(
          new MockBlockStorage(),
          "hash",
          null,
          mockTime,
          "previous hash",
          "909099090090990"
        )
      return expect(ctor).to.throw(/block height must be an integer/)
    })

    it("should require height to be positive", function() {
      const ctor = () =>
        new JsonBlock(
          new MockBlockStorage(),
          "hash",
          -1,
          mockTime,
          "previous hash",
          "909099090090990"
        )
      return expect(ctor).to.throw(/block height must be a positive integer/)
    })

    it("should require time", function() {
      const ctor = () =>
        new JsonBlock(
          new MockBlockStorage(),
          "hash",
          100,
          null,
          "previous hash",
          "909099090090990"
        )
      return expect(ctor).to.throw(
        /Expected block time to be later than year \d{4}/
      )
    })

    it("should require previous", function() {
      const ctor = () =>
        new JsonBlock(
          new MockBlockStorage(),
          "hash",
          100,
          mockTime,
          null,
          "909099090090990"
        )
      return expect(ctor).to.throw(/previousBlockHash must be provided/)
    })
  })

  describe("previous", function() {
    it("should return null for block 0", function() {
      let b = new JsonBlock(
        new MockBlockStorage(),
        "hash",
        0,
        mockTime,
        "",
        "909099090090990"
      )
      return expect(b.previous()).to.eventually.be.null
    })
  })
})
