import { BitcoinDifficulty } from './BitcoinDifficulty'
import * as _ from 'lodash'
import { BigNumber } from 'bignumber.js'
import Diag from './Diag'
import { BlockWithNetworkHashRate, BlockWithChainWork, BlockchainReader } from './interfaces'
import ZCashBlockchainReader from './blockchains/ZCashBlockchainReader'

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
  static dailyEarnings (yourHashesPerSecond: BigNumber,
                  networkHashesPerSecond: BigNumber,
                  meanNetworkSecondsBetweenBlocks: number,
                  rewardedCoinsPerMinedBlock: number,
                  fiatPerCoinsExchangeRate: number,
                  watts: number = 0,
                  electricityCostKwh: number = 0,
                  feesAsPercent: number = 0) {
    let days = Estimator.estimateFutureEarnings(1, new BigNumber(0), yourHashesPerSecond, networkHashesPerSecond, meanNetworkSecondsBetweenBlocks, rewardedCoinsPerMinedBlock, fiatPerCoinsExchangeRate, watts, electricityCostKwh, feesAsPercent)
    return _.size(days) > 0 && _.has(days[0], 'totalProfit') ? days[0].totalProfit : 0
  }

  /**
   * Estimates earnings with the specified mining and specified network information over the specified time horizon.
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
   */
  static estimateFutureEarnings (timeHorizonInDays: number,
    networkHashRateChangePerDay: BigNumber,
    yourHashesPerSecond: BigNumber,
    networkHashesPerSecond: BigNumber,
    meanNetworkSecondsBetweenBlocks: number,
    rewardedCoinsPerMinedBlock: number,
    fiatPerCoinsExchangeRate: number,
    watts: number = 0,
    electricityCostKwh: number = 0,
    feesAsPercent: number = 0) {
      const SECONDS_PER_HOUR = 60 * 60.0
      const SECONDS_PER_DAY = SECONDS_PER_HOUR * 24.0
      let totalRevenue = 0
      let totalElectricCost = 0
      let totalFeeCost = 0
      let totalProfit = 0
      let days = []
      for (let dayNum = 0; dayNum < timeHorizonInDays; dayNum++) {
        let daysToMineBlock = new BigNumber(meanNetworkSecondsBetweenBlocks).dividedBy(yourHashesPerSecond.dividedBy(networkHashesPerSecond)).dividedBy(SECONDS_PER_DAY)
        let blocksPerDay = new BigNumber(1.0).dividedBy(daysToMineBlock).toNumber()

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
        days.push(dayStats)
        networkHashesPerSecond.plus(networkHashRateChangePerDay)
      }
      return days
  }

  /**
   * Estimates the network hash rate at one block (`newBlock`) by the amount of work accomplished between two blocks.
   * Note that for blockchains without a chainWork stored in every block, since this calculation only uses the 
   * *relative* difference in chainWork, the caller can calculate a chainWork for part of the chain to satisfy this function's requirements.
   * @param oldBlock The oldest block.
   * @param newBlock The newest block; The network hashrate will be estimated at the time of this block.
   * @returns The estimated network hash rate
   */
  static estimateNetworkHashRate (oldBlock: BlockWithChainWork, newBlock: BlockWithChainWork): BigNumber {
    let workDiff = newBlock.chainWork.minus(oldBlock.chainWork)
    let elapsedSeconds = newBlock.timestamp - oldBlock.timestamp
    let estimatedNetworkHashRate = workDiff.dividedBy(elapsedSeconds)
    return estimatedNetworkHashRate
  }

  /**
   * Estimates the daily change in network solutions/hashes per second based on historical data.
   * The historical data is really two attributes of two historical blocks. 
   * The two blocks chosen should be the one at the beginning of the historical period you want to evaluate hash rate increase based on.
   * For example, if you wanted to use 30 day period to assess the daily hash rate change from, you'd choose a block at the beginning of a thirty day period and a block at the end of that 30 day period.
   */
  static estimateDailyChangeInNetworkHashRate (oldBlock: BlockWithNetworkHashRate, newBlock: BlockWithNetworkHashRate): BigNumber {
    // For how ZCash itself estimates hash rate from block info see https://github.com/zcash/zcash/blob/master/src/rpcmining.cpp#L95 and https://github.com/zcash/zcash/blob/master/src/rpcmining.cpp#L40
    // For explanation of chainWork: https://bitcoin.stackexchange.com/a/26894/6435
    const SECONDS_PER_DAY = 24 * 60 * 60
    let periodInDays = (newBlock.timestamp - oldBlock.timestamp) / SECONDS_PER_DAY
    let changeInHasRatePS = newBlock.networkHashRate.minus(oldBlock.networkHashRate)
    return changeInHasRatePS.dividedBy(periodInDays)
  }

  static async estimateDailyChangeInNetworkHashRateZCash (from: Date, to: Date) {
    const fromSeconds = from.valueOf() / 1000
    /* alg:
     * get most recent block; if latest block.timestamp is < from throw;
     * now iterate through earlier blocks until a block earlier than "to" is found.
     * then add networkHashRate to each of these blocks (will again require a handful of prior blocks to each - this will require going through the reader to make sure that those blocks are read!)
     * with blocks in hand, call estimateDailyChangeInNetworkHash
     */
    let reader = new ZCashBlockchainReader()
    // put this in ZCAShBlockchainReader tests:
    //if ((newest.timestamp < fromSeconds)
    //  throw new Error('newest block is before specified period')
    let chain = reader.subset(from, to)
    reader.subsetByIndex(from, 100)
    
  }
}
