import { URL } from 'url'
import * as path from 'path'
import MockFetch from "../test-tools/MockFetch"

function localDirMapperZCash (urlInput) {
  const u = new URL(urlInput)
  return `offset=${u.searchParams.get('offset')}.json`
}
