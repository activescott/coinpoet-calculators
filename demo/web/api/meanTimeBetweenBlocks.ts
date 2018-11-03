import { Request, Response } from "express"
import { ZCashReader } from "../../shared/ZCashReader"
import * as _ from "lodash"
// TODO: FIXME: import. Is this right?
import { Estimator } from "../../../dist" //"coinpoet-calculators"

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
