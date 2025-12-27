import axios from "axios"
import * as jose from "jose"
import {privateDecrypt, constants} from "crypto"
import {
  TokenRequest,
  TokenResponse,
  APIError,
  AgentChallengeRequest,
  AgentChallengeResponse,
  AgentTokenResponse
} from "@approvio/api"
import * as TE from "fp-ts/lib/TaskEither.js"
import {ApprovioError} from "../client/base.client.js"

/**
 * Helper for Approvio OAuth/OIDC authentication.
 */
export class AuthHelper {
  constructor(private readonly endpoint: string) {}

  /**
   * returns the login URL to initiate the OIDC flow.
   */
  getLoginUrl(): string {
    return `${this.endpoint}/auth/login`
  }

  /**
   * exchanges the authorization code and state for a JWT token.
   */
  exchangeToken(code: string, state: string): TE.TaskEither<ApprovioError, TokenResponse> {
    const request: TokenRequest = {
      code,
      state
    }

    return TE.tryCatch(
      async () => {
        const response = await axios.post<TokenResponse>(`${this.endpoint}/auth/token`, request)
        return response.data
      },
      error => this.handleError(error)
    )
  }

  /**
   * Performs the agent challenge-response authentication flow.
   */
  authenticateAgent(agentName: string, privateKeyPem: string): TE.TaskEither<ApprovioError, TokenResponse> {
    return TE.tryCatch(
      async () => {
        // 1. Get challenge
        const challengeRequest: AgentChallengeRequest = {
          agentName
        }

        const challengeResponse = await axios.post<AgentChallengeResponse>(
          `${this.endpoint}/auth/agents/challenge`,
          challengeRequest
        )

        const encryptedChallenge = challengeResponse.data.challenge

        // 2. Decrypt challenge
        const buffer = Buffer.from(encryptedChallenge, "base64")
        const decrypted = privateDecrypt(
          {
            key: privateKeyPem,
            padding: constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256"
          },
          buffer
        )
        const {nonce} = JSON.parse(decrypted.toString("utf8"))

        // 3. Create JWT assertion
        const privateKey = await jose.importPKCS8(privateKeyPem, "RS256")
        const jwt = await new jose.SignJWT({})
          .setProtectedHeader({alg: "RS256"})
          .setIssuedAt()
          .setIssuer(agentName)
          .setSubject(agentName)
          .setAudience("Approvio")
          .setExpirationTime("2m")
          .setJti(nonce)
          .sign(privateKey)

        // 4. Exchange for token
        const tokenResponse = await axios.post<AgentTokenResponse>(`${this.endpoint}/auth/agents/token`, {
          client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          client_assertion: jwt
        })

        return tokenResponse.data
      },
      error => this.handleError(error)
    )
  }

  protected handleError(error: unknown): ApprovioError {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const data = error.response?.data
      if (
        status &&
        data &&
        typeof data === "object" &&
        "message" in data &&
        "code" in data &&
        typeof data.message === "string" &&
        typeof data.code === "string"
      ) {
        return {
          ...(data as APIError),
          status
        }
      }
    }

    if (error instanceof Error) return error

    return new Error(String(error))
  }
}
