import Diag from "../../lib/Diag"
import { DynamoDB } from "aws-sdk"
import {
  DocumentClient,
  CreateTableInput,
  CreateTableOutput
} from "aws-sdk/clients/dynamodb"

const D = Diag.createLogger("DynamoDB")

export class DDB {
  private readonly dynamoConfig: AWS.DynamoDB.Types.ClientConfiguration
  private readonly client: DocumentClient

  constructor(awsRegion: string) {
    if (!awsRegion) {
      throw new Error("awsRegion must be provided")
    }
    this.dynamoConfig = DDB.createConfig(awsRegion)
    this.client = new DocumentClient(this.dynamoConfig)
  }

  private static createConfig(
    awsRegion: string
  ): AWS.DynamoDB.Types.ClientConfiguration {
    // NOTE: Lambda functions don't need explicit creds: http://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-lambda.html
    const config =
      awsRegion === "LOCAL"
        ? {
            region: "localhost",
            endpoint: "http://localhost:8000",
            // Below because DDB SDK requires them but DDB Local doesn't need them so we just have to set something to prevent error:
            accessKeyId: "N/A",
            secretAccessKey: "N/A"
          }
        : {
            region: awsRegion
          }
    return config
  }

  async createTable(
    params: CreateTableInput,
    deleteIfExists = false
  ): Promise<CreateTableOutput> {
    const ddb = new DynamoDB(this.dynamoConfig)
    let createResponse: CreateTableOutput
    try {
      createResponse = await ddb.createTable(params).promise()
    } catch (err) {
      if (err.code === "ResourceInUseException") {
        D.info(
          `Table already exists during createTable operation. deleteIfExists=${deleteIfExists}.`
        )
        if (deleteIfExists) {
          async function deleteTableFunc() {
            let remainingAttempts = 5
            while (remainingAttempts > 0) {
              remainingAttempts--
              D.debug(
                `Attempting to delete table (remainingAttempts=${remainingAttempts})...`
              )
              try {
                await ddb
                  .deleteTable({
                    TableName: params.TableName
                  })
                  .promise()
                let delay = new Promise(resolve => {
                  setTimeout(resolve, 5000)
                })
                await delay
              } catch (errDelete) {
                if (errDelete.code === "ResourceNotFoundException") {
                  // succesfully deleted
                  return true
                } else {
                  D.error(
                    "Unexpected error deleting table. Code:",
                    errDelete.code
                  )
                }
              }
            }
            return false
          }
          const deleteSuccessful = await deleteTableFunc()
          if (deleteSuccessful) {
            return ddb.createTable(params).promise()
          } else {
            D.error("Failed to delete existing table during create operation.")
            throw err
          }
        }
      } else {
        throw err
      }
    }
    return createResponse
  }

  public delete(
    params: DocumentClient.DeleteItemInput
  ): Promise<DocumentClient.DeleteItemOutput> {
    return this.client.delete(params).promise()
  }

  get(
    params: DocumentClient.GetItemInput
  ): Promise<DocumentClient.GetItemOutput> {
    return this.client.get(params).promise()
  }

  put(
    params: DocumentClient.PutItemInput
  ): Promise<DocumentClient.PutItemOutput> {
    return this.client.put(params).promise()
  }

  query(
    params: DocumentClient.QueryInput
  ): Promise<DocumentClient.QueryOutput> {
    return this.client.query(params).promise()
  }

  scan(params: DocumentClient.ScanInput): Promise<DocumentClient.ScanOutput> {
    return this.client.scan(params).promise()
  }

  update(
    params: DocumentClient.UpdateItemInput
  ): Promise<DocumentClient.UpdateItemOutput> {
    return this.client.update(params).promise()
  }
}
