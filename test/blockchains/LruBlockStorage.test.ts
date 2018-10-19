/* eslint-env mocha */
import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import { expect } from 'chai'
import * as sinon from 'sinon'

import LruBlockStorage from '../../src/blockchains/LruBlockStorage'
import { MockBlock } from '../Mocks/MockBlock';
import { MockBlockStorage } from '../Mocks/MockBlockStorage';

chai.use(chaiAsPromised);

describe.only('LruBlockStorage', function () {
  let sandbox: sinon.SinonSandbox
  let lru: LruBlockStorage

  beforeEach(() => {
    sandbox = sinon.sandbox.create()
  })

  afterEach(() => {
    sandbox.restore()
    sandbox = null
  })
  
  describe('getBlock', function () {
    it('should read from cache', async function () {
      let mockStorage = sandbox.createStubInstance<MockBlockStorage>(MockBlockStorage)

      // init LRU
      lru = new LruBlockStorage(mockStorage)

      // set mock.getBlock to value A
      mockStorage.getBlock.withArgs('hash1').resolves(new MockBlock('hash1'))

      // read from LRU
      expect(await lru.getBlock('hash1')).to.have.property('hash', 'hash1')

      // change mockBlockStorage value
      mockStorage.getBlock.withArgs('hash1').resolves(new MockBlock('hash1XXX'))
      // expect cached value
      return expect(await lru.getBlock('hash1')).to.have.property('hash', 'hash1')
    })

    it('should maintain maxSize', async function () {
      let mockStorage = sandbox.createStubInstance<MockBlockStorage>(MockBlockStorage)
      
      const MAX_SIZE = 2
      lru = new LruBlockStorage(mockStorage, MAX_SIZE)
  
      for (let n = 1; n < 10; n++) {
        mockStorage.getBlock.withArgs(`hash${n}`).resolves(new MockBlock(`hash${n}`))
      }
  
      // read from LRU
      for (let n = 1; n < 10; n++) {
        await expect(await lru.getBlock(`hash${n}`)).to.have.property('hash', `hash${n}`)
        expect(lru.size).to.be.below(MAX_SIZE + 1)
      }
      
      // change mockBlockStorage value
      mockStorage.getBlock.withArgs('hash1').resolves(new MockBlock('hash1XXX'))
      // expect cached value
      return expect(await lru.getBlock('hash1')).to.have.property('hash', 'hash1')
    })
  }) 

  describe('getBlockCount', function () {
    it('should be written', function () {
      throw 'todo'
    })

  })

  describe('getBlockFromHeight', function () {
    it('should be written', function () {
      throw 'todo'
    })
  })

  describe('getBlockHash', function () {
    it('should be written', function () {
      throw 'todo'
    })
  })

})
