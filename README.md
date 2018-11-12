# coinpoet-calculators

[![Build Status](https://travis-ci.org/activescott/coinpoet-calculators.svg?branch=master)](https://travis-ci.org/activescott/coinpoet-calculators)
[![Coverage Status](https://coveralls.io/repos/github/activescott/coinpoet-calculators/badge.svg?branch=master)](https://coveralls.io/github/activescott/coinpoet-calculators?branch=master)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![License: MPL 2.0](https://img.shields.io/badge/License-MPL%202.0-brightgreen.svg)](https://opensource.org/licenses/MPL-2.0)

A library for analyzing blockchain to estimate cryptocurrency-mining related information like time to mine blocks, future difficulty, and future earnings.

# Features

- Makes estimates about difficulty, block mining time, network hash rate, and mining earnings
- Uses actual data off of recent blocks in the blockchain itself as input.
- Calculate average time between recent blocks
- Estimates future earnings
- Can read blocks from json files on a local disk for performance and to avoid network traffic.
- Supports a least-recently-used in-memory cache for performance.
- Gracefully reads from multiple different sources for the blockchain to balance between high-performance local data and remote data sources like the ZChain API.
- ZCash support (designed around a set of primitives to support other blockchains)
- Unit tested

# Status

Unstable. All interfaces/classes subject to change.

# Compiling

The package is written in TypeScript. To build the package run the following from the root of the repo:

    yarn build # It will be built in /dist

# Usage / Example

## CLI Example

The main code for the CLI example is in [/demo/cli/index.ts](demo/cli/index.ts). To run the command line interface example take the following steps. First, [build the package](#compiling). Next, build the example command line interface example:

    cd demo/cli
    yarn # to install dependencies
    yarn start

Then follow the prompts and it will give you the requested info.

## Web Example

A more sophisticated example of how the library can be used in a web application is at `/demo/web/`. The main code using the package in this example is at and [/demo/web/api/index.ts](demo/web/api/index.ts). To build this example take the following steps. First, [build the package](#compiling). Next, execute the following commands from the root of the repo:

    cd demo/web
    yarn # to install dependencies
    yarn dev

# Todo / Roadmap

see [/docs/todo.md](docs/todo.md)
