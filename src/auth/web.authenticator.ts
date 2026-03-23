import {AxiosInstance, InternalAxiosRequestConfig} from "axios"
import {type Authenticator} from "../interfaces"

/**
 * WebAuthenticator is designed for browser-based environments
 * where authentication is managed automatically via HttpOnly cookies.
 *
 */
export class WebAuthenticator implements Authenticator {
  customizeAxios(axios: AxiosInstance): void {
    axios.defaults.withCredentials = true

    axios.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config as CustomAxiosConfig

        if (error.response?.status === 401 && (originalRequest.retry === undefined || !originalRequest.retry)) {
          // Mark the request as retried to prevent infinite loops
          originalRequest.retry = true

          try {
            await axios.post("/auth/web/refresh", {}, {retry: true} as CustomAxiosConfig)
            // After refreshing the session, retry the original request
            return axios(originalRequest)
          } catch (refreshError) {
            return Promise.reject(refreshError)
          }
        }

        // Either the request failed again with a 401 and we've already tried refreshing
        // or it's any other error
        return Promise.reject(error)
      }
    )
  }
}

interface CustomAxiosConfig extends InternalAxiosRequestConfig {
  retry?: boolean
}
