import {AgentTokenResponse, RefreshTokenRequest} from "@approvio/api"
import {TokenBaseAuthenticator} from "../interfaces"
import {isJwtTokenExpired} from "./utils"
import axios, {AxiosInstance, InternalAxiosRequestConfig} from "axios"
import {removeTrailingSlash, validateURL} from "../client/utils"
import * as jose from "jose"

/**
 * Authenticator for Approvio Agents.
 * Handles automatic token renewal using a refresh token and DPoP proof when the access token expires.
 */
export class AgentAuthenticator implements TokenBaseAuthenticator {
  private readonly endpoint: string

  constructor(
    endpoint: string,
    private readonly privateKey: string,
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
    if (isJwtTokenExpired(this.accessToken)) {
      const {accessToken, refreshToken} = await this.renewToken()
      this.accessToken = accessToken
      this.refreshToken = refreshToken
      this.onTokenRefreshed?.(this.accessToken, this.refreshToken)
    }

    return this.accessToken
  }

  private async renewToken(): Promise<AgentTokenResponse> {
    const request: RefreshTokenRequest = {
      refreshToken: this.refreshToken
    }

    const dpopProof = await this.generateDpopProof("POST", `${this.endpoint}/auth/agents/refresh`)

    const tokenResponse = await axios.post<AgentTokenResponse>(`${this.endpoint}/auth/agents/refresh`, request, {
      headers: {
        DPoP: dpopProof
      }
    })

    return tokenResponse.data
  }

  private async generateDpopProof(method: string, url: string): Promise<string> {
    const privateKey = await jose.importPKCS8(this.privateKey, "RS256")

    return await new jose.SignJWT({
      htu: url,
      htm: method,
      jti: crypto.randomUUID()
    })
      .setProtectedHeader({
        alg: "RS256",
        typ: "dpop+jwt"
      })
      .setIssuedAt()
      .setJti(crypto.randomUUID())
      .sign(privateKey)
  }
}
