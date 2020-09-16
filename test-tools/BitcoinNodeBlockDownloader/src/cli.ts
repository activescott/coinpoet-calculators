#!/usr/bin/env node
import program from "commander"
import { rmdir } from "./fsutil"
import { existsSync } from "fs"
import { BitcoinNodeBlockDownloader } from "./index"

export function main() {
  // https://nodejs.org/api/modules.html#modules_accessing_the_main_module
  const scottsPath = "/Users/scott/Dropbox/Backups/zcash-blocks/by-height/"
  let defaultDataPath = existsSync(scottsPath) ? scottsPath : ""

  program
    .command("download")
    .option(
      "-d, --dir [dir]",
      "Directory to download blocks to.",
      defaultDataPath
    )
    .option(
      "-n, --node [http url]",
      "The http path to the rpc endpoint on the Bitcoin Node.",
      "http://localhost:8000"
    )
    .option(
      "-b, --blockheight [blockheight]",
      "Maximum/highest block to start downloading from. By default the height of the full nodes blockchain.",
      parseInt,
      0
    )
    .option(
      "-c, --count [count]",
      "The number of blocks to download (starting at the max/highest block)",
      parseInt,
      0
    )
    .option("--clean", "Delete the existing files")
    .action((commandOptions: any) => {
      //console.log("commandOptions:", commandOptions)
      console.log("\ndownload options:")
      for (let option of ["dir", "node", "blockheight", "count", "clean"]) {
        console.log(` ${option}:`, commandOptions[option])
      }
      console.log()

      if (commandOptions.clean) {
        rmdir(commandOptions.dir)
      }
      console.log("Initializing downloader")
      const downloader = new BitcoinNodeBlockDownloader(
        commandOptions.dir,
        commandOptions.node
      )
      console.log("Download starting...")
      downloader
        .download(commandOptions.blockheight, commandOptions.count)
        .then(() => console.log("download finished!"))
    })

  const parsed = program.parse(process.argv)
  /*if (parsed.args.length === 0) {
    console.error("Please specify a command.\n")
    program.help()
  }
  */
}

if (require.main === module) {
  main()
}
