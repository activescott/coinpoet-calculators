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

  constructor(
    awsRegion: string,
    private readonly docClient: DocumentClient = null,
    private readonly rawClient: DynamoDB = null
  ) {
    if (!awsRegion) {
      throw new Error("awsRegion must be provided")
    }
    this.dynamoConfig = DDB.createConfig(awsRegion)
    this.docClient = docClient
      ? docClient
      : new DocumentClient(this.dynamoConfig)
    this.rawClient = rawClient ? rawClient : new DynamoDB(this.dynamoConfig)
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

  async deleteTable(
    tableName: string,
    retryDelay = 5000,
    remainingAttempts = 5
  ) {
    while (remainingAttempts > 0) {
      remainingAttempts--
      D.debug(
        `Attempting to delete table (remainingAttempts=${remainingAttempts})...`
      )
      try {
        await this.rawClient
          .deleteTable({
            TableName: tableName
          })
          .promise()
        let delay = new Promise(resolve => {
          setTimeout(resolve, retryDelay)
        })
        await delay
      } catch (errDelete) {
        if (errDelete.code === "ResourceNotFoundException") {
          // succesfully deleted
          return true
        } else {
          D.error("Unexpected error deleting table. Code:", errDelete.code)
        }
      }
    }
    return false
  }

  async createTable(
    params: CreateTableInput,
    deleteIfExists = false
  ): Promise<CreateTableOutput> {
    let createResponse: CreateTableOutput
    try {
      createResponse = await this.rawClient.createTable(params).promise()
    } catch (err) {
      if (err.code === "ResourceInUseException") {
        D.info(
          `Table already exists during createTable operation. deleteIfExists=${deleteIfExists}.`
        )
        if (deleteIfExists) {
          const deleteSuccessful = await this.deleteTable(params.TableName)
          if (deleteSuccessful) {
            return this.rawClient.createTable(params).promise()
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
    return this.docClient.delete(params).promise()
  }

  get(
    params: DocumentClient.GetItemInput
  ): Promise<DocumentClient.GetItemOutput> {
    return this.docClient.get(params).promise()
  }

  put(
    params: DocumentClient.PutItemInput
  ): Promise<DocumentClient.PutItemOutput> {
    return this.docClient.put(params).promise()
  }

  query(
    params: DocumentClient.QueryInput
  ): Promise<DocumentClient.QueryOutput> {
    return this.docClient.query(params).promise()
  }

  scan(params: DocumentClient.ScanInput): Promise<DocumentClient.ScanOutput> {
    return this.docClient.scan(params).promise()
  }

  update(
    params: DocumentClient.UpdateItemInput
  ): Promise<DocumentClient.UpdateItemOutput> {
    return this.docClient.update(params).promise()
  }
}
