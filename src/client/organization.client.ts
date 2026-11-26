import * as TE from "fp-ts/TaskEither"
import {
  CanVoteResponse,
  GetEntityInfo200Response,
  GetWorkflowParams,
  GetWorkflowVotes200Response,
  ListRoleTemplates200Response,
  ListWorkflowVotesParams,
  ListWorkflows200Response,
  ListWorkflowsParams,
  Workflow,
  WorkflowCreate,
  WorkflowVoteRequest,
  AgentChallengeRequest,
  AgentChallengeResponse,
  AgentTokenRequest,
  AgentTokenResponse,
  PrivilegedTokenExchangeRequest,
  PrivilegedTokenResponse
} from "@approvio/api"
import {Authenticator, ApprovioServerConfig} from "../interfaces"
import {ApprovioError, BaseApprovioClient} from "./base.client"

/**
 * A tenant handle whose organization cannot change after construction.
 *
 * Create another handle to use another organization. This prevents a browser
 * context switch or a caller mistake from retargeting an in-flight client.
 */
export abstract class OrganizationClient extends BaseApprovioClient {
  constructor(
    config: ApprovioServerConfig,
    authenticator: Authenticator,
    readonly organizationId: string
  ) {
    super(config, authenticator)
  }

  protected organizationPath(path: string): string {
    return `/o/${encodeURIComponent(this.organizationId)}${path}`
  }

  getWorkflow(workflowId: string, params?: GetWorkflowParams): TE.TaskEither<ApprovioError, Workflow> {
    return this.get<Workflow, GetWorkflowParams>(
      this.organizationPath(`/workflows/${encodeURIComponent(workflowId)}`),
      params
    )
  }

  listWorkflows(params?: ListWorkflowsParams): TE.TaskEither<ApprovioError, ListWorkflows200Response> {
    return this.get<ListWorkflows200Response, ListWorkflowsParams>(this.organizationPath("/workflows"), params)
  }

  createWorkflow(data: WorkflowCreate): TE.TaskEither<ApprovioError, void> {
    return this.post<void>(this.organizationPath("/workflows"), data)
  }

  voteOnWorkflow(workflowId: string, data: WorkflowVoteRequest): TE.TaskEither<ApprovioError, void> {
    return this.post<void>(this.organizationPath(`/workflows/${encodeURIComponent(workflowId)}/vote`), data)
  }

  canVoteOnWorkflow(workflowId: string): TE.TaskEither<ApprovioError, CanVoteResponse> {
    return this.get<CanVoteResponse>(this.organizationPath(`/workflows/${encodeURIComponent(workflowId)}/canVote`))
  }

  listRoleTemplates(): TE.TaskEither<ApprovioError, ListRoleTemplates200Response> {
    return this.get<ListRoleTemplates200Response>(this.organizationPath("/roles"))
  }

  getEntityInfo(): TE.TaskEither<ApprovioError, GetEntityInfo200Response> {
    return this.get<GetEntityInfo200Response>(this.organizationPath("/auth/info"))
  }

  listVotes(
    workflowId: string,
    params?: ListWorkflowVotesParams
  ): TE.TaskEither<ApprovioError, GetWorkflowVotes200Response> {
    return this.get<GetWorkflowVotes200Response, ListWorkflowVotesParams>(
      this.organizationPath(`/workflows/${encodeURIComponent(workflowId)}/votes`),
      params
    )
  }

  generateAgentChallenge(data: AgentChallengeRequest): TE.TaskEither<ApprovioError, AgentChallengeResponse> {
    return this.post<AgentChallengeResponse>(this.organizationPath("/auth/agents/challenge"), data)
  }

  exchangeAgentToken(data: AgentTokenRequest): TE.TaskEither<ApprovioError, AgentTokenResponse> {
    return this.post<AgentTokenResponse>(this.organizationPath("/auth/agents/token"), data)
  }

  initiateWebPrivilegeToken(): TE.TaskEither<ApprovioError, {authorizationUrl: string}> {
    return this.post<{authorizationUrl: string}>(this.organizationPath("/auth/web/initiatePrivilegedTokenExchange"))
  }

  exchangeWebPrivilegeToken(data: PrivilegedTokenExchangeRequest): TE.TaskEither<ApprovioError, void> {
    return this.post<void>(this.organizationPath("/auth/web/exchangePrivilegedToken"), data)
  }

  exchangeCliPrivilegeToken(
    data: PrivilegedTokenExchangeRequest
  ): TE.TaskEither<ApprovioError, PrivilegedTokenResponse> {
    return this.post<PrivilegedTokenResponse>(this.organizationPath("/auth/cli/exchangePrivilegedToken"), data)
  }
}
