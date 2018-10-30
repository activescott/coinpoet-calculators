import { Request, Response } from "express"
import { ZCashReader } from "../../shared/ZCashReader"
import { Estimator } from "../../../src/Estimator"

export default async (req: Request, res: Response) => {
  const secondsPerHour = 60 * 60
  const coin = req.query.coin ? req.query.coin : "zcash"
  console.log("meanTimeBetweenBlocks...")
  const value = await Estimator.meanTimeBetweenBlocks(
    await ZCashReader.newestBlock(),
    secondsPerHour * 2
  )
  console.log("meanTimeBetweenBlocks complete.")
  return res.json({
    value,
    coin
  })
}
