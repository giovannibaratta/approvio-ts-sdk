import * as jose from "jose"
import axios from "axios"
import {randomUUID} from "crypto"
import {RefreshTokenRequest, AgentTokenResponse} from "@approvio/api"
import {Authenticator} from "../config"
import {isTokenExpired} from "./utils"

/**
 * Authenticator for Approvio Agents.
 * handles the challenge-response flow manually.
 */
export class AgentAuthenticator implements Authenticator {
  constructor(
    private readonly endpoint: string,
    private readonly privateKeyPem: string,
    private readonly publicKeyPem: string,
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

  private async renewToken(): Promise<AgentTokenResponse> {
    if (!this.refreshToken) throw new Error("No refresh token")

    const request: RefreshTokenRequest = {
      refreshToken: this.refreshToken
    }

    const dpop = await this.createDpopToken()

    const tokenResponse = await axios.post<AgentTokenResponse>(`${this.endpoint}/auth/agents/refresh`, request, {
      headers: {
        DPoP: dpop
      }
    })

    return tokenResponse.data
  }

  private isTokenExpired(): boolean {
    if (!this.accessToken) return true
    return isTokenExpired(this.accessToken)
  }

  private async createDpopToken(): Promise<string> {
    const privateKey = await jose.importPKCS8(this.privateKeyPem, "RS256")
    const publicKey = await jose.importSPKI(this.publicKeyPem, "RS256")
    const jwk = await jose.exportJWK(publicKey)

    const payload = {
      jti: randomUUID(),
      htm: "POST",
      htu: `${this.endpoint}/auth/agents/refresh`
    }

    return new jose.SignJWT(payload)
      .setProtectedHeader({
        alg: "RS256",
        typ: "dpop+jwt",
        jwk
      })
      .setIssuedAt()
      .sign(privateKey)
  }
}
