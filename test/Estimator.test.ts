/* eslint-env mocha */
import { expect } from "chai"
import * as sinon from "sinon"
import * as _ from "lodash"
import { BigNumber } from "bignumber.js"
import { Estimator, EstimateFutureEarningsOptions } from "../src/Estimator"
import { secondsToDays, toTeraHashesPerSecond } from "../src/lib"
import { BlockStorageFileSystem } from "../src/blockchains/BlockStorageFileSystem"
import { Config } from "../src/Config"
import { existsSync } from "fs"
import { Block } from "../src/interfaces"
import { MockBlock, MockBlockWithNetworkHashRate } from "./mocks/MockBlock"

const TERAHASHES = 10 ** 12

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

  describe("blockWithNetworkHashRate", async function() {
    it("should return legit value", async function() {
      if (!existsSync(Config.zcashLargeTestDataPath)) {
        this.skip()
        return
      }
      let bs = new BlockStorageFileSystem(Config.zcashLargeTestDataPath)
      let testBlock = await bs.getBlockFromHeight(334000)
      let val = await Estimator.blockWithNetworkHashRate(testBlock)
      // expected value comes from `docker exec zc ./src/zcash-cli getnetworkhashps 120 334000` on a zcash full node
      expect(val.networkHashRate.toNumber()).to.be.closeTo(507644980, 1)
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

    it("should work when rate change is zero", async function() {
      let bs = new BlockStorageFileSystem(Config.zcashTinyTestDataBlocksPath)
      let testBlock = await bs.getBlockFromHeight(334480)
      const fn = () => Estimator.estimateNetworkHashRate(testBlock, 0)
      let val = await fn()
      return expect(val.toNumber()).to.equal(0)
    })
  })

  describe("estimateNetworkHashRateDailyChange", function() {
    it("should validate newestBlock", async function() {
      const newestBlock: Block = null
      return expect(
        Estimator.estimateNetworkHashRateDailyChange(newestBlock)
      ).to.be.rejectedWith(/newestBlock cannot be null/)
    })

    it("1 day", async function() {
      // NOTE: for test data I just grabed some random blocks off of zchain approx 1 day apart: (~576 blocks, but I used 600 just to be sure):
      // https://api.zcha.in/v2/mainnet/blocks/400000 - Tue 25 Sep 2018 07:11:57 PDT
      const newBlock = new MockBlock(
        "newBlock",
        400000,
        1537884717,
        "newBlockPrev-00000000031046a227f30601f9506aeded3c22e615a68579f5393e7c52baa506",
        new BigNumber(
          "0x0000000000000000000000000000000000000000000000000045b702f16b1b52"
        )
      )
      // https://zcha.in/blocks/399417 - Mon 24 Sep 2018 07:11:13 PDT
      const midBlock = new MockBlock(
        "midBlock",
        399417,
        1537798273,
        "midBlockPrev-000000000217c4ee4b030fc97eca1e57e12543437737b54ca8851e0fc3c564df",
        new BigNumber(
          "0x0000000000000000000000000000000000000000000000000045401667bafe13"
        )
      )
      // https://zcha.in/blocks/398847 - Sun 23 Sep 2018 07:10:46 PDT
      const oldBlock = new MockBlock(
        "oldblock",
        398847,
        1537711846,
        "oldBlockPrev-0000000000481203655e60932a79c6699f1d086268ddc8cf609c2a338de326b7",
        new BigNumber(
          "0x0000000000000000000000000000000000000000000000000044bf86637bcf03"
        )
      )
      // now we build a fake chain by putting blocks between `newBlock` and `oldBlock`.
      // Basically we just create block 15s before the most recent block until we get to the oldBlock's time and monkeypatch previous:
      const monkeyPatchPrevious = (blockToPatch: Block, previous: Block) => {
        blockToPatch.previous = async function() {
          return previous
        }
      }
      function fakeChainBetween(newest: Block, oldest: Block) {
        let latestBlock = newest
        let blockCount = 0
        const blockTime = 150
        let expectedBlockCount = (newest.time - oldest.time) / blockTime
        for (
          let blockCount = 0;
          blockCount <= expectedBlockCount;
          blockCount++
        ) {
          let time = latestBlock.time - 150
          // create a smooth average change in chanWork from oldest to newest:
          let chainWorkDeltaPerBlock = newest.chainWork
            .minus(oldest.chainWork)
            .dividedBy(expectedBlockCount)
          let chainWork = oldest.chainWork.plus(
            chainWorkDeltaPerBlock.multipliedBy(expectedBlockCount - blockCount)
          )
          let tempBlock = new MockBlock(
            `hash_${time}`,
            0, // unused
            time,
            "unused",
            chainWork
          )
          monkeyPatchPrevious(latestBlock, tempBlock)
          latestBlock = tempBlock
        }
        monkeyPatchPrevious(latestBlock, oldest)
        monkeyPatchPrevious(oldest, null)
      }
      fakeChainBetween(newBlock, midBlock)
      fakeChainBetween(midBlock, oldBlock)

      // fake chain complete. Now test it:
      let val = await Estimator.estimateNetworkHashRateDailyChange(newBlock, 1)
      // NOTE: Just a static value recorded from running the test in the past. Since we're using fake chain data above don't have a comparable in a real chain for this value
      const expectedDailyChange = -134179646.97274292
      expect(val.toNumber()).to.be.closeTo(expectedDailyChange, 1)
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
        new BigNumber(26679207 * TERAHASHES)
      )
      const oldBlock = new MockBlockWithNetworkHashRate(
        "oldblock",
        0,
        new Date(2018, 3, 17, 17).valueOf() / 1000,
        "oldBlockPrev",
        "1010101",
        new BigNumber(25990711 * TERAHASHES)
      )
      const val = Estimator.estimateNetworkHashRateDailyChangeBetweenBlocks(
        oldBlock,
        newBlock
      )
      const valThs = val.dividedBy(TERAHASHES).toNumber()
      expect(valThs).to.equal(688496)
    })

    it("estimateDailyChangeInNetworkHashRate 30 days", function() {
      const newBlock = new MockBlockWithNetworkHashRate(
        "newblock",
        0,
        new Date(2018, 4, 18, 17).valueOf() / 1000,
        "newPrev",
        "01010",
        new BigNumber(26679207 * TERAHASHES)
      )
      const oldBlock = new MockBlockWithNetworkHashRate(
        "oldblock",
        0,
        new Date(2018, 3, 17, 17).valueOf() / 1000,
        "prevOld",
        "010101",
        new BigNumber(25990711 * TERAHASHES)
      )
      const val = Estimator.estimateNetworkHashRateDailyChangeBetweenBlocks(
        oldBlock,
        newBlock
      )
      const valThs = val.dividedBy(TERAHASHES).toNumber()
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
