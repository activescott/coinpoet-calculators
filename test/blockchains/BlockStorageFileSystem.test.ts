/* eslint-env mocha */
import { expect } from 'chai'
import * as sinon from 'sinon'
import * as _ from 'lodash'
import Config from '../../src/Config'
import BlockStorageFileSystem from '../../src/blockchains/BlockStorageFileSystem'

describe('BlockStorageFileSystem', function () {
  let sandbox: sinon.SinonSandbox
  let bsfs: BlockStorageFileSystem

  beforeEach(() => {
    sandbox = sinon.sandbox.create()
    bsfs = new BlockStorageFileSystem(Config.zcashBlocksPath)
  })

  afterEach(() => {
    sandbox.restore()
    sandbox = null
  })

  describe('getBlockCount', function () {
    it('should return correct count', async function () {
      expect(await bsfs.getBlockCount()).to.equal(334483)
    })
  })

  describe('getBlockHash', function () {
    it('should return correct hash', async function () {
      expect(await bsfs.getBlockHash(27884)).to.equal('0000000031a021fe49de76ba35cce20ce1cbd071c30dbfebeda7bb403df9ecea')
    })
  })

  describe('getBlock', function () {
    it('should return correct block', async function () {
      const b = await bsfs.getBlock('0000000031a021fe49de76ba35cce20ce1cbd071c30dbfebeda7bb403df9ecea')
      expect(b).to.have.property('hash', '0000000031a021fe49de76ba35cce20ce1cbd071c30dbfebeda7bb403df9ecea')
      expect(b).to.have.property('height', 27884)
    })
  })

})
