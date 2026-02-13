"use client"

import { toast } from "sonner"

interface NotificationPromiseMessages<T> {
  loading: string
  success: string | ((value: T) => string)
  error: string | ((error: unknown) => string)
}

function success(message: string) {
  return toast.success(message)
}

function error(message: string) {
  return toast.error(message)
}

function info(message: string) {
  return toast.info(message)
}

function loading(message: string) {
  return toast.loading(message)
}

function promise<T>(value: Promise<T>, messages: NotificationPromiseMessages<T>) {
  toast.promise(value, {
    loading: messages.loading,
    success: messages.success,
    error: messages.error,
  })

  return value
}

export const notificationService = {
  success,
  error,
  info,
  loading,
  promise,
}
