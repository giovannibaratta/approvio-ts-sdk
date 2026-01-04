import {AuthHelper} from "./auth.helpers"

describe("AuthHelper", () => {
  describe("constructor", () => {
    describe("bad cases", () => {
      it("should throw error for invalid URL", () => {
        // Given: invalid endpoint
        const invalidEndpoint = "not-a-url"

        // When/Expect: constructing throws error
        expect(() => new AuthHelper(invalidEndpoint)).toThrow("Invalid URL")
      })

      it("should throw error for empty string", () => {
        // Given: empty endpoint
        const emptyEndpoint = ""

        // When/Expect: constructing throws error
        expect(() => new AuthHelper(emptyEndpoint)).toThrow("Invalid URL")
      })
    })

    describe("good cases", () => {
      it("should create instance with valid URL", () => {
        // Given: valid endpoint
        const validEndpoint = "https://api.example.com"

        // When: creating AuthHelper
        const helper = new AuthHelper(validEndpoint)

        // Expect: instance created
        expect(helper).toBeDefined()
      })
    })
  })

  describe("getUserLoginUrl", () => {
    describe("good cases", () => {
      it("should return correct login URL", () => {
        // Given: AuthHelper with endpoint
        const helper = new AuthHelper("https://api.example.com")

        // When: getting login URL
        const loginUrl = helper.getUserLoginUrl()

        // Expect: correct URL format
        expect(loginUrl).toBe("https://api.example.com/auth/login")
      })

      it("should return correct login URL with path in endpoint", () => {
        // Given: AuthHelper with endpoint containing path
        const helper = new AuthHelper("https://api.example.com/v1")

        // When: getting login URL
        const loginUrl = helper.getUserLoginUrl()

        // Expect: path preserved in URL
        expect(loginUrl).toBe("https://api.example.com/v1/auth/login")
      })

      it("should return correct login URL when endpoint has trailing slash", () => {
        // Given: AuthHelper with trailing slash
        const helper = new AuthHelper("https://api.example.com/")

        // When: getting login URL
        const loginUrl = helper.getUserLoginUrl()

        // Expect: no double slash in URL
        expect(loginUrl).toBe("https://api.example.com/auth/login")
      })
    })
  })
})
