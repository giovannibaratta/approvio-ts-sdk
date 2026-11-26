import * as TE from "fp-ts/TaskEither"
import {
  Account,
  AuthProvider,
  CliOrganizationSelection,
  OrganizationCreate,
  OrganizationCreateResponse,
  OrganizationList,
  TokenResponse,
  WebOrganizationSwitch,
  WebSessionContext
} from "@approvio/api"
import {Authenticator, ApprovioServerConfig} from "../interfaces"
import {ApprovioError, BaseApprovioClient, Versioned} from "./base.client"

/** Operations that do not select or access tenant data. */
export class ApprovioPlatformClient extends BaseApprovioClient {
  constructor(config: ApprovioServerConfig, authenticator: Authenticator) {
    super(config, authenticator)
  }

  getAuthProviders(): TE.TaskEither<ApprovioError, AuthProvider[]> {
    return this.get<AuthProvider[]>("/auth/providers")
  }

  getOwnAccount(): TE.TaskEither<ApprovioError, Account> {
    return this.get<Account>("/account")
  }

  listOwnOrganizations(params?: {page?: number; limit?: number}): TE.TaskEither<ApprovioError, OrganizationList> {
    return this.get<OrganizationList, {page?: number; limit?: number}>("/o", params)
  }

  createOrganization(data: OrganizationCreate): TE.TaskEither<ApprovioError, OrganizationCreateResponse> {
    return this.post<OrganizationCreateResponse>("/o", data)
  }

  getWebSession(): TE.TaskEither<ApprovioError, Versioned<WebSessionContext>> {
    return this.getVersioned<WebSessionContext>("/auth/web/session")
  }

  switchWebOrganization(
    data: WebOrganizationSwitch,
    etag: string
  ): TE.TaskEither<ApprovioError, Versioned<WebSessionContext>> {
    return this.postVersioned<WebSessionContext>("/auth/web/select-organization", data, {"If-Match": etag})
  }

  selectCliOrganization(data: CliOrganizationSelection): TE.TaskEither<ApprovioError, TokenResponse> {
    return this.post<TokenResponse>("/auth/cli/select-organization", data)
  }

  logout(): TE.TaskEither<ApprovioError, void> {
    return this.post<void>("/auth/web/logout")
  }
}
