import { prompt } from 'inquirer'
import * as _ from 'lodash'
import { Estimator } from '../src'
import { ZCashReader } from '../src'
import Diag, { LogLevel } from '../src/lib/Diag'
Diag.Level = LogLevel.DEBUG

// Demonstration of the coinpoet-calculators high-level capabilities


// TODO: Print out average block time for last N blocks.

async function main() { 
  let answers = await prompt<{ coin: string, cmd: string }>([{
    type: 'list',
    name: 'coin',
    message: 'What do you want to do?',
    choices: [
      'ZCash',
    ],
    filter: _.toLower
  },
  {
    type: 'list',
    name: 'cmd',
    message: 'What do you want to know?',
    choices: [
      'Average time between blocks',
      'Nothing',
    ],
    filter: _.toLower
  }])

  const cmds = {
    'average time between blocks': async () => {
      const secondsPerHour = 60 * 60 
      const val = await Estimator.meanTimeBetweenBlocks(await ZCashReader.newestBlock(), secondsPerHour * 2)
      console.log('average time between blocks:', val)
    }
  }

  let coins = {
    'zcash': () => cmds
  }

  let coinCmds = coins[answers.coin]()
  try {
    await coinCmds[answers.cmd]()
  } catch (err) {
    throw err
  }
  
}

main()