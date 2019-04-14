import {
  BlockStorage,
  Block,
  IWritableBlockStorage
} from "../../src/interfaces"

/**
 * Simplistic implementation of @see IWritableBlockStorage
 */
export class WritableBlockStorage<TBlock extends Block>
  implements BlockStorage<TBlock>, IWritableBlockStorage<TBlock> {
  readonly heightToBlock: Map<number, TBlock> = new Map<number, TBlock>()
  readonly hashToBlock: Map<string, TBlock> = new Map<string, TBlock>()

  WritableBlockStorage() {}

  putBlock(block: TBlock): void {
    this.heightToBlock[block.height] = block
    this.hashToBlock[block.hash] = block
  }

  async getBlockCount(): Promise<number> {
    return await this.heightToBlock.size
  }

  async getBlockHash(height: number): Promise<string> {
    let block: TBlock = this.heightToBlock[height]
    return (await block) ? block.hash : undefined
  }

  async getBlock(blockHash: string): Promise<TBlock> {
    return await this.hashToBlock[blockHash]
  }

  async getBlockFromHeight(height: number): Promise<TBlock> {
    return await this.heightToBlock[height]
  }
}
