import * as loglevel from "loglevel-debug"
// specify DEBUG=prefix1,prefix2:* to turn on debug support. See https://github.com/vectrlabs/loglevel-debug#usage

export default abstract class Diag {
  public static createLogger(prefix: string): Diag {
    return new DiagImp(prefix, loglevel(prefix))
  }

  abstract debug(...args: any[]): void

  abstract info(...args: any[]): void

  abstract warn(...args: any[]): void

  abstract error(...args: any[]): void

  abstract assert(test: boolean, ...args: any[]): void

  abstract childLogger(prefix: string): Diag
}

class DiagImp extends Diag {
  constructor(readonly prefix: string, readonly logger: loglevel.Logger) {
    super()
  }

  debug(...args: any[]): void {
    this.logger.debug(...args)
  }
  info(...args: any[]): void {
    this.logger.info(...args)
  }
  warn(...args: any[]): void {
    this.logger.warn(...args)
  }
  error(...args: any[]): void {
    this.logger.error(...args)
  }
  assert(test: boolean, ...args: any[]): void {
    if (!test) this.logger.error(...args)
  }
  childLogger(prefix: string): Diag {
    return new DiagImp(prefix, this.logger.getLogger(prefix))
  }
}
