/* eslint-env mocha */
import { expect } from 'chai'
import * as sinon from 'sinon'
import * as _ from 'lodash'
import { URL } from 'url'
import * as path from 'path'
import Config from '../../Config'
import BlockStorageZChainApi from '../../src/blockchains/BlockStorageZChainApi'
import { Block } from '../../src/interfaces'

describe('BlockStorageZChainApi', function () {
  let sandbox: sinon.SinonSandbox
  let storage: BlockStorageZChainApi

  beforeEach(() => {
    sandbox = sinon.sandbox.create()
    storage = new BlockStorageZChainApi()
  })

  afterEach(() => {
    sandbox.restore()
    sandbox = null
  })

  describe('getBlockCount', function () {
    it('should return correct count', async function () {
      let count = await storage.getBlockCount()
      expect(count).to.be.greaterThan(335000)
    })
  })

  describe('getBlockHash', function () {
    it('should return correct hash', async function () {
      expect(await storage.getBlockHash(27884)).to.equal('0000000031a021fe49de76ba35cce20ce1cbd071c30dbfebeda7bb403df9ecea')
    })
  })

  describe('getBlock', function () {
    it('should return correct block', async function () {
      const b = await storage.getBlock('0000000031a021fe49de76ba35cce20ce1cbd071c30dbfebeda7bb403df9ecea')
      expect(b).to.have.property('hash', '0000000031a021fe49de76ba35cce20ce1cbd071c30dbfebeda7bb403df9ecea')
      expect(b).to.have.property('height', 27884)
    })
  })

})
