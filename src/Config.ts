import * as path from "path"
export default class Config {
  static get zcashBlocksPath(): string {
    return path.join(path.dirname(module.filename), "../test-data/zcash-blocks")
  }

  /**
   * I keep a local copy of a very large portion of the zcash blockchain on my dropbox in JSON.
   * This returns my path.
   * It is useful for testing purposes because tests run WAY faster when it is present
   */
  static get zcashScottsPath(): string {
    return "/Users/scott/Dropbox/Backups/zcash-blocks/by-height"
  }
}
