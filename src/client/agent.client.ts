import {BaseApprovioClient} from "./base.client"
import {AgentAuthenticator} from "../auth/agent.authenticator"
import {ApprovioServerConfig, Authenticator} from "../interfaces"

/**
 * Client for Approvio API (Agent).
 */
export class ApprovioAgentClient extends BaseApprovioClient {
  constructor(
    config: ApprovioServerConfig,
    private readonly authenticator: AgentAuthenticator
  ) {
    super(config)
  }

  getAuthenticator(): Authenticator {
    return this.authenticator
  }
}
