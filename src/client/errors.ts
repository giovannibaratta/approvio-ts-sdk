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
