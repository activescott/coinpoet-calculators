import { BigNumber } from 'bignumber.js'
import { Block } from "../../src/interfaces"

export class MockBlock implements Block {
  constructor (
    readonly hash: string = null,
    readonly height: number = null,
    readonly time: number = null,
    readonly previousBlockHash: string = null,
    readonly chainWork: BigNumber = null
  ) {
  }

  previous(): Promise<Block> {
    throw new Error("Method not implemented.")
  }
}
