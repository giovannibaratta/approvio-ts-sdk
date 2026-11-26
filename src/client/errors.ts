export class LocationNotFoundError extends Error {
  constructor() {
    super("Location header was expected but not found")
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message)
  }
}

export class UnexpectedEntityTypeError extends Error {
  constructor(
    readonly expected: string,
    readonly received: string
  ) {
    super(`Expected entity type ${expected} but received ${received}`)
  }
}

export class OrganizationContextChangedError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message)
  }
}

export class OrganizationSuspendedError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message)
  }
}
