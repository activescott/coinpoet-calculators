'use strict'
import * as path from 'path'
import { URL } from 'url'
import * as _ from 'lodash'
import ServiceProvider from '../src/ServiceProvider'
import MockFetch from '../test-tools/MockFetch'

function buildFetchMock () {
  return new MockFetch(path.resolve(__dirname, '../test-data/zcash-blocks'), localDirMapper).fetchThunk()
}

function localDirMapper (urlInput) {
  const u = new URL(urlInput)
  return `offset=${u.searchParams.get('offset')}.json`
}

function* xrange (start, stop, step) {
  for (let i = start; i < stop; i += step) {
    yield i
  }
}

async function OVERWRITE_TEST_DATA() {
  // BE CAREFUL THIS OVERWRITES TEST DATA
  let fetcher = new MockFetch(path.resolve('./zcash-blocks'), localDirMapper)
  const total_pages = 303460 / 20
  let urls = _.map(Array.from(xrange(0, total_pages+1, 20)), n => `https://api.zcha.in/v2/mainnet/blocks?sort=height&direction=descending&limit=20&offset=${n}`)
  return fetcher.createMockData(urls)
}


OVERWRITE_TEST_DATA()
