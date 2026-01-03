/**
 * Authenticator interface for providing authentication tokens.
 * Implementations are responsible for managing the token lifecycle, including
 * storage and automatic renewal when expired.
 */
export interface Authenticator {
  /**
   * Returns a valid access token.
   * If the current token is expired, the implementation should handle the refresh logic.
   */
  getAccessToken(): Promise<string>
}

/**
 * Main configuration for the Approvio SDK.
 * Used to initialize the Approvio client with the API endpoint and authentication method.
 */
export interface ApprovioServerConfig {
  /**
   * The base URL of the Approvio API.
   */
  endpoint: string
}
