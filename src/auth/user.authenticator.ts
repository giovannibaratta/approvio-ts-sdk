import {RefreshTokenRequest, TokenResponse} from "@approvio/api"
import {Authenticator} from "../interfaces"
import {isJwtTokenExpired} from "./utils"
import axios from "axios"
import {removeTrailingSlash, validateURL} from "../client/utils"

/**
 * Authenticator for Approvio Users (Human sessions).
 * Handles automatic token renewal using a refresh token when the access token expires.
 */
export class UserAuthenticator implements Authenticator {
  private readonly endpoint: string

  constructor(
    endpoint: string,
    private accessToken: string,
    private refreshToken: string,
    /**
     * Optional callback triggered whenever the tokens are successfully refreshed.
     * Useful for persisting the new tokens in a configuration file or local storage.
     */
    private readonly onTokenRefreshed?: (accessToken: string, refreshToken: string) => void
  ) {
    validateURL(endpoint)
    this.endpoint = removeTrailingSlash(endpoint)
  }

  /**
   * Returns a valid access token.
   * If the token is expired, it will automatically attempt to renew it using the refresh token.
   */
  async getAccessToken(): Promise<string> {
    if (this.isTokenExpired()) {
      const {accessToken, refreshToken} = await this.renewToken()
      this.accessToken = accessToken
      this.refreshToken = refreshToken
      this.onTokenRefreshed?.(this.accessToken, this.refreshToken)
    }

    return this.accessToken
  }

  private isTokenExpired(): boolean {
    if (!this.accessToken) return true
    return isJwtTokenExpired(this.accessToken)
  }

  private async renewToken(): Promise<TokenResponse> {
    const request: RefreshTokenRequest = {
      refreshToken: this.refreshToken
    }

    const tokenResponse = await axios.post<TokenResponse>(`${this.endpoint}/auth/refresh`, request)

    return tokenResponse.data
  }
}
