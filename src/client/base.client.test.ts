import {BaseApprovioClient} from "./base.client"
import {Authenticator} from "../interfaces"
import axios from "axios"
import * as E from "fp-ts/Either"

jest.mock("axios")
const mockedAxios = axios as jest.Mocked<typeof axios>

class TestAuthenticator implements Authenticator {
  customizeAxios(): void {
    // No-op for testing
  }
}

class TestClient extends BaseApprovioClient {
  private mockAuthenticator: Authenticator

  constructor(endpoint: string, authenticator: Authenticator) {
    super({endpoint}, authenticator)
    this.mockAuthenticator = {
      customizeAxios: jest.fn().mockResolvedValue(void 0)
    }
  }

  getAuthenticator(): Authenticator {
    return this.mockAuthenticator
  }

  public testGet<T>(url: string, params?: Record<string, unknown>) {
    return this.get<T>(url, params)
  }

  public testPost<T>(url: string, data?: unknown) {
    return this.post<T>(url, data)
  }

  public testPut<T>(url: string, data?: unknown) {
    return this.put<T>(url, data)
  }

  public testDelete<T>(url: string) {
    return this.delete<T>(url)
  }

  public testHandleError(error: unknown) {
    return this.handleError(error)
  }
}

describe("BaseApprovioClient", () => {
  let mockAxiosInstance: {
    get: jest.Mock
    post: jest.Mock
    put: jest.Mock
    delete: jest.Mock
    interceptors: {
      request: {
        use: jest.Mock
      }
      response: {
        use: jest.Mock
      }
    }
  }

  beforeEach(() => {
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: {
          use: jest.fn()
        },
        response: {
          use: jest.fn()
        }
      }
    }

    mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance)
    jest.clearAllMocks()
  })

  describe("constructor", () => {
    describe("bad cases", () => {
      it("should throw error for invalid endpoint URL", () => {
        // Given: invalid endpoint
        const invalidEndpoint = "not-a-url"

        // When/Expect: constructing throws error
        expect(() => new TestClient(invalidEndpoint, new TestAuthenticator())).toThrow("Invalid URL")
      })

      it("should throw error for empty endpoint", () => {
        // Given: empty endpoint
        const emptyEndpoint = ""

        // When/Expect: constructing throws error
        expect(() => new TestClient(emptyEndpoint, new TestAuthenticator())).toThrow("Invalid URL")
      })
    })

    describe("good cases", () => {
      it("should create axios instance with correct baseURL", () => {
        // Given: valid endpoint
        const endpoint = "https://api.example.com"

        // When: creating client
        new TestClient(endpoint, new TestAuthenticator())

        // Expect: axios created with correct baseURL
        expect(mockedAxios.create).toHaveBeenCalledWith({
          baseURL: "https://api.example.com"
        })
      })

      it("should remove trailing slash from endpoint", () => {
        // Given: endpoint with trailing slash
        const endpoint = "https://api.example.com/"

        // When: creating client
        new TestClient(endpoint, new TestAuthenticator())

        // Expect: axios created with baseURL without trailing slash
        expect(mockedAxios.create).toHaveBeenCalledWith({
          baseURL: "https://api.example.com"
        })
      })
    })
  })

  describe("HTTP methods", () => {
    let client: TestClient

    beforeEach(() => {
      client = new TestClient("https://api.example.com", new TestAuthenticator())
    })

    describe("get", () => {
      describe("bad cases", () => {
        it("should return Left on error", async () => {
          // Given: axios get fails
          const error = new Error("Network error")
          mockAxiosInstance.get.mockRejectedValue(error)

          // When: calling get
          const result = await client.testGet("/endpoint")()

          // Expect: Left with error
          expect(E.isLeft(result)).toBe(true)
        })
      })

      describe("good cases", () => {
        it("should return Right with data on success", async () => {
          // Given: successful response
          const responseData = {id: 1, name: "Test"}
          mockAxiosInstance.get.mockResolvedValue({data: responseData})

          // When: calling get
          const result = await client.testGet("/endpoint")()

          // Expect: Right with data
          expect(E.isRight(result)).toBe(true)
        })

        it("should pass params to axios", async () => {
          // Given: successful response
          mockAxiosInstance.get.mockResolvedValue({data: {}})
          const params = {page: 1, limit: 10}

          // When: calling get with params
          await client.testGet("/endpoint", params)()

          // Expect: axios called with params
          expect(mockAxiosInstance.get).toHaveBeenCalledWith("/endpoint", {params})
        })
      })
    })

    describe("post", () => {
      describe("bad cases", () => {
        it("should return Left on error", async () => {
          // Given: axios post fails
          const error = new Error("Network error")
          mockAxiosInstance.post.mockRejectedValue(error)

          // When: calling post
          const result = await client.testPost("/endpoint", {data: "test"})()

          // Expect: Left with error
          expect(E.isLeft(result)).toBe(true)
        })
      })

      describe("good cases", () => {
        it("should return Right with data on success", async () => {
          // Given: successful response
          const responseData = {id: 1, created: true}
          mockAxiosInstance.post.mockResolvedValue({data: responseData})

          // When: calling post
          const result = await client.testPost("/endpoint", {name: "Test"})()

          // Expect: Right with data
          expect(E.isRight(result)).toBe(true)
        })

        it("should pass data to axios", async () => {
          // Given: successful response
          mockAxiosInstance.post.mockResolvedValue({data: {}})
          const postData = {name: "Test", value: 123}

          // When: calling post with data
          await client.testPost("/endpoint", postData)()

          // Expect: axios called with data
          expect(mockAxiosInstance.post).toHaveBeenCalledWith("/endpoint", postData)
        })
      })
    })

    describe("put", () => {
      describe("bad cases", () => {
        it("should return Left on error", async () => {
          // Given: axios put fails
          const error = new Error("Network error")
          mockAxiosInstance.put.mockRejectedValue(error)

          // When: calling put
          const result = await client.testPut("/endpoint", {data: "test"})()

          // Expect: Left with error
          expect(E.isLeft(result)).toBe(true)
        })
      })

      describe("good cases", () => {
        it("should return Right with data on success", async () => {
          // Given: successful response
          const responseData = {id: 1, updated: true}
          mockAxiosInstance.put.mockResolvedValue({data: responseData})

          // When: calling put
          const result = await client.testPut("/endpoint", {name: "Updated"})()

          // Expect: Right with data
          expect(E.isRight(result)).toBe(true)
        })

        it("should pass data to axios", async () => {
          // Given: successful response
          mockAxiosInstance.put.mockResolvedValue({data: {}})
          const putData = {name: "Updated", value: 456}

          // When: calling put with data
          await client.testPut("/endpoint", putData)()

          // Expect: axios called with data
          expect(mockAxiosInstance.put).toHaveBeenCalledWith("/endpoint", putData)
        })
      })
    })

    describe("delete", () => {
      describe("bad cases", () => {
        it("should return Left on error", async () => {
          // Given: axios delete fails
          const error = new Error("Network error")
          mockAxiosInstance.delete.mockRejectedValue(error)

          // When: calling delete
          const result = await client.testDelete("/endpoint")()

          // Expect: Left with error
          expect(E.isLeft(result)).toBe(true)
        })
      })

      describe("good cases", () => {
        it("should return Right with data on success", async () => {
          // Given: successful response
          const responseData = {id: 1, deleted: true}
          mockAxiosInstance.delete.mockResolvedValue({data: responseData})

          // When: calling delete
          const result = await client.testDelete("/endpoint")()

          // Expect: Right with data
          expect(E.isRight(result)).toBe(true)
        })

        it("should call axios delete with correct URL", async () => {
          // Given: successful response
          mockAxiosInstance.delete.mockResolvedValue({data: {}})

          // When: calling delete
          await client.testDelete("/endpoint/123")()

          // Expect: axios called with URL
          expect(mockAxiosInstance.delete).toHaveBeenCalledWith("/endpoint/123", undefined)
        })
      })
    })
  })
})
