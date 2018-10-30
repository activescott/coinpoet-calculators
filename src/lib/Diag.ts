export enum LogLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4
}

export default class Diag {
  private _prefix: string
  private readonly _level: LogLevel
  public static Level: LogLevel = LogLevel.WARN
  public static readonly NONE = 0
  public static readonly ERROR = 1
  public static readonly WARN = 2
  public static readonly INFO = 3
  public static readonly DEBUG = 4

  constructor(prefix, level?: LogLevel) {
    this._prefix = prefix
    this._level = level ? level : Diag.Level
  }

  log(...args) {
    console.log(`${this._prefix}:`, ...args)
  }

  debug(...args) {
    if (this._level >= LogLevel.DEBUG) console.log(`${this._prefix}:`, ...args)
  }

  info(...args) {
    if (this._level >= LogLevel.INFO) console.log(`${this._prefix}:`, ...args)
  }

  warn(...args) {
    if (this._level >= LogLevel.WARN) console.log(`${this._prefix}:`, ...args)
  }

  error(...args) {
    if (this._level >= LogLevel.ERROR)
      console.error(`${this._prefix}:`, ...args)
  }

  assert(test, ...args) {
    if (this._level >= LogLevel.ERROR) console.assert(test, ...args)
  }
}
