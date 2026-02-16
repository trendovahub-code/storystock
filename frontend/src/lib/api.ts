const rawApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002"

export const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, "")

export const apiUrl = (path: string): string => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}
