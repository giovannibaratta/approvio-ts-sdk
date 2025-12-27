import * as TE from "fp-ts/TaskEither"
import {Workflow, WorkflowVoteRequest, CanVoteResponse} from "@approvio/api"
import {BaseApprovioClient, ApprovioError} from "./base.client"

/**
 * Client for Approvio API (Agent).
 * only exposes APIs available to agents.
 */
export class ApprovioAgentClient extends BaseApprovioClient {
  /**
   * Gets workflow details.
   */
  getWorkflow(workflowId: string, params?: {include?: string[]}): TE.TaskEither<ApprovioError, Workflow> {
    return this.get<Workflow>(`/workflows/${workflowId}`, params as Record<string, unknown>)
  }

  /**
   * Votes on a workflow.
   */
  vote(workflowId: string, data: WorkflowVoteRequest): TE.TaskEither<ApprovioError, void> {
    return this.post(`/workflows/${workflowId}/vote`, data)
  }

  /**
   * Checks if the agent can vote on a workflow.
   */
  canVote(workflowId: string): TE.TaskEither<ApprovioError, CanVoteResponse> {
    return this.get<CanVoteResponse>(`/workflows/${workflowId}/canVote`)
  }
}
