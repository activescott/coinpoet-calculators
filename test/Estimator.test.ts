/* eslint-env mocha */
import { expect } from 'chai'
import * as sinon from 'sinon'
import * as _ from 'lodash'
import { BigNumber } from 'bignumber.js'

import { Estimator } from '../src/Estimator'

describe('Estimator', function () {

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
    it('estimateNetworkHashRate', function () {
      // https://blockchain.info/charts/hash-rate?timespan=180days&showDataPoints=true
      /*
       * 3/18/18 17:00: 26,279,607 TH/s = 26279607 * 10^12 H/s
       * 
       */
      // https://api.blockchair.com/bitcoin/blocks?q=id(509787)
      let b1 = {
        chainWork: new BigNumber('0x0000000000000000000000000000000000000000011d35499c9e9979caca8fa0'),
        timestamp: new Date(2018, 2, 18, 15, 58, 21).valueOf() / 1000
      }
      // https://api.blockchair.com/bitcoin/blocks?q=id(514111)
      let b2 = {
        chainWork: new BigNumber('0x0000000000000000000000000000000000000000014d5da4cf638ba718fafa60'),
        timestamp: new Date(2018, 3, 18, 16, 50, 46).valueOf() / 1000
      }
     
      let val = Estimator.estimateNetworkHashRate(b1, b2)
      // in fact it was estimated as actually to be 26279607000000000000 at that time by https://blockchain.info/charts/hash-rate?timespan=180days&showDataPoints=true, but I presume they use a different number of prior blocks to estimate it (or a different algorithm altogether) but we're in the ballpark
      expect(val.toFixed(0)).to.equal('21710997321634642527')
    })

    it('estimateDailyChangeInNetworkHashRate 1 day', function () {
      let newBlock = { 
        networkHashRate: new BigNumber(26679207 * 10**12),
        timestamp: new Date(2018, 3, 18, 17).valueOf() / 1000
      }
      let oldBlock = { 
        networkHashRate: new BigNumber(25990711 * 10**12),
        timestamp: new Date(2018, 3, 17, 17).valueOf() / 1000
      }
     
      let val = Estimator.estimateDailyChangeInNetworkHashRate(oldBlock, newBlock)
      let valThs = val.dividedBy(10**12).toNumber()
      expect(valThs).to.equal(688496)
    })

    it('estimateDailyChangeInNetworkHashRate 30 days', function () {
      let newBlock = { 
        networkHashRate: new BigNumber(26679207 * 10**12),
        timestamp: new Date(2018, 4, 18, 17).valueOf() / 1000
      }
      let oldBlock = { 
        networkHashRate: new BigNumber(25990711 * 10**12),
        timestamp: new Date(2018, 3, 17, 17).valueOf() / 1000
      }
     
      let val = Estimator.estimateDailyChangeInNetworkHashRate(oldBlock, newBlock)
      let valThs = val.dividedBy(10**12).toNumber()
      expect(valThs).to.be.closeTo(22209, 1)
    })
  })

  describe('estimate zcash', function () {
    it('estimateNetworkHashRateZCash', function () {
      let from = new Date(2018, 1, 1)
      let to = new Date(2018, 3, 1)

      let val = Estimator.estimateDailyChangeInNetworkHashRateZCash(from, to)
      expect(val).to.have.length(60)
      expect(val[_.size(val) - 1]).to.equal(1.5)

      throw 'todo'
    })

    it('estimateEarningsZCash', function () {
      let from = new Date(2018, 1, 1)
      let to = new Date(2018, 3, 1)

      let val = Estimator.estimateEarningsZCash(from, to)

      throw 'todo'
    })

  })
})
