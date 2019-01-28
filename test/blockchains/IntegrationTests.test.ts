/* eslint-env mocha */
import { expect } from "chai"
import * as _ from "lodash"
import { existsSync } from "fs"
import CompositeBlockStorage from "../../src/blockchains/CompositeBlockStorage"
import BlockStorageFileSystem from "../../src/blockchains/BlockStorageFileSystem"
import Config from "../../src/Config"
import ZChainApiBlockStorage from "../../src/blockchains/ZChainApiBlockStorage"

describe.skip("***** INTEGRATION TESTS *****", function() {
  this.timeout(10000)

  describe("Composite ZChain & FileSystem", function() {
    it("Should print FS & ZChain Block Count and then use composite to get ZChain Block Count", async function() {
      if (!existsSync(Config.zcashLargeTestDataPath)) {
        this.skip()
      }

      let zchain = new ZChainApiBlockStorage()
      const zchainCount = await zchain.getBlockCount()
      console.log("zchain count:", zchainCount)

      let disk = new BlockStorageFileSystem(
        Config.zcashLargeTestDataPath,
        true,
        ZChainApiBlockStorage.calculateRewardForBlockHeight
      )
      console.log("disk count:", await disk.getBlockCount())

      let composite1 = new CompositeBlockStorage(disk, zchain)
      const c1Count = await composite1.getBlockCount()
      console.log("composite1 count:", c1Count)

      let composite2 = new CompositeBlockStorage(zchain, disk)
      const c2Count = await composite2.getBlockCount()
      console.log("composite2 count:", c2Count)

      expect(c1Count).to.equal(zchainCount)
      return expect(c1Count).to.equal(c2Count)
    })
  })
})
