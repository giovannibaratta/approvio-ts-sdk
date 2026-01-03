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
