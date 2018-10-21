import * as _ from "lodash"
import * as util from "util"
import { BlockStorage, Block } from "../interfaces"
import Diag from "../lib/Diag"

const D = new Diag("CompositeBlockStorage")

/**
 * A @see BlockStorage implemention that will delegate it's work to a primary and if necessary a secondary @see BlockStorage.
 */
export default class CompositeBlockStorage extends BlockStorage<Block> {
  constructor(
    readonly primary: BlockStorage<Block>,
    readonly secondary: BlockStorage<Block>
  ) {
    super()
    if (!primary) throw new Error("primary must be provided.")
    if (!secondary) throw new Error("secondary must be provided.")
  }

  async _invokeBoth(
    path: string,
    defaultValue: any,
    ...args
  ): Promise<Array<any>> {
    // D.debug('_invokeBoth(', path, defaultValue, args, ')')
    let primaryValue: any = defaultValue,
      secondaryValue: any = defaultValue
    try {
      primaryValue = await _.invoke(this.primary, path, ...args)
    } catch (err) {
      D.warn(
        `Error invoking ${path} on primary with args`,
        args,
        ". Note this is probably fine as the secondary may respond. The error was:",
        err.message
      )
    }
    try {
      secondaryValue = await _.invoke(this.secondary, path, ...args)
    } catch (err) {
      D.warn(
        `Error invoking ${path} on secondary with args`,
        args,
        ". The error was:",
        err.message
      )
    }
    return Promise.resolve([primaryValue, secondaryValue])
  }

  async getBlockCount(): Promise<number> {
    let values = await this._invokeBoth("getBlockCount", 0)
    const max = _.max(values)
    return Promise.resolve(max)
  }

  async getBlockHash(height: number): Promise<string> {
    let values = await this._invokeBoth("getBlockHash", null, height)
    let found = _.find(values, v => v !== null)
    return found
  }

  async getBlock(blockHash: string): Promise<Block> {
    let values = await this._invokeBoth("getBlock", null, blockHash)
    return _.find(values, v => v !== null)
  }
}
