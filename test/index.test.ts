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

ServiceProvider.Fetch = buildFetchMock()
