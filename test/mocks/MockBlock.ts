import { BigNumber } from 'bignumber.js'
import { Block } from "../../src/interfaces"

export class MockBlock implements Block {
  hash: string
  height: number
  time: number
  previousBlockHash: string
  chainWork: BigNumber

  previous(): Promise<Block> {
    throw new Error("Method not implemented.")
  }
}
