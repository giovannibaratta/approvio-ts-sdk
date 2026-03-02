import axios from "axios"
import {
  AgentChallengeRequest,
  AgentTokenRequest,
  AgentChallengeResponse,
  AgentTokenResponse,
  TokenRequest,
  TokenResponse
} from "@approvio/api"
import * as jose from "jose"
import * as crypto from "node:crypto"
import * as TE from "fp-ts/TaskEither"
import {ApprovioError} from "../client/base.client"
import {isApprovioError, removeTrailingSlash, validateURL} from "../client/utils"

/**
 * Helper class for managing Approvio authentication flows.
 * Provides methods for both user-based OIDC login and agent-based challenge-response authentication.
 */
export class AuthHelper {
  private readonly endpoint: string

  constructor(endpoint: string) {
    validateURL(endpoint)
    this.endpoint = removeTrailingSlash(endpoint)
  }

  /**
   * Generates the login URL to initiate the OIDC authentication flow for users.
   */
  getUserLoginUrl(): string {
    return `${this.endpoint}/auth/web/login`
  }

  /**
   * Initiates the CLI login flow using a local loopback redirect URI.
   * Prompts the backend to return an authorization URL for the IDP.
   */
  initiateCliLogin(redirectUri: string): TE.TaskEither<ApprovioError, string> {
    return TE.tryCatch(
      async () => {
        const response = await axios.post<{authorizationUrl: string}>(`${this.endpoint}/auth/cli/initiate`, {
          redirectUri
        })
        return response.data.authorizationUrl
      },
      error => this.handleError(error)
    )
  }

  /**
   * Exchanges an authorization code and state for a set of JWT tokens (access and refresh).
   * This is typically the final step of the OIDC login flow.
   */
  exchangeTokenForUser(code: string, state: string): TE.TaskEither<ApprovioError, TokenResponse> {
    const request: TokenRequest = {
      code,
      state
    }

    return TE.tryCatch(
      async () => {
        const response = await axios.post<TokenResponse>(`${this.endpoint}/auth/cli/token`, request)
        return response.data
      },
      error => this.handleError(error)
    )
  }

  /**
   * Authenticates an agent using the challenge-response flow.
   * 1. Request a challenge from the server.
   * 2. Decrypt the challenge using the agent's private key.
   * 3. specific claims and sign a JWT assertion.
   * 4. Exchange the assertion for an access token.
   */
  authenticateAgent(agentName: string, privateKeyPem: string): TE.TaskEither<ApprovioError, AgentTokenResponse> {
    return TE.tryCatch(
      async () => {
        // 1. Request Challenge
        const challengeRequest: AgentChallengeRequest = {agentName}
        const challengeResponse = await axios.post<AgentChallengeResponse>(
          `${this.endpoint}/auth/agents/challenge`,
          challengeRequest
        )
        const {challenge: b64EncodedChallenge} = challengeResponse.data

        // 2. Decrypt Challenge
        const encryptedBuffer = Buffer.from(b64EncodedChallenge, "base64")
        const decryptedBuffer = crypto.privateDecrypt(
          {
            key: privateKeyPem,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256"
          },
          encryptedBuffer
        )
        const decryptedContent = decryptedBuffer.toString("utf-8")
        const {nonce} = JSON.parse(decryptedContent)

        // 3. Create Assertion
        const privateKey = await jose.importPKCS8(privateKeyPem, "RS256")
        const assertion = await new jose.SignJWT({
          iss: agentName,
          sub: agentName,
          // TODO(long-term): The audience is hardcoded, should be configurable
          // but it also must be supported by the API
          aud: "approvio-api",
          jti: nonce
        })
          .setProtectedHeader({alg: "RS256", typ: "JWT"})
          .setIssuedAt()
          .setExpirationTime("5m")
          .sign(privateKey)

        // 4. Exchange Token
        const tokenRequest: AgentTokenRequest = {
          grantType: "urn:ietf:params:oauth:grant-type:jwt-bearer",
          clientAssertionType: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          clientAssertion: assertion
        }

        const tokenResponse = await axios.post<AgentTokenResponse>(`${this.endpoint}/auth/agents/token`, tokenRequest)
        return tokenResponse.data
      },
      error => this.handleError(error)
    )
  }

  protected handleError(error: unknown): ApprovioError {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const data = error.response?.data
      if (status && isApprovioError(data)) {
        return {
          ...data,
          status
        }
      }
    }

    if (error instanceof Error) return error

    return new Error(String(error))
  }
}
