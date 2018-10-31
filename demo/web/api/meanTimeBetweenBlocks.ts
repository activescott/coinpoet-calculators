import { Request, Response } from "express"
import { ZCashReader } from "../../shared/ZCashReader"
import { Estimator } from "../../../src/Estimator"

export default async (req: Request, res: Response) => {
  const secondsPerHour = 60 * 60
  const coin = req.query.coin ? req.query.coin : "zcash"
  const hours = req.query.hours ? req.query.hours : 1

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
