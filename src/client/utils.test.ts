import {isApprovioError, validateURL, removeTrailingSlash} from "./utils"

describe("utils", () => {
  describe("isApprovioError", () => {
    describe("bad cases", () => {
      it("should return false for null", () => {
        // Given: null value
        const data = null

        // When: checking if it's an Approvio error
        const result = isApprovioError(data)

        // Expect: false
        expect(result).toBe(false)
      })

      it("should return false for undefined", () => {
        // Given: undefined value
        const data = undefined

        // When: checking if it's an Approvio error
        const result = isApprovioError(data)

        // Expect: false
        expect(result).toBe(false)
      })

      it("should return false for primitive types", () => {
        // Given: primitive values
        const primitives = ["string", 123, true, Symbol("test")]

        // When: checking if they are Approvio errors
        // Expect: all return false
        primitives.forEach(data => {
          expect(isApprovioError(data)).toBe(false)
        })
      })

      it("should return false for object without message field", () => {
        // Given: object without message
        const data = {code: "ERROR_CODE"}

        // When: checking if it's an Approvio error
        const result = isApprovioError(data)

        // Expect: false
        expect(result).toBe(false)
      })

      it("should return false for object without code field", () => {
        // Given: object without code
        const data = {message: "Error message"}

        // When: checking if it's an Approvio error
        const result = isApprovioError(data)

        // Expect: false
        expect(result).toBe(false)
      })

      it("should return false for object with non-string message", () => {
        // Given: object with non-string message
        const data = {message: 123, code: "ERROR_CODE"}

        // When: checking if it's an Approvio error
        const result = isApprovioError(data)

        // Expect: false
        expect(result).toBe(false)
      })

      it("should return false for object with non-string code", () => {
        // Given: object with non-string code
        const data = {message: "Error message", code: 123}

        // When: checking if it's an Approvio error
        const result = isApprovioError(data)

        // Expect: false
        expect(result).toBe(false)
      })
    })

    describe("good cases", () => {
      it("should return true for valid APIError structure", () => {
        // Given: valid APIError object
        const data = {
          message: "Something went wrong",
          code: "INTERNAL_ERROR"
        }

        // When: checking if it's an Approvio error
        const result = isApprovioError(data)

        // Expect: true
        expect(result).toBe(true)
      })

      it("should return true for APIError with additional fields", () => {
        // Given: APIError with extra fields
        const data = {
          message: "Not found",
          code: "NOT_FOUND",
          details: "Resource does not exist",
          timestamp: new Date().toISOString()
        }

        // When: checking if it's an Approvio error
        const result = isApprovioError(data)

        // Expect: true
        expect(result).toBe(true)
      })
    })

    it("should throw for URL with query parameters", () => {
      // Given: URL with query parameters
      const urlWithQuery = "https://example.com?param=value"

      // When/Expect: validating throws error
      expect(() => validateURL(urlWithQuery)).toThrow("Invalid URL")
    })
  })

  describe("validateURL", () => {
    describe("bad cases", () => {
      it("should throw error for invalid URL", () => {
        // Given: invalid URL
        const invalidUrl = "not-a-url"

        // When/Expect: validating throws error
        expect(() => validateURL(invalidUrl)).toThrow("Invalid URL")
      })

      it("should throw error for empty string", () => {
        // Given: empty string
        const emptyUrl = ""

        // When/Expect: validating throws error
        expect(() => validateURL(emptyUrl)).toThrow("Invalid URL")
      })

      it("should throw error for malformed URL", () => {
        // Given: malformed URL
        const malformedUrl = "http://"

        // When/Expect: validating throws error
        expect(() => validateURL(malformedUrl)).toThrow("Invalid URL")
      })

      it("should throw error for URL with only protocol", () => {
        // Given: URL with only protocol
        const protocolOnly = "https://"

        // When/Expect: validating throws error
        expect(() => validateURL(protocolOnly)).toThrow("Invalid URL")
      })

      it("should throw error for URL with hash", () => {
        // Given: URL with hash
        const urlWithHash = "https://example.com#section"

        // When/Expect: validating throws error
        expect(() => validateURL(urlWithHash)).toThrow("Invalid URL")
      })
    })

    describe("good cases", () => {
      it("should not throw for valid HTTP URL", () => {
        // Given: valid HTTP URL
        const validUrl = "http://example.com"

        // When/Expect: validating does not throw
        expect(() => validateURL(validUrl)).not.toThrow()
      })

      it("should not throw for valid HTTPS URL", () => {
        // Given: valid HTTPS URL
        const validUrl = "https://example.com"

        // When/Expect: validating does not throw
        expect(() => validateURL(validUrl)).not.toThrow()
      })

      it("should not throw for URL with path", () => {
        // Given: URL with path
        const urlWithPath = "https://example.com/api/v1"

        // When/Expect: validating does not throw
        expect(() => validateURL(urlWithPath)).not.toThrow()
      })

      it("should not throw for URL with port", () => {
        // Given: URL with port
        const urlWithPort = "https://example.com:8080"

        // When/Expect: validating does not throw
        expect(() => validateURL(urlWithPort)).not.toThrow()
      })

      it("should not throw for localhost URL", () => {
        // Given: localhost URL
        const localhostUrl = "http://localhost:3000"

        // When/Expect: validating does not throw
        expect(() => validateURL(localhostUrl)).not.toThrow()
      })
    })
  })

  describe("removeTrailingSlash", () => {
    describe("good cases", () => {
      it("should remove trailing slash from URL", () => {
        // Given: URL with trailing slash
        const url = "https://example.com/"

        // When: removing trailing slash
        const result = removeTrailingSlash(url)

        // Expect: slash removed
        expect(result).toBe("https://example.com")
      })

      it("should remove trailing slash from URL with path", () => {
        // Given: URL with path and trailing slash
        const url = "https://example.com/api/v1/"

        // When: removing trailing slash
        const result = removeTrailingSlash(url)

        // Expect: slash removed
        expect(result).toBe("https://example.com/api/v1")
      })

      it("should not modify URL without trailing slash", () => {
        // Given: URL without trailing slash
        const url = "https://example.com"

        // When: removing trailing slash
        const result = removeTrailingSlash(url)

        // Expect: URL unchanged
        expect(result).toBe("https://example.com")
      })

      it("should not modify URL with path without trailing slash", () => {
        // Given: URL with path but no trailing slash
        const url = "https://example.com/api/v1"

        // When: removing trailing slash
        const result = removeTrailingSlash(url)

        // Expect: URL unchanged
        expect(result).toBe("https://example.com/api/v1")
      })

      it("should handle URL with only slash", () => {
        // Given: single slash
        const url = "/"

        // When: removing trailing slash
        const result = removeTrailingSlash(url)

        // Expect: empty string
        expect(result).toBe("")
      })

      it("should handle empty string", () => {
        // Given: empty string
        const url = ""

        // When: removing trailing slash
        const result = removeTrailingSlash(url)

        // Expect: empty string
        expect(result).toBe("")
      })
    })
  })
})
