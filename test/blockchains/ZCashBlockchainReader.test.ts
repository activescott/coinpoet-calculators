/* eslint-env mocha */
import { expect } from 'chai'
import * as _ from 'lodash'
import { URL } from 'url'
import * as path from 'path'

import ZCashBlockchainReader from '../../src/blockchains/ZCashBlockchainReader'

describe('ZCashBlockchainReader', function () {

  it('should have newestBlock', async function () {
    let reader = new ZCashBlockchainReader()
    let b = await reader.newestBlock()
    expect(b).to.have.property('height', 303460)
    expect(b).to.have.property('timestamp', 1523334928)
  })

  describe('subset', function () {
    it('should work with exact start/end block times', async function () {
      let reader = new ZCashBlockchainReader()
      
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

    it.skip('should read to genesis block', async function () {
      //NOTE: offset=100.json is a null response which api.zcha.in does in the event of an offset that is before the beginning of the chain
    })

    it.skip('should work with start time after block\'s time, end time before end block\'s time', async function () {
    })

    it.skip('should handle duplicate blocks', function () {
      //TODO: The API could return the same block again (while paging chain/offset moves so duplicate block returned). Make sure we behave properly
    })
  
  })

  describe('ancestors', function () {
    it('should return a single ancestor', async function () {
      let reader = new ZCashBlockchainReader()
      let b = await reader.newestBlock()
      let ancestors = await reader.ancestors(b, 1)
      
      expect(ancestors).to.have.length(1)
      expect(ancestors[0]).to.have.property('height', 303459)
    })
  })

})

