import { expect } from "chai"
import * as sinon from "sinon"
import * as _ from "lodash"

import { DynamoDBStorage } from "../../src/blockchains/DynamoDBStorage"

describe("DynamoDBStorage", function() {
  let storage: DynamoDBStorage

  beforeEach(() => {
    storage = new DynamoDBStorage()
  })

  describe("getBlockCount", function() {})

  describe("getBlockHash", function() {})

  describe("getBlock", function() {})

  describe("getBlockFromHeight", function() {})

  describe("putBlock", function() {})
})
