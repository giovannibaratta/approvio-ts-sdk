import {APIError} from "@approvio/api"

/**
 * Checks if the given data matches the APIError structure.
 */
export function isApprovioError(data: unknown): data is APIError {
  return (
    data !== null &&
    typeof data === "object" &&
    "message" in data &&
    "code" in data &&
    typeof data.message === "string" &&
    typeof data.code === "string"
  )
}

export function validateURL(url: string): void {
  try {
    const validatedUrl = new URL(url)
    // Reject urls with query parameters
    if (validatedUrl.search.length > 0) throw new Error("URL must not contain query parameters")
    // Reject urls with hash
    if (validatedUrl.hash.length > 0) throw new Error("URL must not contain hash")
  } catch (e) {
    throw new Error("Invalid URL", {cause: e})
  }
}

export function removeTrailingSlash(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url
}
