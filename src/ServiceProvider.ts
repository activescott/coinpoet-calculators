import { fetch as CrossFetch } from 'cross-fetch'

export default class ServiceProvder {
  /**
   * The whatwg fetch implementation to use.
   */
  public static Fetch: FetchInterface = CrossFetch
}

export interface FetchInterface {
  (input: any, init?: any): Promise<FetchResponse>
}

export interface FetchResponse {
  readonly ok: boolean
  json(): Promise<any>
}
