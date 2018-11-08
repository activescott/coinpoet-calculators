import { Block, BlockStorage } from "../../src/interfaces"

export class MockBlockStorage extends BlockStorage<Block> {
  getBlockCount(): Promise<number> {
    throw new Error("Method not implemented.")
  }
  getBlockHash(height: number): Promise<string> {
    throw new Error("Method not implemented.")
  }
  getBlock(blockHash: string): Promise<Block> {
    throw new Error("Method not implemented.")
  }
}
