import { BigNumber } from "bignumber.js"
import { createLogger } from "./services"

const D = createLogger("BitcoinDifficulty")

function hexStrToNumber(hexStr: string): BigNumber {
  D.assert(hexStr.startsWith("0x"), "should start with 0x")
  return new BigNumber(hexStr)
}

// Pooled mining often uses non-truncated targets known as "pdiff" which puts "pool difficulty 1" (maximum difficulty) at:
const HIGHEST_TARGET: BigNumber = hexStrToNumber(
  "0x00000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"
)
// Bitcoin core itself truncates the targets so that it can store them as a floating point number (called "bdiff"). So they look like this:
const HIGHEST_TARGET_TRUNCATED: BigNumber = hexStrToNumber(
  "0x00000000FFFF0000000000000000000000000000000000000000000000000000"
)

/**
 * Handles various estimations/calculations around bitcion's difficulty.
 * Note that this doesn't work for all algorithms like Equihash and Litecoin where there is additional work to be done.
 * See Estimator instead which uses different inputs (primarily network hashrate and mean time) approach instead.
 */
export class BitcoinDifficulty {
  /**
   * Given a hex target, returns the difficulty for a "bdiff" / "truncated" target (the way bitcoin core stores them).
   * @param targetStr A hex string representing the target you want to know difficulty from. Should be truncated ("bdiff").
   * @returns {string} Returns the difficulty as a string. String because JS Number precision isn't accurate enough.
   */
  static targetToBdiff(targetStr: string): string {
    let target = hexStrToNumber(targetStr)
    return HIGHEST_TARGET_TRUNCATED.dividedBy(target).toFixed(12, 1)
  }

  /**
   * Given a hex target, returns the difficulty for a "pdiff" / "un-truncated" target (the way most pools and mining hardware deal with them).
   * @param targetStr A hex string representing the target you want to know difficulty from. Should be un-truncated ("pdiff").
   * @returns {string} Returns the difficulty as a string. String because JS Number precision isn't accurate enough.
   */
  static targetToPdiff(targetStr: string): string {
    let target = hexStrToNumber(targetStr)
    return HIGHEST_TARGET.dividedBy(target).toFixed(12, 1)
  }

  /**
   * Given a "bdiff" / "truncated" difficulty (the way bitcoin core stores it), returns the target hash.
   * @param difficulty the difficulty specified as a the packed difficulty "bdiff" decimal number.
   */
  static bdiffToTarget(difficulty: string): string {
    const maxBdiff = HIGHEST_TARGET_TRUNCATED
    const diff = new BigNumber(difficulty, 10)
    const target = maxBdiff.dividedToIntegerBy(diff)
    // now target has some gibberish in it so we truncate it by shifting and then restoring it:
    let targetByteLength = target.toString(16).length / 2

    // shift it down preserving only the final three bytes (as packed target allows three significant bytes)
    let targetBitLengthMinusThree = (targetByteLength - 3) * 8
    let shiftBy = new BigNumber(2).pow(targetBitLengthMinusThree)
    let targetPrefix = target.dividedToIntegerBy(shiftBy)
    // now shift it back up (leaving zeros behind):
    let packedTarget = targetPrefix.multipliedBy(shiftBy)
    return "0x" + packedTarget.toString(16)
  }

  /**
   * Returns the full hash target as a hex string from the specified packed target.
   * @param packedTargetStr Packed target in hex as stored in bitcoin block (bits).
   */
  static packedTargetToTarget(packedTargetStr: string): string {
    /** packed target is 32 bits containing two parts:
     * - high order byte is number of bytes in target
     * - remaining bits the prefix for the target (in hex)
     **/
    let packedTargetNum = Number.parseInt(packedTargetStr)
    let targetByteLength = (packedTargetNum & 0xff000000) >>> 24
    targetByteLength = targetByteLength - 3 // because we use 3 bytes for the prefix
    let targetBitLength = targetByteLength * 8
    let targetPrefix = packedTargetNum & 0x00ffffff
    let bigTarget = new BigNumber(targetPrefix)
    bigTarget = bigTarget.multipliedBy(new BigNumber(2).pow(targetBitLength))
    return "0x" + bigTarget.toString(16)
  }

  /**
   * Estimates the number of seconds (on average) that will be required to mine a block.
   * @param difficulty The difficulty to use in the estimate.
   * @param hahesPerSecondHashRate: The hash rate of hardware to make the estimate for
   */
  static estimatedSecondsToMineBlock(
    difficulty: number,
    hahesPerSecondHashRate: number
  ): number {
    return (difficulty * 2 ** 32) / hahesPerSecondHashRate
  }

  static estimatedHoursToMineBlock(
    difficulty: number,
    hahesPerSecondHashRate: number
  ): number {
    return (
      BitcoinDifficulty.estimatedSecondsToMineBlock(
        difficulty,
        hahesPerSecondHashRate
      ) /
      60 /
      60.0
    )
  }

  static estimatedDaysToMineBlock(
    difficulty: number,
    hahesPerSecondHashRate: number
  ): number {
    return (
      BitcoinDifficulty.estimatedSecondsToMineBlock(
        difficulty,
        hahesPerSecondHashRate
      ) /
      60 /
      60.0 /
      24
    )
  }
}
