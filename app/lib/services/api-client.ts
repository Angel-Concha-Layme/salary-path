import type { ApiFailure, ApiResponse, ApiSuccess } from "@/app/types/api"
import { ApiClientError } from "@/app/types/api"

const API_BASE_PATH = "/api/v1"

type QueryValue = string | number | boolean | null | undefined

export interface ApiRequestOptions extends Omit<RequestInit, "body" | "method"> {
  query?: Record<string, QueryValue>
  json?: unknown
}

function buildRequestPath(path: string, query?: Record<string, QueryValue>) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  const url = new URL(`${API_BASE_PATH}${normalizedPath}`, "http://localhost")

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) {
        continue
      }

      url.searchParams.set(key, String(value))
    }
  }

  return `${url.pathname}${url.search}`
}

function isApiSuccess<T>(value: unknown): value is ApiSuccess<T> {
  if (!value || typeof value !== "object") {
    return false
  }

  return "success" in value && value.success === true && "data" in value
}

function isApiFailure(value: unknown): value is ApiFailure {
  if (!value || typeof value !== "object") {
    return false
  }

  if (!("success" in value) || value.success !== false || !("error" in value)) {
    return false
  }

  const error = value.error

  if (!error || typeof error !== "object") {
    return false
  }

  return (
    "status" in error &&
    typeof error.status === "number" &&
    "code" in error &&
    typeof error.code === "string" &&
    "message" in error &&
    typeof error.message === "string"
  )
}

async function parseResponse(response: Response): Promise<unknown | null> {
  const rawBody = await response.text()

  if (!rawBody) {
    return null
  }

  try {
    return JSON.parse(rawBody)
  } catch {
    return null
  }
}

async function request<T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { json, query, headers, ...restOptions } = options
  const requestHeaders = new Headers(headers)
  const requestInit: RequestInit = {
    method,
    headers: requestHeaders,
    ...restOptions,
  }

  if (json !== undefined) {
    requestInit.body = JSON.stringify(json)

    if (!requestHeaders.has("content-type")) {
      requestHeaders.set("content-type", "application/json")
    }
  }

  try {
    const response = await fetch(buildRequestPath(path, query), requestInit)
    const payload = (await parseResponse(response)) as ApiResponse<T> | null

    if (payload && isApiSuccess<T>(payload)) {
      return payload.data
    }

    if (payload && isApiFailure(payload)) {
      throw new ApiClientError({
        status: payload.error.status,
        code: payload.error.code,
        message: payload.error.message,
        details: payload.error.details,
      })
    }

    if (!response.ok) {
      throw new ApiClientError({
        status: response.status,
        code: `HTTP_${response.status}`,
        message: response.statusText || "HTTP request failed",
      })
    }

    throw new ApiClientError({
      status: 500,
      code: "INVALID_RESPONSE",
      message: "Unexpected API response format",
    })
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error
    }

    if (
      (typeof DOMException !== "undefined" && error instanceof DOMException && error.name === "AbortError") ||
      (error instanceof Error && error.name === "AbortError")
    ) {
      throw new ApiClientError({
        status: 499,
        code: "ABORTED",
        message: "Request was aborted",
      })
    }

    throw new ApiClientError({
      status: 500,
      code: "NETWORK_ERROR",
      message: error instanceof Error ? error.message : "Network error",
    })
  }
}

export const apiClient = {
  get<T>(path: string, options?: ApiRequestOptions) {
    return request<T>("GET", path, options)
  },
  post<T>(path: string, options?: ApiRequestOptions) {
    return request<T>("POST", path, options)
  },
  put<T>(path: string, options?: ApiRequestOptions) {
    return request<T>("PUT", path, options)
  },
  patch<T>(path: string, options?: ApiRequestOptions) {
    return request<T>("PATCH", path, options)
  },
  delete<T>(path: string, options?: ApiRequestOptions) {
    return request<T>("DELETE", path, options)
  },
}
