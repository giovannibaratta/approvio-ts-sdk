import {BaseApprovioClient, ApprovioError} from "./base.client"
import {AgentAuthenticator} from "../auth/agent.authenticator"
import {ApprovioServerConfig, Authenticator} from "../interfaces"
import {GetEntityInfoAgentResponse} from "@approvio/api"
import * as TE from "fp-ts/TaskEither"
import {pipe} from "fp-ts/function"
import {UnexpectedEntityTypeError} from "./errors"

/**
 * Client for Approvio API (Agent).
 */
export class ApprovioAgentClient extends BaseApprovioClient {
  constructor(
    config: ApprovioServerConfig,
    readonly authenticator: AgentAuthenticator
  ) {
    super(config, authenticator)
  }

  getAuthenticator(): Authenticator {
    return this.authenticator
  }

  override getEntityInfo(): TE.TaskEither<ApprovioError, GetEntityInfoAgentResponse> {
    return pipe(
      super.getEntityInfo(),
      TE.chain(info => {
        if (info.entityType === "agent") return TE.right(info)
        return TE.left(new UnexpectedEntityTypeError("agent", info.entityType))
      })
    )
  }
}
