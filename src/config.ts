/**
 * Authenticator interface for providing authentication headers.
 */
export interface Authenticator {
  /**
   * Returns the authentication headers for a request.
   */
  getAccessToken(): Promise<string>
}

/**
 * Configuration for the Approvio SDK.
 */
export interface ApprovioConfig {
  /**
   * The base URL of the Approvio API.
   */
  endpoint: string

  /**
   * The authenticator to use for requests.
   */
  authenticator: Authenticator
}
