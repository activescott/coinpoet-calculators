/* eslint-env mocha */
import { expect } from 'chai'
import * as sinon from 'sinon'
import * as _ from 'lodash'
import { URL } from 'url'
import * as path from 'path'
import { FetchThunkForZCash } from '../helpers'

import BlockchainReader from '../../src/blockchains/BlockchainReader'
import BlockStorageFileSystem from '../../src/blockchains/BlockStorageFileSystem'

describe('BlockchainReader', function () {
  let sandbox: sinon.SinonSandbox
  let reader: BlockchainReader

  beforeEach(() => {
    sandbox = sinon.sandbox.create()
    reader = new BlockchainReader(new BlockStorageFileSystem(path.resolve(__dirname, '../../test-data/zcash-blocks/by-height')))
  })

  afterEach(() => {
    sandbox.restore()
    sandbox = null
  })

  it('should have newestBlock', async function () {
    let b = await reader.newestBlock()
    expect(b).to.have.property('height', 334482)
    expect(b).to.have.property('time', 1528013877)
  })

  describe('subset', function () {
    it('should work with exact start/end block times', async function () {
      this.timeout(5000)
      
      const testOldestBlock = {
        height: 303413,
        datestamp: new Date(1523328481 * 1000)
      }
      const testNewestBlock = {
        height: 303416,
        datestamp: new Date(1523328969 * 1000)
      }
      let chain = await reader.subset(testOldestBlock.datestamp, testNewestBlock.datestamp)
      expect(chain.oldestBlock).to.have.property('height', testOldestBlock.height, 'oldestBlock height')
      expect(chain.newestBlock).to.have.property('height', testNewestBlock.height, 'newestBlock height')
    })

    it('should read to first block', async function () {
      // deliberately old date will require reading to oldest block
      let chain = await reader.subset(new Date(1900, 1, 1), new Date())
      expect(chain.oldestBlock).has.property('hash', '00040fe8ec8471911baa1db1266ea15dd06b4a8a5c453883c000b031973dce08')
    })

    it.skip('should work with start time after block\'s time, end time before end block\'s time', async function () {
    })
  
  })

  //TODO: DO We really need previous here? Maybe just subset is enough?
  describe.skip('previous', function () {
    it('should return a single ancestor', async function () {
      let b = await reader.newestBlock()
      let prev = await reader.previous(b)
      expect(prev).to.have.property('height', 306252)
    })

    it.skip('should return multiple ancestors', async function () {
      let b = await reader.newestBlock()
      let prev0 = await reader.previous(b)
      let prev1 = await reader.previous(prev0)
      let prev2 = await reader.previous(prev1)
      
      expect(prev0).to.have.property('height', 306252)
      expect(prev1).to.have.property('height', 306251)
      expect(prev2).to.have.property('height', 306250)
    })
  })
})
