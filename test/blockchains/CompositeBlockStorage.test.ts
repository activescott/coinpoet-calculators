/* eslint-env mocha */
import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import { expect } from 'chai'
import * as sinon from 'sinon'
import * as _ from 'lodash'
import CompositeBlockStorage from '../../src/blockchains/CompositeBlockStorage'
import { MockBlockStorage } from '../Mocks/MockBlockStorage'
import { MockBlock } from '../Mocks/MockBlock'

chai.use(chaiAsPromised);

describe('CompositeBlockStorage', function () {
  let sandbox: sinon.SinonSandbox
  let bs: CompositeBlockStorage

  beforeEach(() => {
    sandbox = sinon.sandbox.create()
  })

  afterEach(() => {
    sandbox.restore()
    sandbox = null
  })

  describe('getBlockCount', function () {
    it('should use max from primary', async function () {
      let prim = sandbox.createStubInstance(MockBlockStorage)
      prim.getBlockCount.resolves(2)

      let sec = sandbox.createStubInstance(MockBlockStorage)
      sec.getBlockCount.resolves(1)

      bs = new CompositeBlockStorage(prim, sec) 
      return expect(bs.getBlockCount()).to.eventually.equal(2)
    })

    it('should use max from secondary', async function () {
      let prim = sandbox.createStubInstance(MockBlockStorage)
      prim.getBlockCount.resolves(1)

      let sec = sandbox.createStubInstance(MockBlockStorage)
      sec.getBlockCount.resolves(2)

      bs = new CompositeBlockStorage(prim, sec)
      return expect(bs.getBlockCount()).to.eventually.equal(2)
    })
  })

  describe('getBlockHash', function () {
    it('should use primary', async function () {
      let prim = sandbox.createStubInstance(MockBlockStorage)
      prim.getBlockHash.resolves('primary-hash')

      let sec = sandbox.createStubInstance(MockBlockStorage)
      sec.getBlockHash.resolves('secondary-hash')

      bs = new CompositeBlockStorage(prim, sec)
      return expect(bs.getBlockHash(100)).to.eventually.equal('primary-hash')
    })

    it('should use secondary if primary returns null', async function () {
      let prim = sandbox.createStubInstance(MockBlockStorage)
      prim.getBlockHash.resolves(null)

      let sec = sandbox.createStubInstance(MockBlockStorage)
      sec.getBlockHash.resolves('secondary-hash')

      bs = new CompositeBlockStorage(prim, sec)
      return expect(bs.getBlockHash(100)).to.eventually.equal('secondary-hash')
    })

    it('should use secondary if primary throws', async function () {
      let prim = sandbox.createStubInstance(MockBlockStorage)
      prim.getBlockHash.rejects(new Error())

      let sec = sandbox.createStubInstance(MockBlockStorage)
      sec.getBlockHash.resolves('secondary-hash')

      bs = new CompositeBlockStorage(prim, sec)
      return expect(bs.getBlockHash(100)).to.eventually.equal('secondary-hash')
    })
  })

  describe('getBlock', function () {
    it('should use primary', async function () {

      let b1 = sandbox.createStubInstance(MockBlock)
      b1.hash = 'b1'
      let b2 = sandbox.createStubInstance(MockBlock)
      b2.hash = 'b2'
      
      let prim = sandbox.createStubInstance(MockBlockStorage)
      prim.getBlock.resolves(b1)

      let sec = sandbox.createStubInstance(MockBlockStorage)
      sec.getBlock.resolves(b2)

      bs = new CompositeBlockStorage(prim, sec)
      return expect(bs.getBlock('doesnt matter because stubbed')).to.eventually.have.property('hash', 'b1')
    })

    it('should use secondary if primary returns null', async function () {
      let b1 = sandbox.createStubInstance(MockBlock)
      b1.hash = 'b1'
      let b2 = sandbox.createStubInstance(MockBlock)
      b2.hash = 'b2'
      
      let prim = sandbox.createStubInstance(MockBlockStorage)
      prim.getBlock.resolves(null)

      let sec = sandbox.createStubInstance(MockBlockStorage)
      sec.getBlock.resolves(b2)

      bs = new CompositeBlockStorage(prim, sec)
      return expect(bs.getBlock('doesnt matter because stubbed')).to.eventually.have.property('hash', 'b2')
    })

    it('should use secondary if primary throws', async function () {
      let b1 = sandbox.createStubInstance(MockBlock)
      b1.hash = 'b1'
      let b2 = sandbox.createStubInstance(MockBlock)
      b2.hash = 'b2'
      
      let prim = sandbox.createStubInstance(MockBlockStorage)
      prim.getBlock.rejects(new Error())

      let sec = sandbox.createStubInstance(MockBlockStorage)
      sec.getBlock.resolves(b2)

      bs = new CompositeBlockStorage(prim, sec)
      return expect(bs.getBlock('doesnt matter because stubbed')).to.eventually.have.property('hash', 'b2')
    })
  })
})
