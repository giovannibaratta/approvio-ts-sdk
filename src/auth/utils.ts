import {decodeJwt} from "jose"

export function isJwtTokenExpired(token: string): boolean {
  if (!token) return true
  const decoded = decodeJwt(token)
  return !decoded.exp || decoded.exp < Date.now() / 1000
}
