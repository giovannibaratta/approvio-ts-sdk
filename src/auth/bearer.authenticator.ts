import {RefreshTokenRequest, TokenResponse} from "@approvio/api"
import {Authenticator} from "../config"
import {isTokenExpired} from "./utils"
import axios from "axios"

/**
 * simple authenticator that uses a static bearer token.
 */
export class BearerAuthenticator implements Authenticator {
  constructor(
    private readonly endpoint: string,
    private accessToken: string,
    private refreshToken: string,
    private readonly onTokenRefreshed?: (accessToken: string, refreshToken: string) => void
  ) {}

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
    return isTokenExpired(this.accessToken)
  }

  private async renewToken(): Promise<TokenResponse> {
    const request: RefreshTokenRequest = {
      refreshToken: this.refreshToken
    }

    const tokenResponse = await axios.post<TokenResponse>(`${this.endpoint}/auth/refresh`, request)

    return tokenResponse.data
  }
}
