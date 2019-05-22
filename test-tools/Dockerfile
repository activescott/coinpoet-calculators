FROM amazon/dynamodb-local
# https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.UsageNotes.html
CMD java -jar DynamoDBLocal.jar -inMemory -sharedDb
# mostly only need this Dockerfile to add the -sharedDb param. Otherwise could run the container directly from dockerhub.
ENTRYPOINT java -jar DynamoDBLocal.jar -inMemory -sharedDb