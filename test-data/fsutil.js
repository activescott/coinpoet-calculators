'use strict'
const path = require('path')
const fs = require('fs')

/**
 * Cleans the specified directory by deleting all contents but making sure the directory exists.
 * @param {string} dir The directory to clean.
 */
function cleanDir (outDir) {
  if (fs.existsSync(outDir)) {
    rmdir(outDir)
  }
  mkdir(outDir)
}

/**
 * Makes the specified directory and all parent directories as needed.
 */
function mkdir (dirname) {
  let dirs = dirname.split(path.sep)
  if (dirs[0] === '') {
    // first was a rooted dir
    dirs = dirs.slice(1)
    dirs[0] = path.sep + dirs[0]
  }
  for (let i = 0; i < dirs.length; i++) {
    let dir = dirs.slice(0, i + 1).join(path.sep)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir)
    }
  }
}

/**
 * Recursively removes the directory and all of its contents.
 */
function rmdir (dir) {
  let list = fs.readdirSync(dir)
  for (let i = 0; i < list.length; i++) {
    let filename = path.join(dir, list[i])
    let stat = fs.statSync(filename)

    if (filename === '.' || filename === '..') {
      // pass these files
    } else if (stat.isDirectory()) {
      // rmdir recursively
      rmdir(filename)
    } else {
      // rm fiilename
      fs.unlinkSync(filename)
    }
  }
  fs.rmdirSync(dir)
}

module.exports = {
  cleanDir,
  mkdir,
  rmdir
}
