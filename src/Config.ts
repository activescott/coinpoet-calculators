import * as path from "path"
export class Config {
  /**
   * Returns the path to a directory with zcash test data in it
   */
  static get zcashTinyTestDataBlocksPath(): string {
    return path.join(path.dirname(module.filename), "../test-data/zcash-blocks")
  }

  /**
   * I keep a local copy of a very large portion of the zcash blockchain on my dropbox in JSON.
   * This returns my path.
   * It is useful for testing purposes because tests run WAY faster when it is present
   */
  static get zcashLargeTestDataPath(): string {
    return "/Users/scott/Dropbox/Backups/zcash-blocks/by-height"
  }

  /**
   * Returns a local dir for tests that is expected to be empty.
   */
  static get emptyDirPath(): string {
    return path.join(path.dirname(module.filename), "../test-data/empty-dir")
  }
}
