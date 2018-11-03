import * as _ from "lodash"
import { BigNumber } from "bignumber.js"
import { BlockWithNetworkHashRate, Block } from "./interfaces"

/**
 * Estimates earnings and other attributes of mining based on mean time between blocks and network hash rate.
 * This works for equihash and should work for most algorithms as it doesn't get into implementation-specific interpretations of difficulty and hashing algorithms.
 */
export class Estimator {
  /**
   * Calculates the average amount of time between mined blocks at the specified block looking back over the specified period of time.
   * @param block
   * @param lookbackCount
   */
  static async meanTimeBetweenBlocks(
    block: Block | Promise<Block>,
    lookbackTimeSpanSeconds: number = 60 ** 2 * 24 // < 1h * 24 == 1d
  ): Promise<number> {
    if (!block) throw new Error("block must be provided")
    if (lookbackTimeSpanSeconds < 1)
      throw new Error("lookbackTimeSpanSeconds must be greater than zero")

    let resolvedBlock: Block = await block
    let b0 = await resolvedBlock.previous()
    if (!b0)
      throw new Error(
        "provided block must have previous blocks, but previous returned null"
      )
    let lookbackCount = 1
    let timeSpan = 0
    timeSpan = resolvedBlock.time - b0.time
    while (b0 && timeSpan < lookbackTimeSpanSeconds) {
      b0 = await b0.previous()
      timeSpan = resolvedBlock.time - b0.time
      lookbackCount++
    }
    return timeSpan / lookbackCount
  }

  /**
   * Estimates the earnings for the given hash rate and given network information for a single day.
   * Essentially this is the same as @see estimateFutureEarnings but for a single day.
   */
  static estimateDailyEarnings(options: EstimateDailyEarningsOptions) {
    let days = Estimator.estimateFutureEarnings({
      timeHorizonInDays: 1,
      networkHashRateChangePerDay: new BigNumber(0),
      yourHashesPerSecond: options.yourHashesPerSecond,
      networkHashesPerSecond: options.networkHashesPerSecond,
      meanNetworkSecondsBetweenBlocks: options.meanNetworkSecondsBetweenBlocks,
      rewardedCoinsPerMinedBlock: options.rewardedCoinsPerMinedBlock,
      fiatPerCoinsExchangeRate: options.fiatPerCoinsExchangeRate,
      watts: options.watts,
      electricityCostKwh: options.electricityCostKwh,
      feesAsPercent: options.feesAsPercent
    })
    return _.size(days) > 0 && _.has(days[0], "totalProfit")
      ? days[0].totalProfit
      : 0
  }

  /**
   * Estimates earnings with the specified mining and specified network information over the specified time horizon.
   * @returns {number} The estimated amount mined in a currency that you can specify with the `fiatPerCoinsExchangeRate` parameter.
   */
  static estimateFutureEarnings(options: EstimateFutureEarningsOptions) {
    if (!options.timeHorizonInDays || options.timeHorizonInDays <= 0)
      throw new Error("timeHorizonInDays must be greater than zero")

    const defaultValuesIfNull = {
      electricityCostKwh: 0,
      feesAsPercent: 0,
      watts: 0
    }
    _.each(
      Object.keys(defaultValuesIfNull),
      key =>
        (options[key] = _.isNil(options[key])
          ? defaultValuesIfNull[key]
          : options[key])
    )
    const SECONDS_PER_HOUR = 60 * 60.0
    const SECONDS_PER_DAY = SECONDS_PER_HOUR * 24.0
    let totalRevenue = 0
    let totalElectricCost = 0
    let totalFeeCost = 0
    let totalProfit = 0
    let days = []
    for (let dayNum = 0; dayNum < options.timeHorizonInDays; dayNum++) {
      let daysToMineBlock = new BigNumber(
        options.meanNetworkSecondsBetweenBlocks
      )
        .dividedBy(
          options.yourHashesPerSecond.dividedBy(options.networkHashesPerSecond)
        )
        .dividedBy(SECONDS_PER_DAY)
      let blocksPerDay = new BigNumber(1.0)
        .dividedBy(daysToMineBlock)
        .toNumber()

      let revenue =
        blocksPerDay *
        options.rewardedCoinsPerMinedBlock *
        options.fiatPerCoinsExchangeRate
      totalRevenue += revenue

      let electricCost =
        (options.watts / 1000) * options.electricityCostKwh * 24
      totalElectricCost += electricCost

      let feeCost = revenue * options.feesAsPercent
      totalFeeCost += feeCost

      let profit = revenue - (electricCost + feeCost)
      totalProfit += profit

      let dayStats = {
        dayNumber: dayNum,
        networkHashesPerSecond: options.networkHashesPerSecond,
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
      options.networkHashesPerSecond.plus(options.networkHashRateChangePerDay)
    }
    return days
  }

  /**
   * Estimates the network hash rate at one block (`newBlock`) by the amount of work accomplished between two blocks.
   * Note that for blockchains without a chainWork stored in every block, since this calculation only uses the
   * *relative* difference in chainWork, the caller can calculate a chainWork for part of the chain to satisfy this function's requirements.
   * @param newestBlock The newest block; The network hashrate will be estimated at the time of this block.
   * @returns The estimated network hash rate
   */
  static async estimateNetworkHashRate(
    newestBlock: Block | Promise<Block>,
    lookbackCount: number = 120
  ): Promise<BigNumber> {
    if (!newestBlock) throw new Error("newestBlock must be provided")
    if (lookbackCount < 0)
      throw new Error("lookbackCount must be greater than or equal to zero")
    let resolvedBlock: Block = await newestBlock
    let b0 = resolvedBlock
    let minTime: number = b0.time
    let maxTime = minTime
    while (lookbackCount > 0 && b0) {
      b0 = await b0.previous()
      minTime = Math.min(b0.time, minTime)
      maxTime = Math.max(b0.time, maxTime)
      lookbackCount--
    }
    if (minTime == maxTime) return new BigNumber(0)
    let workDiff = resolvedBlock.chainWork.minus(b0.chainWork)
    let timeDiff = maxTime - minTime
    let estimatedNetworkHashRate = workDiff.dividedBy(timeDiff)
    return estimatedNetworkHashRate
  }

  /**
   * Returns a clone of the specified block with the `networkHashRate` property added.
   * @param block A block to add hashrate to.
   * @param reader A reader for the speicifed block to get additional block chain info from.
   */
  static async blockWithNetworkHashRate(
    block: Block
  ): Promise<BlockWithNetworkHashRate> {
    let hashRate = await Estimator.estimateNetworkHashRate(block)
    //let clone = Object.assign(block, { networkHashRate: hashRate })
    block["networkHashRate"] = hashRate
    //return (clone as BlockWithNetworkHashRate)
    return block as BlockWithNetworkHashRate
  }

  /**
   * Calculates the average change in network hashrate over the number of specified days.
   * @param newestBlock The newest block in the blockchain
   * @param dayCount The number of days to go back to use to average the daily change over
   */
  static async estimateNetworkHashRateDailyChange(
    newestBlock: Block | Promise<Block>,
    days: number = 5
  ): Promise<BigNumber> {
    if (!newestBlock) throw new Error("newestBlock cannot be null")
    let resolvedBlock: Block = await newestBlock

    const toDays = seconds => seconds / (60 ^ (2 * 24))
    const elapsedDays = (newBlock: Block, oldBlock: Block) =>
      toDays(newBlock.time - oldBlock.time)
    let b0 = await resolvedBlock.previous()
    while (b0 && elapsedDays(resolvedBlock, b0) < days) {
      b0 = await b0.previous()
    }
    const withHashRate = b => Estimator.blockWithNetworkHashRate(b)
    return Estimator.estimateNetworkHashRateDailyChangeBetweenBlocks(
      await withHashRate(b0),
      await withHashRate(resolvedBlock)
    )
  }

  /**
   * Estimates the daily change in network solutions/hashes per second based on historical data.
   * The historical data is really two attributes of two historical blocks.
   * The two blocks chosen should be the one at the beginning of the historical period you want to evaluate hash rate increase based on.
   * For example, if you wanted to use 30 day period to assess the daily hash rate change from, you'd choose a block at the beginning of a thirty day period and a block at the end of that 30 day period.
   */
  static estimateNetworkHashRateDailyChangeBetweenBlocks(
    oldBlock: BlockWithNetworkHashRate,
    newBlock: BlockWithNetworkHashRate
  ): BigNumber {
    const SECONDS_PER_DAY = 24 * 60 * 60
    let periodInDays = (newBlock.time - oldBlock.time) / SECONDS_PER_DAY
    let changeInHasRatePS = newBlock.networkHashRate.minus(
      oldBlock.networkHashRate
    )
    return changeInHasRatePS.dividedBy(periodInDays.toFixed(4)) // Because BigNumber throws if >15 significant digits
  }
}

/**
 * Options for the @see Estimator.estimateFutureEarnings function.
 */
export interface EstimateFutureEarningsOptions
  extends EstimateEarningsBaseOptions {
  /**
   * The number of days you want to estimate earnings over.
   */
  timeHorizonInDays: number
  /**
   * The amount of daily change expected in network hash/solutions per second during the specified time horizon.
   */
  networkHashRateChangePerDay: BigNumber
}

/**
 * Options for the @see Estimator.estimateDailyEarnings function.
 */
export interface EstimateDailyEarningsOptions
  extends EstimateEarningsBaseOptions {}

/**
 * Shared options for some of the @see Estimator functions.
 */
export interface EstimateEarningsBaseOptions {
  /**
   * Your hardware's hashes/solutions per second.
   */
  yourHashesPerSecond: BigNumber
  /**
   * The network's total hashes/solutions per second that you want to assume for the estimation.
   */
  networkHashesPerSecond: BigNumber
  /**
   * How long on "average" it takes to mine a block with the current network hash rate. This is normally a mean of timings for the last N blocks (e.g. the ZCash client itself uses the most recent 120 blocks).
   */
  meanNetworkSecondsBetweenBlocks: number
  /**
   * The number of coins that the miner will be rewarded for mining the block.
   */
  rewardedCoinsPerMinedBlock: number
  /**
   * The number dollars per mined coin that should be used to calculate the resulting profit/revenue. For example if you want to use USD per Bitcoin pass in the current dollars per bitcoin exchange rate here. If you don't want the result in mined coins specify 1.
   */
  fiatPerCoinsExchangeRate: number
  /**
   * The amount of watts your hardware runs at to generate hashes/solutions.
   */
  watts?: number
  /**
   * Your cost of electricity in kilowatt hours.
   */
  electricityCostKwh?: number
  /**
   * Any other fees you want to take off the top of generated revenue (e.g. pool fees + mining software fees). Expressed as a percentage (between 0 and 1).
   */
  feesAsPercent?: number
}
