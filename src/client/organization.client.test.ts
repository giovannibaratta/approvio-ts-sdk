import axios from "axios"
import {AgentAuthenticator} from "../auth/agent.authenticator"
import {Authenticator} from "../interfaces"
import {ApprovioAgentClient} from "./agent.client"
import {ApprovioPlatformClient} from "./platform.client"
import {ApprovioUserClient} from "./user.client"

jest.mock("axios")

class TestAuthenticator implements Authenticator {
  customizeAxios(): void {
    // No-op for request-capture tests.
  }
}

describe("organization-bound clients", () => {
  const mockedAxios = axios as jest.Mocked<typeof axios>
  const mockAxios = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    interceptors: {request: {use: jest.fn()}, response: {use: jest.fn()}}
  }
  const organizationA = "11111111-1111-1111-1111-111111111111"
  const organizationB = "22222222-2222-2222-2222-222222222222"

  beforeEach(() => {
    jest.clearAllMocks()
    mockedAxios.create.mockReturnValue(mockAxios)
    mockAxios.get.mockResolvedValue({data: {}, headers: {etag: "v1"}})
    mockAxios.post.mockResolvedValue({data: {}, headers: {etag: "v2"}})
    mockAxios.put.mockResolvedValue({data: {}, headers: {etag: "v2"}})
    mockAxios.patch.mockResolvedValue({data: {}, headers: {etag: "v2"}})
    mockAxios.delete.mockResolvedValue({data: {}, headers: {}})
  })

  it("uses the agent authenticator's organization for tenant requests", async () => {
    // Given
    const endpoint = "https://api.example.test"
    const authenticator = new AgentAuthenticator(endpoint, organizationA, "private-key", "access", "refresh")
    const client = new ApprovioAgentClient({endpoint}, authenticator)

    // When
    await client.getWorkflow("workflow-id")()

    // Expect
    expect(mockAxios.get).toHaveBeenCalledWith(`/o/${organizationA}/workflows/workflow-id`, {params: undefined})
  })

  it("qualifies every tenant endpoint family with the immutable organization handle", async () => {
    const client = new ApprovioUserClient(
      {endpoint: "https://api.example.test"},
      new TestAuthenticator(),
      organizationA
    )

    await client.listWorkflows()()
    await client.listUsers()()
    await client.listGroups()()
    await client.listSpaces()()
    await client.listWorkflowTemplates()()
    await client.listAuditLogs()()
    await client.listMembers()()
    await client.getOrganizationEntitlements()()
    await client.getOrganizationUsage()()
    await client.getOrganization()()
    await client.getEntityInfo()()
    await client.generateAgentChallenge({agentName: "agent"})()
    await client.initiateWebPrivilegeToken()()
    await client.revokeInvitation("invitation")()

    expect(mockAxios.get.mock.calls.map(([url]) => url)).toEqual([
      `/o/${organizationA}/workflows`,
      `/o/${organizationA}/users`,
      `/o/${organizationA}/groups`,
      `/o/${organizationA}/spaces`,
      `/o/${organizationA}/workflow-templates`,
      `/o/${organizationA}/audit-logs`,
      `/o/${organizationA}/members`,
      `/o/${organizationA}/entitlements`,
      `/o/${organizationA}/usage`,
      `/o/${organizationA}`,
      `/o/${organizationA}/auth/info`
    ])
    expect(mockAxios.post.mock.calls.map(([url]) => url)).toEqual([
      `/o/${organizationA}/auth/agents/challenge`,
      `/o/${organizationA}/auth/web/initiatePrivilegedTokenExchange`
    ])
    expect(mockAxios.delete).toHaveBeenCalledWith(`/o/${organizationA}/invitations/invitation`, undefined)
  })

  it("does not retarget an existing handle when another organization handle is created", async () => {
    const clientA = new ApprovioUserClient(
      {endpoint: "https://api.example.test"},
      new TestAuthenticator(),
      organizationA
    )
    const clientB = new ApprovioUserClient(
      {endpoint: "https://api.example.test"},
      new TestAuthenticator(),
      organizationB
    )

    await clientA.listWorkflows()()
    await clientB.listWorkflows()()
    await clientA.listWorkflows()()

    expect(mockAxios.get.mock.calls.map(([url]) => url)).toEqual([
      `/o/${organizationA}/workflows`,
      `/o/${organizationB}/workflows`,
      `/o/${organizationA}/workflows`
    ])
  })

  it("selects a CLI organization using the explicit selection route", async () => {
    // Given
    const client = new ApprovioPlatformClient({endpoint: "https://api.example.test"}, new TestAuthenticator())

    // When
    await client.selectCliOrganization({organizationId: organizationB})()

    // Expect
    expect(mockAxios.post).toHaveBeenCalledWith("/auth/cli/select-organization", {organizationId: organizationB})
  })

  it("keeps platform routes unqualified and sends the browser context ETag", async () => {
    const client = new ApprovioPlatformClient({endpoint: "https://api.example.test"}, new TestAuthenticator())

    await client.getOwnAccount()()
    await client.listOwnOrganizations()()
    await client.getWebSession()()
    await client.switchWebOrganization({organizationId: organizationB}, "session-v1")()

    expect(mockAxios.get.mock.calls.map(([url]) => url)).toEqual(["/account", "/o", "/auth/web/session"])
    expect(mockAxios.post).toHaveBeenCalledWith(
      "/auth/web/select-organization",
      {organizationId: organizationB},
      {headers: {"If-Match": "session-v1"}}
    )
  })
})
