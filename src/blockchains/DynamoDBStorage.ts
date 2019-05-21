import { BlockStorage, Block, IWritableBlockStorage } from "../interfaces"

/**
 * Reads and writes blocks in a DynamoDB table.
 *
 * Requires the following schema in the table:
 * - A primary key on `height`.
 * - A Global Secondary Index on `hash`.
 */
export class DynamoDBStorage
  implements BlockStorage<Block>, IWritableBlockStorage<Block> {
  public constructor(
    private region: string,
    private endpoint: string,
    private tableName: string
  ) {}

  getBlockCount(): Promise<number> {
    throw new Error("Method not implemented.")
  }

  getBlockHash(height: number): Promise<string> {
    throw new Error("Method not implemented.")
  }

  getBlock(blockHash: string): Promise<Block> {
    throw new Error("Method not implemented.")
  }

  getBlockFromHeight(height: number): Promise<Block> {
    throw new Error("Method not implemented.")
  }

  putBlock(block: Block): void {
    throw new Error("Method not implemented.")
  }
}
