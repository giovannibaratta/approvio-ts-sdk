import {validateURL, removeTrailingSlash} from "./utils"

describe("utils", () => {
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
