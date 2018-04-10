/* eslint-env mocha */
import { expect } from 'chai'
import * as _ from 'lodash'
import { URL } from 'url'
import * as path from 'path'

import ZCashBlockchainReader from '../../src/blockchains/ZCashBlockchainReader'
import MockFetch from '../../test-tools/MockFetch';

describe('ZCashBlockchainReader', function () {
  function localDirMapper (urlInput) {
    const u = new URL(urlInput)
    return `offset=${u.searchParams.get('offset')}.json`
  }

  function fetchImpl () {
    return new MockFetch(path.resolve('test-data/zcash-blocks'), localDirMapper).fetchThunk()
  }

  async function OVERWRITE_TEST_DATA() {
    // BE CAREFUL THIS OVERWRITES TEST DATA
    let fetcher = new MockFetch(path.resolve('test-data/zcash-blocks'), localDirMapper)
    let urls = [0, 20, 40, 60, 80].map(n => `https://api.zcha.in/v2/mainnet/blocks?sort=height&direction=descending&limit=20&offset=${n}`)
    return fetcher.createMockData(urls)
  }

  before(async function () {
    //this.timeout(6000)
    //return await OVERWRITE_TEST_DATA()
  })

  it('should have newestBlock', async function () {
    let reader = new ZCashBlockchainReader(fetchImpl())
    let b = await reader.newestBlock()
    expect(b).to.have.property('height', 303460)
    expect(b).to.have.property('timestamp', 1523334928)
  })

  describe('slice', function () {
    it('exact start/end block times', async function () {
      let reader = new ZCashBlockchainReader(fetchImpl())
      
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

    it.skip('start time after block\'s time, end time before end block\'s time', async function () {
    })

  })

  it.skip('should handle duplicate blocks', function () {
    //TODO: The API could return the same block again (while paging chain/offset moves so duplicate block returned). Make sure we behave properly
  })

})

