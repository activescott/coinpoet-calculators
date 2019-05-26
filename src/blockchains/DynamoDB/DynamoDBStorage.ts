import { BlockStorage, Block, IWritableBlockStorage } from "../../interfaces"
import { DDB } from "./DDB"
import { DocumentClient } from "aws-sdk/clients/dynamodb"
import Diag from "../../lib/Diag"

const ALL_ATTRIBUTES: string[] = [
  "hash",
  "height",
  "time",
  "previousBlockHash",
  "chainWork",
  "reward"
]

const D = Diag.createLogger("DynamoDBStorage")

/**
 * Reads and writes blocks in a DynamoDB table.
 *
 * Requires the following schema in the table:
 * - A primary key on `height`.
 * - A Global Secondary Index on `hash`.
 */
export class DynamoDBStorage
  implements BlockStorage<Block>, IWritableBlockStorage<Block> {
  private readonly ddb: DDB

  public constructor(region: string, private tableName: string) {
    if (!region) throw new Error("region must be specified")
    if (!tableName) throw new Error("tableName must be specified")
    this.ddb = new DDB(region)
  }

  async createTable(deleteIfExists = false): Promise<void> {
    const params: AWS.DynamoDB.CreateTableInput = {
      TableName: this.tableName,
      KeySchema: [
        { AttributeName: "height", KeyType: "HASH" } //Partition key
        // NOTE: no Sort/Range key
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 1
      },
      AttributeDefinitions: [
        { AttributeName: "height", AttributeType: "N" },
        { AttributeName: "hash", AttributeType: "S" }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: "hashIndex",
          KeySchema: [{ AttributeName: "hash", KeyType: "HASH" }],
          Projection: {
            // NOTE: as long as items are <1K, you can project more attributes at no extra cost: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-indexes-general.html#bp-indexes-general-projections
            ProjectionType: "ALL"
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1
          }
        }
      ]
    }
    try {
      const createTableResp = await this.ddb.createTable(params, deleteIfExists)
      D.info(
        "Succesfully created table:",
        createTableResp.TableDescription.TableArn
      )
    } catch (err) {
      D.error("Failed to create table:", err)
      return
    }
  }

  async getBlockCount(): Promise<number> {
    // TODO: We keep the count of blocks in a dummy block (height=-1, hash=blockCount).
    const params: DocumentClient.GetItemInput = {
      TableName: this.tableName,
      Key: { height: -1 }
    }
    const result = await this.ddb.get(params)
    if (result && result.Item) {
      const block = result.Item as Block
      return Number.parseInt(block.hash)
    } else {
      return 0
    }
  }

  async getBlockHash(height: number): Promise<string> {
    const params: DocumentClient.GetItemInput = {
      TableName: this.tableName,
      Key: { height: height }
    }
    const result = await this.ddb.get(params)
    if (result && result.Item) {
      const block = result.Item as Block
      return block.hash
    } else {
      return null
    }
  }

  async getBlock(blockHash: string): Promise<Block> {
    const params: DocumentClient.QueryInput = {
      TableName: this.tableName,
      IndexName: "hashIndex",
      KeyConditionExpression: "#hashAttribute = :hashValue",
      ExpressionAttributeNames: {
        "#hashAttribute": "hash"
      },
      ExpressionAttributeValues: {
        ":hashValue": blockHash
      }
    }
    const result = await this.ddb.query(params)
    if (result && result.Items && result.Items.length > 0) {
      return result.Items[0] as Block
    } else {
      return null
    }
  }

  async getBlockFromHeight(height: number): Promise<Block> {
    const hash = await this.getBlockHash(height)
    if (hash) return this.getBlock(hash)
    else return null
  }

  async putBlock(block: Block): Promise<void> {
    if (!block) {
      throw new Error("block cannot be null")
    }
    if (!Number.isInteger(block.height) || block.height < 0) {
      throw new Error("block height must be a positive integer")
    }
    if (!block.hash) {
      throw new Error("block hash must be a non-empty string")
    }

    await this.ddb.put({
      TableName: this.tableName,
      Item: block
    })
    await this.updateBlockCount(block)
  }

  private async updateBlockCount(block: Block): Promise<void> {
    const newCount = block.height + 1
    const currentCount = await this.getBlockCount()
    if (newCount > currentCount) {
      let blockCountTracker = {
        height: -1,
        hash: newCount.toString()
      }
      await this.ddb.put({
        TableName: this.tableName,
        Item: blockCountTracker
      })
    }
  }
}
