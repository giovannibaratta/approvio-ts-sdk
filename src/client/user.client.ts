import * as TE from "fp-ts/TaskEither"
import {AgentRegistrationRequest, AgentRegistrationResponse, ListUsers200Response} from "@approvio/api"
import {BaseApprovioClient, ApprovioError} from "./base.client"
import {UserAuthenticator} from "../auth/user.authenticator"
import {ApprovioServerConfig, Authenticator} from "../interfaces"

/**
 * Client for Approvio API (Human/User).
 */
export class ApprovioUserClient extends BaseApprovioClient {
  constructor(
    config: ApprovioServerConfig,
    private readonly authenticator: UserAuthenticator
  ) {
    super(config)
  }

  getAuthenticator(): Authenticator {
    return this.authenticator
  }

  /**
   * Lists users.
   */
  listUsers(params?: {
    search?: string
    page?: number
    limit?: number
  }): TE.TaskEither<ApprovioError, ListUsers200Response> {
    return this.get<ListUsers200Response>("/users", params as Record<string, unknown>)
  }

  registerAgent(data: AgentRegistrationRequest): TE.TaskEither<ApprovioError, AgentRegistrationResponse> {
    return this.post<AgentRegistrationResponse>("/agents/register", data)
  }
}
