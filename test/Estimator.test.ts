/* eslint-env mocha */
import { expect } from 'chai'
import * as sinon from 'sinon'
import * as _ from 'lodash'

import { Estimator } from '../src/Estimator'

describe('Estimator', function () {

  describe('dailyEarnings', function () {
    it('network hash and time based', function () {
      let yourHashesPerSecond = 290
      let networkHashesPerSecond = 492451309
      let meanNetworkSecondsBetweenBlocks = 147.29166666666666
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
      let yourHashesPerSecond = 290
      let networkHashesPerSecond = 492451309
      let meanNetworkSecondsBetweenBlocks = 147.29166666666666
      let poolHashesPerSecond = 2436000
      let ZECUSD = 241.23
      let watts = 190
      let electricityCostKwh = 0.1
      let networkDailyHashRateChange = 0
      
      let spy = sinon.spy(stats => console.log('stats:', stats))
      let dailyEarnings = Estimator.estimateFutureEarnings(3, networkDailyHashRateChange, yourHashesPerSecond, networkHashesPerSecond, meanNetworkSecondsBetweenBlocks, 10, ZECUSD, watts, electricityCostKwh, 0.01, spy)

      expect(dailyEarnings).to.be.closeTo(0.37*3, 0.01)
      expect(spy).has.property('callCount', 3)
      expect(spy.firstCall.args[0]).has.property('totalProfit').that.is.closeTo(0.36, 0.01)
      expect(spy.secondCall.args[0]).has.property('totalProfit').that.is.closeTo(0.73, 0.01)
      expect(spy.thirdCall.args[0]).has.property('totalProfit').that.is.closeTo(1.10, 0.01)
    })
  })

})
