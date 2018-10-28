/* eslint-env mocha */
import { expect } from "chai"
import * as sinon from "sinon"
import * as _ from "lodash"
import { BigNumber } from "bignumber.js"
import { Estimator } from "../src/Estimator"
import BlockStorageFileSystem from "../src/blockchains/BlockStorageFileSystem"
import Config from "../src/Config"
import { existsSync } from "fs"

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
  })

  describe("estimateDailyChangeInNetworkHashRate", function() {
    it("estimateNetworkHashRate", async function() {
      if (!existsSync(Config.zcashLargeTestDataPath)) {
        this.skip()
        return
      }
      let bs = new BlockStorageFileSystem(Config.zcashLargeTestDataPath)
      let testBlock = await bs.getBlockFromHeight(334000)
      let val = await Estimator.estimateNetworkHashRate(testBlock, 120)
      console.log("val:", val.toFixed(0))
      // expected value comes from `docker exec zc ./src/zcash-cli getnetworkhashps 120 334000` on a zcash full node
      expect(val.toNumber()).to.be.closeTo(507644980, 1)
    })

    it("estimateDailyChangeInNetworkHashRate 1 day", function() {
      let newBlock = {
        hash: "newblock",
        networkHashRate: new BigNumber(26679207 * 10 ** 12),
        time: new Date(2018, 3, 18, 17).valueOf() / 1000
      }
      let oldBlock = {
        hash: "oldblock",
        networkHashRate: new BigNumber(25990711 * 10 ** 12),
        time: new Date(2018, 3, 17, 17).valueOf() / 1000
      }

      let val = Estimator.estimateNetworkHashRateDailyChangeBetweenBlocks(
        oldBlock,
        newBlock
      )
      let valThs = val.dividedBy(10 ** 12).toNumber()
      expect(valThs).to.equal(688496)
    })

    it("estimateDailyChangeInNetworkHashRate 30 days", function() {
      let newBlock = {
        hash: "newblock",
        height: 0,
        networkHashRate: new BigNumber(26679207 * 10 ** 12),
        time: new Date(2018, 4, 18, 17).valueOf() / 1000
      }
      let oldBlock = {
        hash: "oldblock",
        height: 0,
        networkHashRate: new BigNumber(25990711 * 10 ** 12),
        time: new Date(2018, 3, 17, 17).valueOf() / 1000
      }

      let val = Estimator.estimateNetworkHashRateDailyChangeBetweenBlocks(
        oldBlock,
        newBlock
      )
      let valThs = val.dividedBy(10 ** 12).toNumber()
      expect(valThs).to.be.closeTo(22209, 1)
    })
  })
})
