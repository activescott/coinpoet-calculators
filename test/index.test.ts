import * as path from 'path'
import { URL } from 'url'
import ServiceProvider from '../src/ServiceProvider'
import MockFetch from '../test-tools/MockFetch'

function buildFetchMock () {
  return new MockFetch(path.resolve(__dirname, '../test-data/zcash-blocks'), localDirMapper).fetchThunk()
}

function localDirMapper (urlInput) {
  const u = new URL(urlInput)
  return `offset=${u.searchParams.get('offset')}.json`
}

ServiceProvider.Fetch = buildFetchMock()

async function OVERWRITE_TEST_DATA() {
  // BE CAREFUL THIS OVERWRITES TEST DATA
  let fetcher = new MockFetch(path.resolve('test-data/zcash-blocks'), localDirMapper)
  let urls = [0, 20, 40, 60, 80].map(n => `https://api.zcha.in/v2/mainnet/blocks?sort=height&direction=descending&limit=20&offset=${n}`)
  return fetcher.createMockData(urls)
}
