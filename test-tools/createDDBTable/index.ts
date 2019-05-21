import AWS from "aws-sdk"

async function main() {
  AWS.config.update({
    region: "us-west-2",
    dynamodb: {
      endpoint: "https://localhost:8000"
    }
  })

  const ddb = new AWS.DynamoDB()
  const params = {
    TableName: "zcash-blocks",
    KeySchema: [
      { AttributeName: "height", KeyType: "HASH" } //Partition key
      // no Sort/Range key
    ],
    AttributeDefinitions: [
      { AttributeName: "hash", AttributeType: "S" },
      { AttributeName: "height", AttributeType: "N" },
      { AttributeName: "time", AttributeType: "N" },
      { AttributeName: "previousBlockHash", AttributeType: "S" },
      // Note: Numbers permit 38-digit precision: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.NamingRulesDataTypes.html#HowItWorks.DataTypes
      { AttributeName: "chainWork", AttributeType: "N" },
      { AttributeName: "reward", AttributeType: "N" }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "hash",
        KeySchema: [{ AttributeName: "hash", KeyType: "HASH" }],
        Projection: {
          // NOTE: as long as items are <1K, you can project more attributes at no extra cost: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-indexes-general.html#bp-indexes-general-projections
          ProjectionType: "ALL"
        }
      }
    ]
  }

  let createTableResp
  try {
    createTableResp = await ddb.createTable(params)
  } catch (err) {
    console.error("Failed to create table:", err)
    return
  }
  console.log("Created table:", createTableResp)
}

main()
