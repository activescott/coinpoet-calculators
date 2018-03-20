/* eslint-env mocha */
import { expect } from 'chai'
import * as BigInteger from 'bigi'
import * as _ from 'lodash'

import { BitcoinDifficulty } from '../index'

describe('BitcoinDifficulty', function () {
  
  it('targetToBdiff', function () {
    let val = BitcoinDifficulty.targetToBdiff('0x00000000000404CB000000000000000000000000000000000000000000000000')
    expect(val).to.equal('16307.420938523983')
  })

  it('targetToPdiff', function () {
    let val = BitcoinDifficulty.targetToPdiff('0x00000000000404CB000000000000000000000000000000000000000000000000')
    expect(val).to.equal('16307.669773817162')
  })

  it('bdiffToTarget', function () {
    let val = BitcoinDifficulty.bdiffToTarget('16307.420938523983')
    expect(val).to.equal('0x404cb000000000000000000000000000000000000000000000000')
  })

  it('packedTargetToTarget 1', function () {
    let val = BitcoinDifficulty.packedTargetToTarget('0x1b3cc366')
    expect(val).to.equal('0x3cc366000000000000000000000000000000000000000000000000')
    val = BitcoinDifficulty.packedTargetToTarget('0x1b0404cb')
    expect(val).to.equal('0x404cb000000000000000000000000000000000000000000000000')
  })

  it('packedTargetToTarget 2', function () {
    let val = BitcoinDifficulty.packedTargetToTarget('0x1b0404cb')
    expect(val).to.equal('0x404cb000000000000000000000000000000000000000000000000')
  })

  const GIGAHASHES = 10 ** 9
  const TERAHASHES = GIGAHASHES * 1000

  it('estimatedSecondsToMineBlock', function () {
    let val = BitcoinDifficulty.estimatedSecondsToMineBlock(20000, 1 * GIGAHASHES)
    expect(val).to.be.closeTo(85899.34, 0.05)
  })

  it('estimatedHoursToMineBlock', function () {
    let val = BitcoinDifficulty.estimatedHoursToMineBlock(20000, 1 * GIGAHASHES)
    expect(val).to.be.closeTo(23.86, 0.05)
  })

  it('estimatedDaysToMineBlock', function () {
    let val = BitcoinDifficulty.estimatedDaysToMineBlock(20000, 1 * GIGAHASHES)
    expect(val).to.be.closeTo(0.9942, 0.0005)
  })

  it('estimatedDaysToMineBlock 2', function () {
    let val = BitcoinDifficulty.estimatedDaysToMineBlock(3290605988755.001, 1000 * TERAHASHES)
    expect(val).to.be.closeTo(163.5769, 0.0005)
  })
})
