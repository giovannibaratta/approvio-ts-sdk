import * as TE from "fp-ts/TaskEither"
import {
  AgentGet200Response,
  AgentRegistrationRequest,
  AgentRegistrationResponse,
  ListUsers200Response,
  UserCreate,
  User,
  RoleAssignmentRequest,
  RoleRemovalRequest,
  WorkflowTemplateCreate,
  WorkflowTemplate,
  ListWorkflowTemplates200Response,
  WorkflowTemplateUpdate,
  WorkflowTemplateDeprecate,
  GroupCreate,
  Group,
  ListGroups200Response,
  ListGroupEntities200Response,
  AddGroupEntitiesRequest,
  RemoveGroupEntitiesRequest,
  SpaceCreate,
  Space,
  ListSpaces200Response,
  OrganizationAdminCreate,
  ListOrganizationAdminsForOrg200Response,
  OrganizationAdminRemove
} from "@approvio/api"

import {BaseApprovioClient, ApprovioError} from "./base.client"
import {CliUserAuthenticator} from "../auth/user.authenticator"
import {ApprovioServerConfig} from "../interfaces"
import {pipe} from "fp-ts/function"
import {WebAuthenticator} from "src/auth/web.authenticator"

/**
 * Client for Approvio API (Human/User).
 */
export class ApprovioUserClient extends BaseApprovioClient {
  constructor(
    config: ApprovioServerConfig,
    readonly authenticator: CliUserAuthenticator | WebAuthenticator
  ) {
    super(config, authenticator)
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

  /**
   * Assign roles to an agent.
   */
  assignAgentRoles(agentId: string, data: RoleAssignmentRequest): TE.TaskEither<ApprovioError, void> {
    return this.put<void>(`/agents/${agentId}/roles`, data)
  }

  /**
   * Remove roles from an agent.
   */
  removeAgentRoles(agentId: string, data: RoleRemovalRequest): TE.TaskEither<ApprovioError, void> {
    return this.delete<void>(`/agents/${agentId}/roles`, data)
  }

  /**
   * Creates a new user.
   */
  createUser(data: UserCreate): TE.TaskEither<ApprovioError, string> {
    return pipe(
      this.postWithLocation<void>("/users", data),
      TE.map(({location}) => location),
      TE.chain(location => {
        const id = location.split("/").pop()
        if (!id) return TE.left(new Error("Invalid location"))
        return TE.right(id)
      })
    )
  }

  /**
   * Get user details.
   */
  getUser(userId: string): TE.TaskEither<ApprovioError, User> {
    return this.get<User>(`/users/${userId}`)
  }

  /**
   * Assign roles to a user.
   */
  assignUserRoles(userId: string, data: RoleAssignmentRequest): TE.TaskEither<ApprovioError, void> {
    return this.put<void>(`/users/${userId}/roles`, data)
  }

  /**
   * Remove roles from a user.
   */
  removeUserRoles(userId: string, data: RoleRemovalRequest): TE.TaskEither<ApprovioError, void> {
    return this.delete<void>(`/users/${userId}/roles`, data)
  }

  /**
   * Create a new workflow template.
   */
  createWorkflowTemplate(data: WorkflowTemplateCreate): TE.TaskEither<ApprovioError, WorkflowTemplate> {
    return this.post<WorkflowTemplate>("/workflow-templates", data)
  }

  /**
   * List workflow templates.
   */
  listWorkflowTemplates(params?: {
    page?: number
    limit?: number
  }): TE.TaskEither<ApprovioError, ListWorkflowTemplates200Response> {
    return this.get<ListWorkflowTemplates200Response>("/workflow-templates", params)
  }

  /**
   * Get workflow template details.
   */
  getWorkflowTemplate(templateIdentifier: string): TE.TaskEither<ApprovioError, WorkflowTemplate> {
    return this.get<WorkflowTemplate>(`/workflow-templates/${templateIdentifier}`)
  }

  /**
   * Update a workflow template.
   */
  updateWorkflowTemplate(
    templateIdentifier: string,
    data: WorkflowTemplateUpdate
  ): TE.TaskEither<ApprovioError, WorkflowTemplate> {
    return this.put<WorkflowTemplate>(`/workflow-templates/${templateIdentifier}`, data)
  }

  /**
   * Deprecate a workflow template.
   */
  deprecateWorkflowTemplate(
    templateName: string,
    data?: WorkflowTemplateDeprecate
  ): TE.TaskEither<ApprovioError, WorkflowTemplate> {
    return this.post<WorkflowTemplate>(`/workflow-templates/${templateName}/deprecate`, data)
  }

  /**
   * Create a new group.
   */
  createGroup(data: GroupCreate): TE.TaskEither<ApprovioError, string> {
    return pipe(
      this.postWithLocation<void>("/groups", data),
      TE.map(({location}) => location),
      TE.chain(location => {
        const id = location.split("/").pop()
        if (!id) return TE.left(new Error("Invalid location"))
        return TE.right(id)
      })
    )
  }

  /**
   * List groups.
   */
  listGroups(params?: {page?: number; limit?: number}): TE.TaskEither<ApprovioError, ListGroups200Response> {
    return this.get<ListGroups200Response>("/groups", params)
  }

  /**
   * Get group details.
   */
  getGroup(groupIdentifier: string): TE.TaskEither<ApprovioError, Group> {
    return this.get<Group>(`/groups/${groupIdentifier}`)
  }

  /**
   * List entities in a group.
   */
  listGroupEntities(
    groupId: string,
    params?: {
      page?: number
      limit?: number
    }
  ): TE.TaskEither<ApprovioError, ListGroupEntities200Response> {
    return this.get<ListGroupEntities200Response>(`/groups/${groupId}/entities`, params)
  }

  /**
   * Add entities to a group.
   */
  addGroupEntities(groupId: string, data: AddGroupEntitiesRequest): TE.TaskEither<ApprovioError, Group> {
    return this.post<Group>(`/groups/${groupId}/entities`, data)
  }

  /**
   * Remove entities from a group.
   */
  removeGroupEntities(groupId: string, data: RemoveGroupEntitiesRequest): TE.TaskEither<ApprovioError, Group> {
    return this.delete<Group>(`/groups/${groupId}/entities`, data)
  }

  /**
   * Create a new space.
   */
  createSpace(data: SpaceCreate): TE.TaskEither<ApprovioError, void> {
    return this.post<void>("/spaces", data)
  }

  /**
   * List spaces.
   */
  listSpaces(params?: {page?: number; limit?: number}): TE.TaskEither<ApprovioError, ListSpaces200Response> {
    return this.get<ListSpaces200Response>("/spaces", params)
  }

  /**
   * Get space details.
   */
  getSpace(spaceId: string): TE.TaskEither<ApprovioError, Space> {
    return this.get<Space>(`/spaces/${spaceId}`)
  }

  /**
   * Delete a space.
   */
  deleteSpace(spaceId: string): TE.TaskEither<ApprovioError, void> {
    return this.delete<void>(`/spaces/${spaceId}`)
  }

  /**
   * Add an organization admin.
   */
  addOrganizationAdminToOrg(
    organizationName: string,
    data: OrganizationAdminCreate
  ): TE.TaskEither<ApprovioError, void> {
    return this.post<void>(`/organization/${organizationName}/admins`, data)
  }

  /**
   * List organization admins.
   */
  listOrganizationAdminsForOrg(
    organizationName: string,
    params?: {
      page?: number
      limit?: number
    }
  ): TE.TaskEither<ApprovioError, ListOrganizationAdminsForOrg200Response> {
    return this.get<ListOrganizationAdminsForOrg200Response>(`/organization/${organizationName}/admins`, params)
  }

  /**
   * Remove an organization admin.
   */
  removeOrganizationAdminFromOrg(
    organizationName: string,
    data: OrganizationAdminRemove
  ): TE.TaskEither<ApprovioError, void> {
    return this.delete<void>(`/organization/${organizationName}/admins`, data)
  }

  getAgent(agentId: string): TE.TaskEither<ApprovioError, AgentGet200Response> {
    return this.get<AgentGet200Response>(`/agents/${agentId}`)
  }
}
