import "isomorphic-fetch"
import { Request, Response } from "express"
import { ZCashReader } from "../../shared/ZCashReader"
import * as _ from "lodash"
// TODO: FIXME: import. Is this right?
import { Estimator, EstimateFutureEarningsOptions } from "../../../dist" //"coinpoet-calculators"
import BigNumber from "bignumber.js"

export async function meanTimeBetweenBlocksHandler(
  req: Request,
  res: Response
) {
  const secondsPerHour = 60 * 60
  const coin = req.query.coin ? req.query.coin : "zcash"
  const hours = _.isInteger(req.query.hours) ? parseInt(req.query.hours) : 1

  console.log("meanTimeBetweenBlocks...")
  const value = await Estimator.meanTimeBetweenBlocks(
    await ZCashReader.newestBlock(),
    secondsPerHour * hours
  )
  const resp = {
    value,
    coin,
    hours
  }
  console.log("meanTimeBetweenBlocks complete:", resp)
  return res.json(resp)
}

export async function estimateNetworkHashRateHandler(
  req: Request,
  res: Response
) {
  const coin = req.query.coin ? req.query.coin : "zcash"
  console.log("estimateNetworkHashRate...")
  const value = await Estimator.estimateNetworkHashRate(
    await ZCashReader.newestBlock(),
    17
  )
  const resp = {
    value: value.toNumber(),
    coin
  }
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
  const coin = req.query.coin ? req.query.coin : "zcash"
  console.log("estimateNetworkHashRateDailyChange...")
  const value = await Estimator.estimateNetworkHashRateDailyChange(
    await ZCashReader.newestBlock(),
    7
  )
  const resp = {
    value: value.toNumber(),
    coin
  }
  console.log("estimateNetworkHashRateDailyChange complete:", resp)
  return res.json(resp)
}

export async function estimateFutureEarningsHandler(
  req: Request,
  res: Response
) {
  console.log("estimateFutureEarningsHandler...")
  if (!req) throw new Error("request must be provided")
  if (!res) throw new Error("response must be provided")

  if (req.method !== "POST") throw new Error("Request method must be POST")

  if (!req.is("json"))
    throw new Error("Post body Content-Type must be application/json")

  // TODO: confirm body is of type @see EstimateFutureEarningsOptions
  let options = convertFutureEarningsOptions(req.body)
  let value = await Estimator.estimateFutureEarnings(options)

  console.log("estimateFutureEarnings value:", value)
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
  // now a copule are BigNumber (but serialized as number):
  const options = {
    ...raw,
    yourHashesPerSecond: new BigNumber(raw.yourHashesPerSecond),
    networkHashesPerSecond: new BigNumber(raw.networkHashesPerSecond),
    networkHashRateChangePerDay: new BigNumber(raw.networkHashRateChangePerDay)
  }
  return options as EstimateFutureEarningsOptions
}
