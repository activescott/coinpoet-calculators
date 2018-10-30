import { BigNumber } from "bignumber.js"
import { Block, BlockWithNetworkHashRate } from "../../src/interfaces"

export class MockBlock implements Block {
  constructor(
    readonly hash: string = null,
    readonly height: number = null,
    readonly time: number = null,
    readonly previousBlockHash: string = null,
    readonly chainWork: BigNumber = null
  ) {}

  previous(): Promise<Block> {
    throw new Error("Method not implemented.")
  }
}

export class MockBlockWithNetworkHashRate extends MockBlock
  implements BlockWithNetworkHashRate {
  constructor(
    hash: string = null,
    height: number = null,
    time: number = null,
    previousBlockHash: string = null,
    chainWork: BigNumber = null,
    readonly networkHashRate: BigNumber
  ) {
    super(hash, height, time, previousBlockHash, chainWork)
  }
}
