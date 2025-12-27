import * as TE from "fp-ts/TaskEither"
import {
  Workflow,
  WorkflowCreate,
  WorkflowVoteRequest,
  ListWorkflows200Response,
  ListUsers200Response,
  User,
  UserCreate,
  RoleAssignmentRequest,
  Group,
  GroupCreate,
  ListGroups200Response,
  AddGroupEntitiesRequest,
  Space,
  SpaceCreate,
  ListSpaces200Response,
  WorkflowTemplate,
  WorkflowTemplateCreate,
  ListWorkflowTemplates200Response,
  OrganizationAdminCreate
} from "@approvio/api"
import {BaseApprovioClient, ApprovioError} from "./base.client"

/**
 * Client for Approvio API (Human/User).
 */
export class ApprovioClient extends BaseApprovioClient {
  /**
   * Lists workflows.
   */
  listWorkflows(params?: {
    page?: number
    limit?: number
    include?: string[]
  }): TE.TaskEither<ApprovioError, ListWorkflows200Response> {
    return this.get<ListWorkflows200Response>("/workflows", params as Record<string, unknown>)
  }

  /**
   * Creates a new workflow.
   */
  createWorkflow(data: WorkflowCreate): TE.TaskEither<ApprovioError, void> {
    return this.post("/workflows", data)
  }

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
   * Lists users.
   */
  listUsers(params?: {
    search?: string
    page?: number
    limit?: number
  }): TE.TaskEither<ApprovioError, ListUsers200Response> {
    return this.get<ListUsers200Response>("/users", params as Record<string, unknown>)
  }

  /**
   * Creates a new user.
   */
  createUser(data: UserCreate): TE.TaskEither<ApprovioError, void> {
    return this.post("/users", data)
  }

  /**
   * Gets user details.
   */
  getUser(userId: string): TE.TaskEither<ApprovioError, User> {
    return this.get<User>(`/users/${userId}`)
  }

  /**
   * Assigns roles to a user.
   */
  assignUserRoles(userId: string, data: RoleAssignmentRequest): TE.TaskEither<ApprovioError, void> {
    return this.put(`/users/${userId}/roles`, data)
  }

  /**
   * Lists groups.
   */
  listGroups(params?: {page?: number; limit?: number}): TE.TaskEither<ApprovioError, ListGroups200Response> {
    return this.get<ListGroups200Response>("/groups", params as Record<string, unknown>)
  }

  /**
   * Creates a new group.
   */
  createGroup(data: GroupCreate): TE.TaskEither<ApprovioError, void> {
    return this.post("/groups", data)
  }

  /**
   * Gets group details.
   */
  getGroup(groupIdentifier: string): TE.TaskEither<ApprovioError, Group> {
    return this.get<Group>(`/groups/${groupIdentifier}`)
  }

  /**
   * Adds entities to a group.
   */
  addGroupEntities(groupId: string, data: AddGroupEntitiesRequest): TE.TaskEither<ApprovioError, void> {
    return this.post(`/groups/${groupId}/entities`, data)
  }

  /**
   * Lists spaces.
   */
  listSpaces(params?: {page?: number; limit?: number}): TE.TaskEither<ApprovioError, ListSpaces200Response> {
    return this.get<ListSpaces200Response>("/spaces", params as Record<string, unknown>)
  }

  /**
   * Creates a new space.
   */
  createSpace(data: SpaceCreate): TE.TaskEither<ApprovioError, void> {
    return this.post("/spaces", data)
  }

  /**
   * Gets space details.
   */
  getSpace(spaceId: string): TE.TaskEither<ApprovioError, Space> {
    return this.get<Space>(`/spaces/${spaceId}`)
  }

  /**
   * Deletes a space.
   */
  deleteSpace(spaceId: string): TE.TaskEither<ApprovioError, void> {
    return this.delete(`/spaces/${spaceId}`)
  }

  /**
   * Lists workflow templates.
   */
  listWorkflowTemplates(params?: {
    page?: number
    limit?: number
  }): TE.TaskEither<ApprovioError, ListWorkflowTemplates200Response> {
    return this.get<ListWorkflowTemplates200Response>("/workflow-templates", params as Record<string, unknown>)
  }

  /**
   * Creates a new workflow template.
   */
  createWorkflowTemplate(data: WorkflowTemplateCreate): TE.TaskEither<ApprovioError, WorkflowTemplate> {
    return this.post<WorkflowTemplate>("/workflow-templates", data)
  }

  /**
   * Gets workflow template details.
   */
  getWorkflowTemplate(templateId: string): TE.TaskEither<ApprovioError, WorkflowTemplate> {
    return this.get<WorkflowTemplate>(`/workflow-templates/${templateId}`)
  }

  /**
   * Adds an organization administrator.
   */
  addOrganizationAdmin(orgName: string, data: OrganizationAdminCreate): TE.TaskEither<ApprovioError, void> {
    return this.post(`/organization/${orgName}/admins`, data)
  }
}
