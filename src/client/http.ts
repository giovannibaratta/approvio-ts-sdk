import axios, {AxiosInstance, CreateAxiosDefaults} from "axios"
import {USER_AGENT} from "./constants"

/**
 * Creates a pre-configured axios instance with the common headers.
 */
export function createAxiosInstance(config?: CreateAxiosDefaults): AxiosInstance {
  const instance = axios.create({
    ...config,
    headers: {
      "User-Agent": USER_AGENT,
      ...config?.headers
    }
  })

  return instance
}
