/* eslint-env mocha */
import * as path from 'path'
import { expect } from 'chai'
import * as sinon from 'sinon'
import * as _ from 'lodash'
import { BigNumber } from 'bignumber.js'
import { Block } from '../src/interfaces'
import { Estimator } from '../src/Estimator'
import BlockStorageFileSystem from '../src/blockchains/BlockStorageFileSystem'
import Config from '../Config'


describe('Estimator', function () {
  let sandbox: sinon.SinonSandbox

  beforeEach(() => {
    sandbox = sinon.sandbox.create()
  })

  afterEach(() => {
    sandbox.restore()
    sandbox = null
  })

  describe('dailyEarnings', function () {
    it('network hash and time based', function () {
      let yourHashesPerSecond = new BigNumber(290)
      let networkHashesPerSecond = new BigNumber(492451309)
      let meanNetworkSecondsBetweenBlocks = 147.29166
      let poolHashesPerSecond = 2436000
      let ZECUSD = 241.23
      let watts = 190
      let electricityCostKwh = 0.1
      let dailyEarnings = Estimator.dailyEarnings(yourHashesPerSecond, networkHashesPerSecond, meanNetworkSecondsBetweenBlocks, 10, ZECUSD, watts, electricityCostKwh)
      expect(dailyEarnings).to.be.closeTo(0.37, 0.01)
    })
  })
  
  describe('estimateFutureEarnings', function () {
    it('multiple days total + callback', function () {
      let yourHashesPerSecond = new BigNumber(290)
      let networkHashesPerSecond = new BigNumber(492451309)
      let meanNetworkSecondsBetweenBlocks = 147.29166
      let poolHashesPerSecond = new BigNumber(2436000)
      let ZECUSD = 241.23
      let watts = 190
      let electricityCostKwh = 0.1
      let networkDailyHashRateChange = new BigNumber(0)
      
      let dailyEarningsArray = Estimator.estimateFutureEarnings(3, networkDailyHashRateChange, yourHashesPerSecond, networkHashesPerSecond, meanNetworkSecondsBetweenBlocks, 10, ZECUSD, watts, electricityCostKwh, 0.01)

      expect(dailyEarningsArray).to.have.length(3)
      expect(dailyEarningsArray[0]).has.property('totalProfit').that.is.closeTo(0.36, 0.01)
      expect(dailyEarningsArray[1]).has.property('totalProfit').that.is.closeTo(0.73, 0.01)
      expect(dailyEarningsArray[2]).has.property('totalProfit').that.is.closeTo(1.10, 0.01)
    })
  })

  describe('estimateDailyChangeInNetworkHashRate', function () {
    it('estimateNetworkHashRate', async function () {
      let bs = new BlockStorageFileSystem(Config.zcashBlocksPath)
      let testBlock = await bs.getBlockFromHeight(334000)
      let val = await Estimator.estimateNetworkHashRate(testBlock, 120)
      console.log('val:', val.toFixed(0))
      // expected value comes from `docker exec zc ./src/zcash-cli getnetworkhashps 120 334000` on a zcash full node
      expect(val.toNumber()).to.be.closeTo(507644980, 1)
    })

    it('estimateDailyChangeInNetworkHashRate 1 day', function () {
      let newBlock = { 
        hash: 'newblock',
        networkHashRate: new BigNumber(26679207 * 10**12),
        time: new Date(2018, 3, 18, 17).valueOf() / 1000
      }
      let oldBlock = { 
        hash: 'oldblock',
        networkHashRate: new BigNumber(25990711 * 10**12),
        time: new Date(2018, 3, 17, 17).valueOf() / 1000
      }
     
      let val = Estimator.estimateDailyChangeInNetworkHashRate(oldBlock, newBlock)
      let valThs = val.dividedBy(10**12).toNumber()
      expect(valThs).to.equal(688496)
    })

    it('estimateDailyChangeInNetworkHashRate 30 days', function () {
      let newBlock = {
        hash: 'newblock',
        height: 0,
        networkHashRate: new BigNumber(26679207 * 10**12),
        time: new Date(2018, 4, 18, 17).valueOf() / 1000
      }
      let oldBlock = { 
        hash: 'oldblock',
        height: 0,
        networkHashRate: new BigNumber(25990711 * 10**12),
        time: new Date(2018, 3, 17, 17).valueOf() / 1000
      }
     
      let val = Estimator.estimateDailyChangeInNetworkHashRate(oldBlock, newBlock)
      let valThs = val.dividedBy(10**12).toNumber()
      expect(valThs).to.be.closeTo(22209, 1)
    })
  })

  describe('estimate zcash', function () {
    it('estimateNetworkHashRateZCash', async function () {
      let from = new Date(2018, 1, 1)
      let to = new Date(2018, 3, 1)

      let val = await Estimator.estimateDailyChangeInNetworkHashRateZCash(from, to)
      let valThs = val.dividedBy(10**12).toNumber()
      let valMhs = val.dividedBy(10**9).toNumber()
      console.log('valThs:', valThs.toFixed(4))
      console.log('valMhs:', valMhs.toFixed(4))
      console.log('valHs:', val.toFixed(4))
      //NOTE: expected is not based on an independent reference. just using it to know if the calc changes.
      let expected = 2095695.6812251646
      expect(val.toNumber()).to.be.closeTo(expected, 1)
    })
  })
})
