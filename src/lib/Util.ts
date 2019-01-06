import { BigNumber } from "bignumber.js"

export function secondsToDays(seconds: number) {
  return seconds / 60 / 60 / 24
}
