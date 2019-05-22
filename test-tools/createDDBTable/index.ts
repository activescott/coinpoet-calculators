import AWS from "aws-sdk"

async function main() {
  // NOTE: Lambda functions don't need explicit creds: http://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-lambda.html
  let dynamoConfig
  //if (process.env.IS_LOCAL === 'true' || process.env.AWS_REGION === 'LOCAL') {
  if (true) {
    dynamoConfig = {
      region: "localhost",
      endpoint: "http://localhost:8000",
      // Below because DDB SDK requires them but DDB Local doesn't need them so we just have to set something to prevent error:
      // However, make sure that you run aws-cli with the same creds
      accessKeyId: "na",
      secretAccessKey: "na"
    }
  } else {
    dynamoConfig = {
      region: process.env.AWS_REGION
    }
  }
  console.log("dynamoConfig:", dynamoConfig)
  // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html

  const ddb = new AWS.DynamoDB(dynamoConfig)
  const params: AWS.DynamoDB.CreateTableInput = {
    TableName: "zcash-blocks",
    KeySchema: [
      { AttributeName: "height", KeyType: "HASH" } //Partition key
      // no Sort/Range key
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
        IndexName: "hash",
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

  let createTableResp: AWS.DynamoDB.CreateTableOutput
  try {
    createTableResp = await ddb.createTable(params).promise()
  } catch (err) {
    console.error("Failed to create table:", err)
    return
  }
  console.log("Succesfully created table:", createTableResp)
}

main()
