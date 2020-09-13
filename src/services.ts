import { fetch as CrossFetch } from "cross-fetch"
export { createLogger } from "@activescott/diag-winston"

// The idea of this module is to put internal dependent utilities here that can be replaced if necessary

export interface FetchInterface {
  (input: any, init?: any): Promise<FetchResponse>
}

export interface FetchResponse {
  readonly ok: boolean
  json(): Promise<any>
}

/**
 * The whatwg fetch implementation to use.
 */
export const FetchImpl = CrossFetch
