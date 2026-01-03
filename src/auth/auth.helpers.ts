import axios from "axios"
import {TokenRequest, TokenResponse} from "@approvio/api"
import * as TE from "fp-ts/TaskEither"
import {ApprovioError} from "../client/base.client"
import {isApprovioError} from "../client/utils"

/**
 * Helper class for managing Approvio authentication flows.
 * Provides methods for both user-based OIDC login and agent-based challenge-response authentication.
 */
export class AuthHelper {
  constructor(private readonly endpoint: string) {}

  /**
   * Generates the login URL to initiate the OIDC authentication flow for users.
   */
  getUserLoginUrl(): string {
    return `${this.endpoint}/auth/login`
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
        const response = await axios.post<TokenResponse>(`${this.endpoint}/auth/token`, request)
        return response.data
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
