#!/bin/bash
THISDIR=$(cd $(dirname "$0"); pwd) #this script's directory
clear;

# Image from https://hub.docker.com/r/amazon/dynamodb-local?ref=login
# Usage details: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.UsageNotes.html

CONTAINER_NAME=ddb

if [[ "$(docker ps -a -q -f name=^/${CONTAINER_NAME}$ 2> /dev/null)" != "" ]]; then
  # image exists locally, but is it running?
  if [[ "$(docker ps -q -f status=running -f name=^/${CONTAINER_NAME}$ 2> /dev/null)" != "" ]]; then
    echo "Container $CONTAINER_NAME is already running"
  else #[[ "$(docker ps -q -f status=exited -f name=^/${CONTAINER_NAME}$ 2> /dev/null)" != "" ]]; then
    echo "Container $CONTAINER_NAME exists but is exited. Starting..."
    docker start $CONTAINER_NAME
  fi
else
  # container doesn't yet exist in any state, download:
  echo "Container not yet local. Downloading..."
  docker run --name $CONTAINER_NAME --detach -p 8000:8000 amazon/dynamodb-local
fi

  #TODO: RUN scripts to create the table. 
  # See https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GettingStarted.NodeJs.01.html
  # https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_CreateTable.html
  # https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_UpdateTable.html
