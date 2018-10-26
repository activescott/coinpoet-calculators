# coinpoet-cryptocurrency-mining-estimators

A library to make various estimates related mining cryptocurrency including time to mine blocks and projecting future difficulty.

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

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

See /demo/index.ts

# Todo / Roadmap

see /docs/todo.md
