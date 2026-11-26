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
  ListWorkflowTemplatesParams,
  ListGroupsParams,
  ListUsersParams,
  ListSpacesParams,
  GetEntityInfoUserResponse,
  ListAuditLogs200Response,
  ListAuditLogsParams,
  ListMyAuditLogsParams,
  ResourceResolveRequest,
  ResourceResolveResponse,
  OrganizationEntitlementsResponse,
  OrganizationUsageResponse,
  OrganizationSummary,
  OrganizationUpdate,
  Membership,
  MembershipList,
  MembershipRoleUpdate,
  InvitationCreate,
  InvitationCreated,
  InvitationAccept
} from "@approvio/api"

import {ApprovioError} from "./base.client"
import {OrganizationClient} from "./organization.client"
import {CliUserAuthenticator} from "../auth/user.authenticator"
import {ApprovioServerConfig} from "../interfaces"
import {pipe} from "fp-ts/function"
import {WebAuthenticator} from "../auth/web.authenticator"
import {UnexpectedEntityTypeError} from "./errors"

export interface GetOrganizationUsageParams {
  period?: string
  metric?: string
}

/**
 * Client for Approvio API (Human/User).
 */
export class ApprovioUserClient extends OrganizationClient {
  constructor(
    config: ApprovioServerConfig,
    readonly authenticator: CliUserAuthenticator | WebAuthenticator,
    organizationId: string
  ) {
    super(config, authenticator, organizationId)
  }

  listUsers(params?: ListUsersParams): TE.TaskEither<ApprovioError, ListUsers200Response> {
    return this.get<ListUsers200Response, ListUsersParams>(this.organizationPath("/users"), params)
  }

  registerAgent(data: AgentRegistrationRequest): TE.TaskEither<ApprovioError, AgentRegistrationResponse> {
    return this.post<AgentRegistrationResponse>(this.organizationPath("/agents/register"), data)
  }

  assignAgentRoles(agentId: string, data: RoleAssignmentRequest, etag: string): TE.TaskEither<ApprovioError, void> {
    return this.put<void>(this.organizationPath(`/agents/${encodeURIComponent(agentId)}/roles`), data, {
      "If-Match": etag
    })
  }

  removeAgentRoles(agentId: string, data: RoleRemovalRequest, etag: string): TE.TaskEither<ApprovioError, void> {
    return this.delete<void>(this.organizationPath(`/agents/${encodeURIComponent(agentId)}/roles`), data, {
      "If-Match": etag
    })
  }

  createUser(data: UserCreate): TE.TaskEither<ApprovioError, string> {
    return pipe(
      this.postWithLocation<void>(this.organizationPath("/users"), data),
      TE.map(({location}) => location),
      TE.chain(location => {
        const id = location.split("/").pop()
        if (!id) return TE.left(new Error("Invalid location"))
        return TE.right(id)
      })
    )
  }

  getUser(userId: string): TE.TaskEither<ApprovioError, User> {
    return this.get<User>(this.organizationPath(`/users/${encodeURIComponent(userId)}`))
  }

  assignUserRoles(userId: string, data: RoleAssignmentRequest, etag: string): TE.TaskEither<ApprovioError, void> {
    return this.put<void>(this.organizationPath(`/users/${encodeURIComponent(userId)}/roles`), data, {"If-Match": etag})
  }

  removeUserRoles(userId: string, data: RoleRemovalRequest, etag: string): TE.TaskEither<ApprovioError, void> {
    return this.delete<void>(this.organizationPath(`/users/${encodeURIComponent(userId)}/roles`), data, {
      "If-Match": etag
    })
  }

  createWorkflowTemplate(data: WorkflowTemplateCreate): TE.TaskEither<ApprovioError, WorkflowTemplate> {
    return this.post<WorkflowTemplate>(this.organizationPath("/workflow-templates"), data)
  }

  listWorkflowTemplates(
    request?: ListWorkflowTemplatesParams
  ): TE.TaskEither<ApprovioError, ListWorkflowTemplates200Response> {
    return this.get<ListWorkflowTemplates200Response, ListWorkflowTemplatesParams>(
      this.organizationPath("/workflow-templates"),
      request
    )
  }

  getWorkflowTemplate(templateIdentifier: string): TE.TaskEither<ApprovioError, WorkflowTemplate> {
    return this.get<WorkflowTemplate>(
      this.organizationPath(`/workflow-templates/${encodeURIComponent(templateIdentifier)}`)
    )
  }

  updateWorkflowTemplate(
    templateIdentifier: string,
    data: WorkflowTemplateUpdate,
    etag: string
  ): TE.TaskEither<ApprovioError, WorkflowTemplate> {
    return this.put<WorkflowTemplate>(
      this.organizationPath(`/workflow-templates/${encodeURIComponent(templateIdentifier)}`),
      data,
      {"If-Match": etag}
    )
  }

  deprecateWorkflowTemplate(
    templateName: string,
    data?: WorkflowTemplateDeprecate
  ): TE.TaskEither<ApprovioError, WorkflowTemplate> {
    return this.post<WorkflowTemplate>(
      this.organizationPath(`/workflow-templates/${encodeURIComponent(templateName)}/deprecate`),
      data
    )
  }

  createGroup(data: GroupCreate): TE.TaskEither<ApprovioError, string> {
    return pipe(
      this.postWithLocation<void>(this.organizationPath("/groups"), data),
      TE.map(({location}) => location),
      TE.chain(location => {
        const id = location.split("/").pop()
        if (!id) return TE.left(new Error("Invalid location"))
        return TE.right(id)
      })
    )
  }

  listGroups(params?: ListGroupsParams): TE.TaskEither<ApprovioError, ListGroups200Response> {
    return this.get<ListGroups200Response, ListGroupsParams>(this.organizationPath("/groups"), params)
  }

  getGroup(groupIdentifier: string): TE.TaskEither<ApprovioError, Group> {
    return this.get<Group>(this.organizationPath(`/groups/${encodeURIComponent(groupIdentifier)}`))
  }

  listGroupEntities(
    groupId: string,
    params?: {
      page?: number
      limit?: number
    }
  ): TE.TaskEither<ApprovioError, ListGroupEntities200Response> {
    return this.get<ListGroupEntities200Response>(
      this.organizationPath(`/groups/${encodeURIComponent(groupId)}/entities`),
      params
    )
  }

  addGroupEntities(groupId: string, data: AddGroupEntitiesRequest): TE.TaskEither<ApprovioError, Group> {
    return this.post<Group>(this.organizationPath(`/groups/${encodeURIComponent(groupId)}/entities`), data)
  }

  removeGroupEntities(groupId: string, data: RemoveGroupEntitiesRequest): TE.TaskEither<ApprovioError, Group> {
    return this.delete<Group>(this.organizationPath(`/groups/${encodeURIComponent(groupId)}/entities`), data)
  }

  createSpace(data: SpaceCreate): TE.TaskEither<ApprovioError, void> {
    return this.post<void>(this.organizationPath("/spaces"), data)
  }

  listSpaces(params?: ListSpacesParams): TE.TaskEither<ApprovioError, ListSpaces200Response> {
    return this.get<ListSpaces200Response, ListSpacesParams>(this.organizationPath("/spaces"), params)
  }

  getSpace(spaceId: string): TE.TaskEither<ApprovioError, Space> {
    return this.get<Space>(this.organizationPath(`/spaces/${encodeURIComponent(spaceId)}`))
  }

  deleteSpace(spaceId: string): TE.TaskEither<ApprovioError, void> {
    return this.delete<void>(this.organizationPath(`/spaces/${encodeURIComponent(spaceId)}`))
  }

  getAgent(agentId: string): TE.TaskEither<ApprovioError, AgentGet200Response> {
    return this.get<AgentGet200Response>(this.organizationPath(`/agents/${encodeURIComponent(agentId)}`))
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
    return this.get<ListAuditLogs200Response, ListAuditLogsParams>(this.organizationPath("/audit-logs"), params)
  }

  listMyAuditLogs(params?: ListMyAuditLogsParams): TE.TaskEither<ApprovioError, ListAuditLogs200Response> {
    return this.get<ListAuditLogs200Response, ListMyAuditLogsParams>(this.organizationPath("/audit-logs/me"), params)
  }

  resolveResources(params: ResourceResolveRequest): TE.TaskEither<ApprovioError, ResourceResolveResponse> {
    return this.post<ResourceResolveResponse>(this.organizationPath("/resources/resolve"), params)
  }

  getOrganizationEntitlements(): TE.TaskEither<ApprovioError, OrganizationEntitlementsResponse> {
    return this.get<OrganizationEntitlementsResponse>(this.organizationPath("/entitlements"))
  }

  getOrganizationUsage(params?: GetOrganizationUsageParams): TE.TaskEither<ApprovioError, OrganizationUsageResponse> {
    return this.get<OrganizationUsageResponse, GetOrganizationUsageParams>(this.organizationPath("/usage"), params)
  }

  getOrganization(): TE.TaskEither<ApprovioError, OrganizationSummary> {
    return this.get<OrganizationSummary>(this.organizationPath(""))
  }

  updateOrganization(data: OrganizationUpdate, etag: string): TE.TaskEither<ApprovioError, OrganizationSummary> {
    return this.patch<OrganizationSummary>(this.organizationPath(""), data, {"If-Match": etag})
  }

  deleteOrganization(etag: string): TE.TaskEither<ApprovioError, OrganizationSummary> {
    return this.delete<OrganizationSummary>(this.organizationPath(""), undefined, {"If-Match": etag})
  }

  suspendOrganization(etag: string): TE.TaskEither<ApprovioError, OrganizationSummary> {
    return this.post<OrganizationSummary>(this.organizationPath("/suspend"), undefined, {"If-Match": etag})
  }

  resumeOrganization(etag: string): TE.TaskEither<ApprovioError, OrganizationSummary> {
    return this.post<OrganizationSummary>(this.organizationPath("/resume"), undefined, {"If-Match": etag})
  }

  listMembers(params?: {page?: number; limit?: number}): TE.TaskEither<ApprovioError, MembershipList> {
    return this.get<MembershipList, {page?: number; limit?: number}>(this.organizationPath("/members"), params)
  }

  changeMemberRole(
    membershipId: string,
    data: MembershipRoleUpdate,
    etag: string
  ): TE.TaskEither<ApprovioError, Membership> {
    return this.patch<Membership>(this.organizationPath(`/members/${encodeURIComponent(membershipId)}`), data, {
      "If-Match": etag
    })
  }

  removeMember(membershipId: string, etag: string): TE.TaskEither<ApprovioError, void> {
    return this.delete<void>(this.organizationPath(`/members/${encodeURIComponent(membershipId)}`), undefined, {
      "If-Match": etag
    })
  }

  createInvitation(data: InvitationCreate): TE.TaskEither<ApprovioError, InvitationCreated> {
    return this.post<InvitationCreated>(this.organizationPath("/invitations"), data)
  }

  revokeInvitation(invitationId: string): TE.TaskEither<ApprovioError, void> {
    return this.delete<void>(this.organizationPath(`/invitations/${encodeURIComponent(invitationId)}`))
  }

  acceptInvitation(invitationId: string, data: InvitationAccept): TE.TaskEither<ApprovioError, Membership> {
    return this.post<Membership>(this.organizationPath(`/invitations/${encodeURIComponent(invitationId)}/accept`), data)
  }

  logout(): TE.TaskEither<ApprovioError, void> {
    return this.post<void>("/auth/web/logout")
  }
}
