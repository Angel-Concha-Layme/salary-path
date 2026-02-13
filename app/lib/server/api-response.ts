import { NextResponse } from "next/server"

import { ApiError } from "@/app/lib/server/api-error"

export interface ApiSuccess<T> {
  success: true
  data: T
}

export interface ApiFailure {
  success: false
  error: {
    status: number
    code: string
    message: string
    details?: unknown
  }
}

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiSuccess<T>>(
    {
      success: true,
      data,
    },
    init
  )
}

export function jsonError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json<ApiFailure>(
      {
        success: false,
        error: {
          status: error.status,
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.status }
    )
  }

  return NextResponse.json<ApiFailure>(
    {
      success: false,
      error: {
        status: 500,
        code: "INTERNAL_ERROR",
        message: "Internal server error",
      },
    },
    { status: 500 }
  )
}
