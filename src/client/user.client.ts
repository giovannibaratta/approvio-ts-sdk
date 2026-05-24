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
  OrganizationAdminRemove,
  ListWorkflowTemplatesParams,
  ListGroupsParams,
  ListUsersParams,
  ListSpacesParams,
  GetEntityInfoUserResponse,
  ListAuditLogs200Response,
  ListAuditLogsParams,
  ListMyAuditLogsParams
} from "@approvio/api"

import {BaseApprovioClient, ApprovioError} from "./base.client"
import {CliUserAuthenticator} from "../auth/user.authenticator"
import {ApprovioServerConfig} from "../interfaces"
import {pipe} from "fp-ts/function"
import {WebAuthenticator} from "src/auth/web.authenticator"
import {UnexpectedEntityTypeError} from "./errors"

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

  listUsers(params?: ListUsersParams): TE.TaskEither<ApprovioError, ListUsers200Response> {
    return this.get<ListUsers200Response, ListUsersParams>("/users", params)
  }

  registerAgent(data: AgentRegistrationRequest): TE.TaskEither<ApprovioError, AgentRegistrationResponse> {
    return this.post<AgentRegistrationResponse>("/agents/register", data)
  }

  assignAgentRoles(agentId: string, data: RoleAssignmentRequest): TE.TaskEither<ApprovioError, void> {
    return this.put<void>(`/agents/${agentId}/roles`, data)
  }

  removeAgentRoles(agentId: string, data: RoleRemovalRequest): TE.TaskEither<ApprovioError, void> {
    return this.delete<void>(`/agents/${agentId}/roles`, data)
  }

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

  getUser(userId: string): TE.TaskEither<ApprovioError, User> {
    return this.get<User>(`/users/${userId}`)
  }

  assignUserRoles(userId: string, data: RoleAssignmentRequest): TE.TaskEither<ApprovioError, void> {
    return this.put<void>(`/users/${userId}/roles`, data)
  }

  removeUserRoles(userId: string, data: RoleRemovalRequest): TE.TaskEither<ApprovioError, void> {
    return this.delete<void>(`/users/${userId}/roles`, data)
  }

  createWorkflowTemplate(data: WorkflowTemplateCreate): TE.TaskEither<ApprovioError, WorkflowTemplate> {
    return this.post<WorkflowTemplate>("/workflow-templates", data)
  }

  listWorkflowTemplates(
    request?: ListWorkflowTemplatesParams
  ): TE.TaskEither<ApprovioError, ListWorkflowTemplates200Response> {
    return this.get<ListWorkflowTemplates200Response, ListWorkflowTemplatesParams>("/workflow-templates", request)
  }

  getWorkflowTemplate(templateIdentifier: string): TE.TaskEither<ApprovioError, WorkflowTemplate> {
    return this.get<WorkflowTemplate>(`/workflow-templates/${templateIdentifier}`)
  }

  updateWorkflowTemplate(
    templateIdentifier: string,
    data: WorkflowTemplateUpdate
  ): TE.TaskEither<ApprovioError, WorkflowTemplate> {
    return this.put<WorkflowTemplate>(`/workflow-templates/${templateIdentifier}`, data)
  }

  deprecateWorkflowTemplate(
    templateName: string,
    data?: WorkflowTemplateDeprecate
  ): TE.TaskEither<ApprovioError, WorkflowTemplate> {
    return this.post<WorkflowTemplate>(`/workflow-templates/${templateName}/deprecate`, data)
  }

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

  listGroups(params?: ListGroupsParams): TE.TaskEither<ApprovioError, ListGroups200Response> {
    return this.get<ListGroups200Response, ListGroupsParams>("/groups", params)
  }

  getGroup(groupIdentifier: string): TE.TaskEither<ApprovioError, Group> {
    return this.get<Group>(`/groups/${groupIdentifier}`)
  }

  listGroupEntities(
    groupId: string,
    params?: {
      page?: number
      limit?: number
    }
  ): TE.TaskEither<ApprovioError, ListGroupEntities200Response> {
    return this.get<ListGroupEntities200Response>(`/groups/${groupId}/entities`, params)
  }

  addGroupEntities(groupId: string, data: AddGroupEntitiesRequest): TE.TaskEither<ApprovioError, Group> {
    return this.post<Group>(`/groups/${groupId}/entities`, data)
  }

  removeGroupEntities(groupId: string, data: RemoveGroupEntitiesRequest): TE.TaskEither<ApprovioError, Group> {
    return this.delete<Group>(`/groups/${groupId}/entities`, data)
  }

  createSpace(data: SpaceCreate): TE.TaskEither<ApprovioError, void> {
    return this.post<void>("/spaces", data)
  }

  listSpaces(params?: ListSpacesParams): TE.TaskEither<ApprovioError, ListSpaces200Response> {
    return this.get<ListSpaces200Response, ListSpacesParams>("/spaces", params)
  }

  getSpace(spaceId: string): TE.TaskEither<ApprovioError, Space> {
    return this.get<Space>(`/spaces/${spaceId}`)
  }

  deleteSpace(spaceId: string): TE.TaskEither<ApprovioError, void> {
    return this.delete<void>(`/spaces/${spaceId}`)
  }

  addOrganizationAdminToOrg(
    organizationName: string,
    data: OrganizationAdminCreate
  ): TE.TaskEither<ApprovioError, void> {
    return this.post<void>(`/organization/${organizationName}/admins`, data)
  }

  listOrganizationAdminsForOrg(
    organizationName: string,
    params?: {
      page?: number
      limit?: number
    }
  ): TE.TaskEither<ApprovioError, ListOrganizationAdminsForOrg200Response> {
    return this.get<ListOrganizationAdminsForOrg200Response>(`/organization/${organizationName}/admins`, params)
  }

  removeOrganizationAdminFromOrg(
    organizationName: string,
    data: OrganizationAdminRemove
  ): TE.TaskEither<ApprovioError, void> {
    return this.delete<void>(`/organization/${organizationName}/admins`, data)
  }

  getAgent(agentId: string): TE.TaskEither<ApprovioError, AgentGet200Response> {
    return this.get<AgentGet200Response>(`/agents/${agentId}`)
  }

  override getEntityInfo(): TE.TaskEither<ApprovioError, GetEntityInfoUserResponse> {
    return pipe(
      super.getEntityInfo(),
      TE.chain(info => {
        if (info.entityType === "user") return TE.right(info)
        return TE.left(new UnexpectedEntityTypeError("user", info.entityType))
      })
    )
  }

  listAuditLogs(params?: ListAuditLogsParams): TE.TaskEither<ApprovioError, ListAuditLogs200Response> {
    return this.get<ListAuditLogs200Response, ListAuditLogsParams>("/audit-logs", params)
  }

  listMyAuditLogs(params?: ListMyAuditLogsParams): TE.TaskEither<ApprovioError, ListAuditLogs200Response> {
    return this.get<ListAuditLogs200Response, ListMyAuditLogsParams>("/audit-logs/me", params)
  }

  logout(): TE.TaskEither<ApprovioError, void> {
    return this.post<void>("/auth/web/logout")
  }
}
