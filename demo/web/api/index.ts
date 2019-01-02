import "isomorphic-fetch"
import { Request, Response } from "express"
import { ZCashReader, BitcoinReader } from "../../shared"
import * as _ from "lodash"
// TODO: FIXME: import. Is this right?
import { Estimator, EstimateFutureEarningsOptions } from "../../../dist" //"coinpoet-calculators"
import BigNumber from "bignumber.js"
import { Block } from "../../../dist"

type CoinName = "zcash" | "bitcoin"

// NOTE: to scale, the API should really be on it's own host/process with a process manager.

async function newestBlockForCoin(coin: CoinName): Promise<Block> {
  const coinMap = {
    zcash: () => ZCashReader.newestBlock(),
    bitcoin: () => BitcoinReader.newestBlock()
  }
  if (!Reflect.has(coinMap, coin)) {
    throw new Error(
      `Unrecognized coin "${coin}". Expected one of ${Reflect.ownKeys(coinMap)}`
    )
  }
  return coinMap[coin]()
}

function coinFromRequest(req: Request): CoinName {
  return req.query.coin ? req.query.coin : "zcash"
}

function hoursFromRequest(req: Request): number {
  let hours = Number.parseInt(req.query.hours)
  return Number.isNaN(hours) ? 1 : hours
}

export async function meanTimeBetweenBlocksHandler(
  req: Request,
  res: Response
) {
  const secondsPerHour = 60 * 60
  const coin = coinFromRequest(req)
  const hours: number = hoursFromRequest(req)
  console.time("meanTimeBetweenBlocks")
  const value = await Estimator.meanTimeBetweenBlocks(
    await newestBlockForCoin(coin),
    secondsPerHour * hours
  )
  const resp = {
    value,
    coin,
    hours
  }
  console.timeEnd("meanTimeBetweenBlocks")
  console.log("meanTimeBetweenBlocks:", resp)
  return res.json(resp)
}

export async function estimateNetworkHashRateHandler(
  req: Request,
  res: Response
) {
  const coin = coinFromRequest(req)
  console.time("estimateNetworkHashRate")
  const value = await Estimator.estimateNetworkHashRate(
    await newestBlockForCoin(coin),
    17
  )
  const resp = {
    value: value.toNumber(),
    coin
  }
  console.timeEnd("estimateNetworkHashRate")
  console.log("estimateNetworkHashRate complete:", resp)
  return res.json(resp)
}

export async function fiatRateHandler(req: Request, res: Response) {
  // See https://coinmetrics.io/api/
  const DAY = 60 * 60 * 24
  const nowSeconds = Math.floor(new Date().valueOf() / 1000)
  const threeDaysAgoSeconds = Math.floor(nowSeconds - DAY * 3)
  const coin = "zec"

  // LIKE: https://coinmetrics.io/api/v1/get_asset_data_for_time_range/zec/price(usd)/1541055600/1541314800
  const url = `https://coinmetrics.io/api/v1/get_asset_data_for_time_range/${coin}/price(usd)/${threeDaysAgoSeconds}/${nowSeconds}`
  console.log("apiRequest", url, "...")
  const resp = await fetch(url)
  console.log("apiRequest", url, " complete.")
  let json = await resp.json()
  console.log("fiat json:", json)
  let result = json.result
  return res.json({
    value: result[result.length - 1][1]
  })
}

export async function estimateNetworkHashRateDailyChangeHandler(
  req: Request,
  res: Response
) {
  const coin = coinFromRequest(req)
  console.time("estimateNetworkHashRateDailyChange")
  const value = await Estimator.estimateNetworkHashRateDailyChange(
    await newestBlockForCoin(coin),
    7
  )
  const resp = {
    value: value.toNumber(),
    coin
  }
  console.timeEnd("estimateNetworkHashRateDailyChange")
  return res.json(resp)
}

export async function estimateFutureEarningsHandler(
  req: Request,
  res: Response
) {
  console.log("estimateFutureEarningsHandler...")
  console.time("estimateFutureEarningsHandler")
  if (!req) throw new Error("request must be provided")
  if (!res) throw new Error("response must be provided")

  if (req.method !== "POST") throw new Error("Request method must be POST")

  if (!req.is("json"))
    throw new Error("Post body Content-Type must be application/json")

  // TODO: confirm body is of type @see EstimateFutureEarningsOptions
  let options = convertFutureEarningsOptions(req.body)
  let value = await Estimator.estimateFutureEarnings(options)
  console.timeEnd("estimateFutureEarningsHandler")
  return res.json(value)
}

function convertFutureEarningsOptions(raw: any): EstimateFutureEarningsOptions {
  let expectedProps = [
    "electricityCostKwh",
    "feesAsPercent",
    "fiatPerCoinsExchangeRate",
    "meanNetworkSecondsBetweenBlocks",
    "networkHashesPerSecond",
    "networkHashRateChangePerDay",
    "rewardedCoinsPerMinedBlock",
    "timeHorizonInDays",
    "watts",
    "yourHashesPerSecond"
  ]
  if (!expectedProps.every(p => Reflect.has(raw, p))) {
    throw new Error(
      "Request body should be a EstimateFutureEarningsOptions object, but was missing one of the required properties."
    )
  }
  // note some are BigNumber (but serialized as number):
  const options = {
    ...raw,
    yourHashesPerSecond: new BigNumber(raw.yourHashesPerSecond),
    networkHashesPerSecond: new BigNumber(raw.networkHashesPerSecond),
    networkHashRateChangePerDay: new BigNumber(raw.networkHashRateChangePerDay)
  }
  return options as EstimateFutureEarningsOptions
}
