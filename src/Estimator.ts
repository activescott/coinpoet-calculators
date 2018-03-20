import { BitcoinDifficulty } from './BitcoinDifficulty'
import Diag from './Diag'

const D = new Diag('Estimator')

/**
 * Estimates earnings and other attributes of mining based on mean time between blocks and network hash rate.
 * This works for equihash and should work for most algorithms as it doesn't get into implementation-specific interpretations of difficulty and hashing algorithms.
 */
export class Estimator {
  /**
   * Estimates the earnings for the given hash rate and given network information for a single day.
   * Essentially this is the same as `estimateNetworkHashRateChangePerDay` but for a single day.
   */
  static dailyEarnings (yourHashesPerSecond,
                  networkHashesPerSecond,
                  meanNetworkSecondsBetweenBlocks,
                  rewardedCoinsPerMinedBlock,
                  fiatPerCoinsExchangeRate,
                  watts = 0,
                  electricityCostKwh = 0,
                  feesAsPercent = 0) {
    return Estimator.estimateFutureEarnings(1, 0, yourHashesPerSecond, networkHashesPerSecond, meanNetworkSecondsBetweenBlocks, rewardedCoinsPerMinedBlock, fiatPerCoinsExchangeRate, watts, electricityCostKwh, feesAsPercent)
  }

  /**
   * Estimates the daily change in network solutions/hashes per second based on historical data.
   */
  static estimateDailyChangeInNetworkHashRate (oldNetworkHashRate, oldChainWork, newNetworkHashRate, newChainWork, periodInDays) {
    // TODO: - For how ZCash itself estimates hash rate from block info see https://github.com/zcash/zcash/blob/master/src/rpcmining.cpp#L95 and https://github.com/zcash/zcash/blob/master/src/rpcmining.cpp#L40
    throw new Error('todo')
  }

  /**
   * Estimates earnings with the specified mining and network information over the specified time horizon.
   * @returns {number} The estimated amount mined in a currency that you can specify with the `fiatPerCoinsExchangeRate` parameter.
   * @param timeHorizonInDays The number of days you want to estimate earnings over.
   * @param networkHashRateChangePerDay The amount of daily change expected in network hash/solutions per second during the specified time horizon.
   * @param yourHashesPerSecond Your hardware's hashes/solutions per second.
   * @param networkHashesPerSecond The network's total hashes/solutions per second that you want to assume for the estimation.
   * @param meanNetworkSecondsBetweenBlocks How long on "average" it takes to mine a block with the current network hash rate. This is normally a mean of timings for the last N blocks (e.g. the ZCash client itself uses the most recent 120 blocks).
   * @param rewardedCoinsPerMinedBlock The number of coins that the miner will be rewarded for mining the block.
   * @param fiatPerCoinsExchangeRate The number dollars per mined coin that should be used to calculate the resulting profit/revenue. For example if you want to use USD per Bitcoin pass in the current dollars per bitcoin exchange rate here. If you don't want the result in mined coins specify 1.
   * @param watts The amount of watts your hardware runs at to generate hashes/solutions.
   * @param electricityCostKwh Your cost of electricity in kilowatt hours.
   * @param feesAsPercent Any other fees you want to take off the top of generated revenue (e.g. pool fees + mining software fees). Expressed as a percentage (between 0 and 1).
   * @param dailyStatsCallback Called for each day with daily stats as it projects out into the future. 
   */
  static estimateFutureEarnings (timeHorizonInDays,
                                  networkHashRateChangePerDay,
                                  yourHashesPerSecond,
                                  networkHashesPerSecond,
                                  meanNetworkSecondsBetweenBlocks,
                                  rewardedCoinsPerMinedBlock,
                                  fiatPerCoinsExchangeRate,
                                  watts = 0,
                                  electricityCostKwh = 0,
                                  feesAsPercent = 0,
                                  dailyStatsCallback = null) {
    const SECONDS_PER_HOUR = 60 * 60.0
    const SECONDS_PER_DAY = SECONDS_PER_HOUR * 24.0
    let totalRevenue = 0
    let totalElectricCost = 0
    let totalFeeCost = 0
    let totalProfit = 0
    for (let dayNum = 0; dayNum < timeHorizonInDays; dayNum++) {
      let daysToMineBlock = (meanNetworkSecondsBetweenBlocks / (yourHashesPerSecond / networkHashesPerSecond)) / SECONDS_PER_DAY
      let blocksPerDay = 1.0 / daysToMineBlock
      
      let revenue = (blocksPerDay * rewardedCoinsPerMinedBlock * fiatPerCoinsExchangeRate)
      totalRevenue += revenue
      
      let electricCost = (watts / 1000) * electricityCostKwh * 24
      totalElectricCost += electricCost
      
      let feeCost = revenue * feesAsPercent
      totalFeeCost += feeCost

      let profit = revenue - (electricCost + feeCost)
      totalProfit += profit

      let dayStats = {
        dayNumber: dayNum,
        networkHashesPerSecond,
        revenue,
        totalRevenue,
        electricCost,
        totalElectricCost,
        feeCost,
        totalFeeCost,
        profit,
        totalProfit
      }
      typeof dailyStatsCallback === 'function' && dailyStatsCallback(dayStats)
      networkHashesPerSecond += networkHashRateChangePerDay
    }
    return totalProfit
  } 
}
