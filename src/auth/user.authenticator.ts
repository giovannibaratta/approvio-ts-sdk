import {RefreshTokenRequest, TokenResponse} from "@approvio/api"
import {TokenBaseAuthenticator} from "../interfaces"
import {isJwtTokenExpired} from "./utils"
import axios, {AxiosInstance, InternalAxiosRequestConfig} from "axios"
import {removeTrailingSlash, validateURL} from "../client/utils"

/**
 * Authenticator for Approvio Users (Human sessions).
 * Handles automatic token renewal using a refresh token when the access token expires.
 */
export class CliUserAuthenticator implements TokenBaseAuthenticator {
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

  customizeAxios(axios: AxiosInstance): void {
    axios.interceptors.request.use(async (axiosConfig: InternalAxiosRequestConfig) => {
      const accessToken = await this.getAccessToken()
      axiosConfig.headers.set("Authorization", `Bearer ${accessToken}`)
      return axiosConfig
    })
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

    const tokenResponse = await axios.post<TokenResponse>(`${this.endpoint}/auth/cli/refresh`, request)

    return tokenResponse.data
  }
}
