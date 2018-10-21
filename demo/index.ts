import { BigNumber } from "bignumber.js"
import { prompt } from "inquirer"
import * as _ from "lodash"
import { Estimator } from "../src"
import { ZCashReader } from "../src"
import Diag, { LogLevel } from "../src/lib/Diag"

Diag.Level = LogLevel.DEBUG

// Demonstration of the coinpoet-calculators high-level capabilities

async function main() {
  let answers = await prompt<{ coin: string; cmd: string }>([
    {
      type: "list",
      name: "coin",
      message: "What coin do you want info for?",
      choices: ["ZCash", "Eth"],
      filter: _.toLower
    },
    {
      type: "list",
      name: "cmd",
      message: "What do you want to know?",
      choices: [
        "Average Time Between Blocks",
        "My Future Earnings",
        "what should be willing to pay for a card?"
      ],
      filter: _.toLower
    }
  ])

  console.log("answers:", answers)

  const cmds = {
    "average time between blocks": async answers => {
      const secondsPerHour = 60 * 60
      const val = await Estimator.meanTimeBetweenBlocks(
        await ZCashReader.newestBlock(),
        secondsPerHour * 2
      )
      console.log("average time between blocks:", val)
    },
    "my future earnings": async answers => {
      type EParams = {
        networkHashesPerSecond: BigNumber
        timeHorizonInDays: number
        yourHashesPerSecond: BigNumber
        networkHashRateChangePerDay: BigNumber
        meanNetworkSecondsBetweenBlocks: number
        rewardedCoinsPerMindedBlock: number
        fiatPerCoinsExchangeRate: number
        watts: number
        electricityCostKwh: number
        feesAsPercent: number
      }
      let earningsParms: EParams = await prompt<EParams>([
        {
          type: "input",
          message: "What is the hashes per second value (H/s)?",
          name: "yourHashesPerSecond",
          default: 180,
          filter: response => new BigNumber(parseFloat(response), 10)
        },
        {
          type: "input",
          message: "How many days into the future would you like to forecast?",
          name: "timeHorizonInDays",
          default: 10,
          validate: v => v && v > 0
        }
      ])
      earningsParms.networkHashesPerSecond = await Estimator.estimateNetworkHashRate(
        ZCashReader.newestBlock()
      )
      earningsParms.networkHashRateChangePerDay = await Estimator.estimateNetworkHashRateDailyChange(
        ZCashReader.newestBlock()
      )
      earningsParms.meanNetworkSecondsBetweenBlocks = await Estimator.meanTimeBetweenBlocks(
        ZCashReader.newestBlock()
      )
      earningsParms.rewardedCoinsPerMindedBlock = 25
      earningsParms.fiatPerCoinsExchangeRate = 125
      earningsParms.watts = 140
      earningsParms.electricityCostKwh = 0.11
      earningsParms.feesAsPercent = 0.1

      let futureEarnings = Estimator.estimateFutureEarnings(
        earningsParms.timeHorizonInDays,
        earningsParms.networkHashRateChangePerDay,
        earningsParms.yourHashesPerSecond,
        earningsParms.networkHashesPerSecond,
        earningsParms.meanNetworkSecondsBetweenBlocks,
        earningsParms.rewardedCoinsPerMindedBlock,
        earningsParms.fiatPerCoinsExchangeRate,
        earningsParms.watts,
        earningsParms.electricityCostKwh,
        earningsParms.feesAsPercent
      )
      console.log("Your future earnings are:", futureEarnings)
    },
    "what should be willing to pay for a card?": async answers => {
      console.log("TODO")
    }
  }

  let coins = {
    zcash: () => cmds
  }

  let coinCmds = coins[answers.coin]()
  try {
    await coinCmds[answers.cmd]()
  } catch (err) {
    throw err
  }
}

main()
