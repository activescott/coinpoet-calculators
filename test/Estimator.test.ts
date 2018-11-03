/* eslint-env mocha */
import { expect } from "chai"
import * as sinon from "sinon"
import * as _ from "lodash"
import { BigNumber } from "bignumber.js"
import { Estimator, EstimateFutureEarningsOptions } from "../src/Estimator"
import { BlockStorageFileSystem } from "../src/blockchains/BlockStorageFileSystem"
import { Config } from "../src/Config"
import { existsSync } from "fs"
import { Block } from "../src/interfaces"
import { MockBlock, MockBlockWithNetworkHashRate } from "./mocks/MockBlock"

describe("Estimator", function() {
  let sandbox: sinon.SinonSandbox

  beforeEach(() => {
    sandbox = sinon.sandbox.create()
  })

  afterEach(() => {
    sandbox.restore()
    sandbox = null
  })

  describe("dailyEarnings", function() {
    it("network hash and time based", function() {
      let yourHashesPerSecond = new BigNumber(290)
      let networkHashesPerSecond = new BigNumber(492451309)
      let meanNetworkSecondsBetweenBlocks = 147.29166
      let ZECUSD = 241.23
      let watts = 190
      let electricityCostKwh = 0.1
      let dailyEarnings = Estimator.estimateDailyEarnings({
        yourHashesPerSecond,
        networkHashesPerSecond,
        meanNetworkSecondsBetweenBlocks,
        rewardedCoinsPerMinedBlock: 10,
        fiatPerCoinsExchangeRate: ZECUSD,
        watts,
        electricityCostKwh
      })
      expect(dailyEarnings).to.be.closeTo(0.37, 0.01)
    })
  })

  describe("estimateFutureEarnings", function() {
    it("multiple days total + callback", function() {
      let yourHashesPerSecond = new BigNumber(290)
      let networkHashesPerSecond = new BigNumber(492451309)
      let meanNetworkSecondsBetweenBlocks = 147.29166
      let ZECUSD = 241.23
      let watts = 190
      let electricityCostKwh = 0.1
      let networkHashRateChangePerDay = new BigNumber(0)

      let dailyEarningsArray = Estimator.estimateFutureEarnings({
        timeHorizonInDays: 3,
        networkHashRateChangePerDay,
        yourHashesPerSecond,
        networkHashesPerSecond,
        meanNetworkSecondsBetweenBlocks,
        rewardedCoinsPerMinedBlock: 10,
        fiatPerCoinsExchangeRate: ZECUSD,
        watts,
        electricityCostKwh,
        feesAsPercent: 0.01
      })

      expect(dailyEarningsArray).to.have.length(3)
      expect(dailyEarningsArray[0])
        .has.property("totalProfit")
        .that.is.closeTo(0.36, 0.01)
      expect(dailyEarningsArray[1])
        .has.property("totalProfit")
        .that.is.closeTo(0.73, 0.01)
      expect(dailyEarningsArray[2])
        .has.property("totalProfit")
        .that.is.closeTo(1.1, 0.01)
    })

    it("should validate timeHorizonInDays not null", async function() {
      const options: EstimateFutureEarningsOptions = {
        timeHorizonInDays: null,
        yourHashesPerSecond: new BigNumber(290),
        networkHashesPerSecond: new BigNumber(492451309),
        meanNetworkSecondsBetweenBlocks: 147.29166,
        rewardedCoinsPerMinedBlock: 10,
        fiatPerCoinsExchangeRate: 241.23,
        watts: 190,
        electricityCostKwh: 0.1,
        networkHashRateChangePerDay: new BigNumber(0),
        feesAsPercent: 0.01
      }
      const fn = () => Estimator.estimateFutureEarnings(options)
      return expect(fn).to.throw(/timeHorizonInDays must be greater than zero/)
    })

    it("should validate timeHorizonInDays > 0", async function() {
      const options: EstimateFutureEarningsOptions = {
        timeHorizonInDays: -1,
        yourHashesPerSecond: new BigNumber(290),
        networkHashesPerSecond: new BigNumber(492451309),
        meanNetworkSecondsBetweenBlocks: 147.29166,
        rewardedCoinsPerMinedBlock: 10,
        fiatPerCoinsExchangeRate: 241.23,
        watts: 190,
        electricityCostKwh: 0.1,
        networkHashRateChangePerDay: new BigNumber(0),
        feesAsPercent: 0.01
      }
      const fn = () => Estimator.estimateFutureEarnings(options)
      return expect(fn).to.throw(/timeHorizonInDays must be greater than zero/)
    })
  })

  describe("estimateNetworkHashRate", function() {
    it("should return legit value", async function() {
      if (!existsSync(Config.zcashLargeTestDataPath)) {
        this.skip()
        return
      }
      let bs = new BlockStorageFileSystem(Config.zcashLargeTestDataPath)
      let testBlock = await bs.getBlockFromHeight(334000)
      let val = await Estimator.estimateNetworkHashRate(testBlock, 120)
      // expected value comes from `docker exec zc ./src/zcash-cli getnetworkhashps 120 334000` on a zcash full node
      expect(val.toNumber()).to.be.closeTo(507644980, 1)
    })

    it("should validate newestBlock", async function() {
      const fn = () => Estimator.estimateNetworkHashRate(null)
      return expect(fn()).to.be.rejectedWith(/newestBlock must be provided/)
    })

    it("should validate lookbackCount", async function() {
      let bs = new BlockStorageFileSystem(Config.zcashTinyTestDataBlocksPath)
      let testBlock = await bs.getBlockFromHeight(334480)
      const fn = () => Estimator.estimateNetworkHashRate(testBlock, -1)
      return expect(fn()).to.be.rejectedWith(
        /lookbackCount must be greater than or equal to zero/
      )
    })

    it("should work when reate change is zero", async function() {
      let bs = new BlockStorageFileSystem(Config.zcashTinyTestDataBlocksPath)
      let testBlock = await bs.getBlockFromHeight(334480)
      const fn = () => Estimator.estimateNetworkHashRate(testBlock, 0)
      let val = await fn()
      return expect(val.toNumber()).to.equal(0)
    })
  })

  describe("estimateNetworkHashRateDailyChangeBetweenBlocks", function() {
    it("estimateDailyChangeInNetworkHashRate 1 day", function() {
      const newBlock = new MockBlockWithNetworkHashRate(
        "newBlock",
        0,
        new Date(2018, 3, 18, 17).valueOf() / 1000,
        "newBlockPrev",
        "1010101",
        new BigNumber(26679207 * 10 ** 12)
      )
      const oldBlock = new MockBlockWithNetworkHashRate(
        "oldblock",
        0,
        new Date(2018, 3, 17, 17).valueOf() / 1000,
        "oldBlockPrev",
        "1010101",
        new BigNumber(25990711 * 10 ** 12)
      )
      const val = Estimator.estimateNetworkHashRateDailyChangeBetweenBlocks(
        oldBlock,
        newBlock
      )
      const valThs = val.dividedBy(10 ** 12).toNumber()
      expect(valThs).to.equal(688496)
    })

    it("estimateDailyChangeInNetworkHashRate 30 days", function() {
      const newBlock = new MockBlockWithNetworkHashRate(
        "newblock",
        0,
        new Date(2018, 4, 18, 17).valueOf() / 1000,
        "newPrev",
        "01010",
        new BigNumber(26679207 * 10 ** 12)
      )
      const oldBlock = new MockBlockWithNetworkHashRate(
        "oldblock",
        0,
        new Date(2018, 3, 17, 17).valueOf() / 1000,
        "prevOld",
        "010101",
        new BigNumber(25990711 * 10 ** 12)
      )
      const val = Estimator.estimateNetworkHashRateDailyChangeBetweenBlocks(
        oldBlock,
        newBlock
      )
      const valThs = val.dividedBy(10 ** 12).toNumber()
      expect(valThs).to.be.closeTo(22209, 1)
    })
  })

  describe("meanTimeBetweenBlocks", function() {
    it("should validate block", function() {
      const fn = async () => Estimator.meanTimeBetweenBlocks(null)
      return expect(fn()).to.be.rejectedWith(/block must be provided/)
    })

    it("should accept block w/o promise", async function() {
      let storage = new BlockStorageFileSystem(
        Config.zcashTinyTestDataBlocksPath
      )
      let block: Block = await storage.getBlockFromHeight(334482)
      const fn = async () => Estimator.meanTimeBetweenBlocks(block, 667)
      return expect(fn()).to.eventually.be.closeTo(334.0, 0.1)
    })

    it("should accept block w/ promise", async function() {
      let storage = new BlockStorageFileSystem(
        Config.zcashTinyTestDataBlocksPath
      )
      let block: Promise<Block> = storage.getBlockFromHeight(334482)
      const fn = async () => Estimator.meanTimeBetweenBlocks(block, 660)
      return expect(fn()).to.eventually.be.closeTo(334.0, 0.1)
    })

    it("should validate lookbackTimeSpanSeconds", function() {
      let storage = new BlockStorageFileSystem(
        Config.zcashTinyTestDataBlocksPath
      )
      let block: Promise<Block> = storage.getBlockFromHeight(334482)
      const fn = async () => Estimator.meanTimeBetweenBlocks(block, 0)
      return expect(fn()).to.be.rejectedWith(
        /lookbackTimeSpanSeconds must be greater than zero/
      )
    })

    it("should handle null previous block", function() {
      // this is a pretty unlikely scenario but lets make sure it is resiliant against a misbehaving block for now.
      let block = sinon.createStubInstance<MockBlock>(MockBlock)
      block.previous.returns(null)
      const fn = async () =>
        Estimator.meanTimeBetweenBlocks((block as any) as Block)
      return expect(fn()).to.be.rejectedWith(
        /provided block must have previous blocks/
      )
    })
  })
})
