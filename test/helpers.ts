import { URL } from 'url'
import * as path from 'path'
import MockFetch from "../test-tools/MockFetch"


function localDirMapperZCash (urlInput) {
  const u = new URL(urlInput)
  return `offset=${u.searchParams.get('offset')}.json`
}

/**
 * Returns a api.zcha.in compatible cross fetch to read zcash blocks from local directory.
 */
export const FetchThunkForZCash = new MockFetch(path.resolve(__dirname, '../test-data/zcash-blocks'), localDirMapperZCash).fetchThunk()
