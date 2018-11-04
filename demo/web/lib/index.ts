import "isomorphic-fetch"
import { IncomingMessage } from "http"
import { Request } from "express"
import getConfig from "next/config"
import * as _ from "lodash"

const { publicRuntimeConfig } = getConfig()

/**
 * Returns the protocol, host (and port) for the base url of the API.
 * Like `https://localhost:3000`
 * @param request The incoming request of the current host (to retreive request protocol and host)
 */
export function buildBaseUrlForApi(request?: IncomingMessage) {
  // Next's types assume a raw nodejs request (IncomingMessage) but we happen to know Express is providing our request and it has some very handy properties:
  const expressRequest = request as Request
  const protocol =
    expressRequest && expressRequest.protocol
      ? expressRequest.protocol + ":"
      : window.location.protocol
  const hostname = expressRequest
    ? expressRequest.hostname
    : window.location.hostname
  return `${protocol}//${hostname}:${publicRuntimeConfig.port}`
}

/**
 * Fetches the mean time between blocks for the specified coin and period.
 */
export async function fetchMeanTimeBetweenBlocks(
  request: IncomingMessage,
  coin: string,
  hours: number = 1
): Promise<number> {
  const baseUrl = buildBaseUrlForApi(request)
  const url = `${baseUrl}/api/meanTimeBetweenBlocks?coin=${coin}`
  const res = await fetch(url)
  const fetchResult = await res.json()
  if (!fetchResult.value) {
    throw new Error("Unable to fetch meanTimeBetweenBlocks")
  }
  if (!_.isNumber(fetchResult.value)) {
    throw new Error(
      "Unexpected result fetching meanTimeBetweenBlocks; Expected number."
    )
  }
  return fetchResult.value
}

export const coinFromQuery = (query: { coin: string }) =>
  query && query.coin ? query.coin : "zcash"
