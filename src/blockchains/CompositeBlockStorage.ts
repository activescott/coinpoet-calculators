import * as _ from 'lodash'
import { BlockStorage, Block } from '../interfaces'
import Diag from '../lib/Diag'

const D = new Diag('CompositeBlockStorage')

/**
 * A @see BlockStorage implemention that will delegate it's work to a primary and if necessary a secondary @see BlockStorage.
 */
export default class CompositeBlockStorage extends BlockStorage<Block> {
  constructor(readonly primary: BlockStorage<Block>, readonly secondary: BlockStorage<Block>) {
    super()
    if (!primary) throw new Error('primary must be provided.')
    if (!secondary) throw new Error('secondary must be provided.')
  }

  async _invokeBoth(path: string, defaultValue: any, ...args): Promise<Array<any>> {
    let primaryValue: any = defaultValue, secondaryValue: any = defaultValue;
    try {
      primaryValue = await _.invoke(this.primary, path, args);
    } catch (err) {
      D.warn(`Error invoking ${path} on primary.`)
    }
    try {
      secondaryValue = await _.invoke(this.secondary, path, args);
    } catch (err) {
      D.warn(`Error invoking ${path} on secondary.`)
    }
    return Promise.resolve([primaryValue, secondaryValue])
  }

  async getBlockCount(): Promise<number> {
    let values = await this._invokeBoth('getBlockCount', 0)
    return Promise.resolve(_.max(values))
  }
  
  async getBlockHash(height: number): Promise<string> {
    let values = await this._invokeBoth('getBlockHash', null, height)
    return _.find(values, v => v !== null)
  }

  async getBlock(blockHash: string): Promise<Block> {
    let values = await this._invokeBoth('getBlock', null, blockHash)
    return _.find(values, v => v !== null)
  }
}
