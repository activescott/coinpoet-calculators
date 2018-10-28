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

# Usage / Example

See [/demo/index.ts](demo/index.ts)

# Todo / Roadmap

see [/docs/todo.md](docs/todo.md)
