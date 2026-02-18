import { z } from "zod"

export const AUTH_NAME_MAX_LENGTH = 70
export const AUTH_PASSWORD_MIN_LENGTH = 8
export const AUTH_PASSWORD_MAX_LENGTH = 72
export const AUTH_EMAIL_MAX_LENGTH = 254

export const AUTH_NAME_REQUIRED_MESSAGE = "Name is required"
export const AUTH_NAME_MAX_MESSAGE = `Name must be ${AUTH_NAME_MAX_LENGTH} characters or fewer`
export const AUTH_EMAIL_INVALID_MESSAGE = "Invalid email"
export const AUTH_EMAIL_MAX_MESSAGE = `Email must be ${AUTH_EMAIL_MAX_LENGTH} characters or fewer`
export const AUTH_PASSWORD_MIN_MESSAGE = `Password must be at least ${AUTH_PASSWORD_MIN_LENGTH} characters`
export const AUTH_PASSWORD_MAX_MESSAGE = `Password must be ${AUTH_PASSWORD_MAX_LENGTH} characters or fewer`
export const AUTH_PASSWORD_LETTER_MESSAGE = "Password must contain at least one letter"
export const AUTH_PASSWORD_NUMBER_MESSAGE = "Password must contain at least one number"

const letterRegex = /[A-Za-z]/
const numberRegex = /\d/

export interface PasswordRuleEvaluation {
  minLength: boolean
  maxLength: boolean
  hasLetter: boolean
  hasNumber: boolean
}

export function normalizeName(input: string): string {
  return input.trim()
}

export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase()
}

export function evaluatePasswordRules(password: string): PasswordRuleEvaluation {
  return {
    minLength: password.length >= AUTH_PASSWORD_MIN_LENGTH,
    maxLength: password.length <= AUTH_PASSWORD_MAX_LENGTH,
    hasLetter: letterRegex.test(password),
    hasNumber: numberRegex.test(password),
  }
}

export function isPasswordPolicyValid(password: string): boolean {
  const rules = evaluatePasswordRules(password)

  return rules.minLength && rules.maxLength && rules.hasLetter && rules.hasNumber
}

export const signUpNameSchema = z
  .string()
  .trim()
  .min(1, AUTH_NAME_REQUIRED_MESSAGE)
  .max(AUTH_NAME_MAX_LENGTH, AUTH_NAME_MAX_MESSAGE)

export const signUpEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(AUTH_EMAIL_MAX_LENGTH, AUTH_EMAIL_MAX_MESSAGE)
  .email(AUTH_EMAIL_INVALID_MESSAGE)

export const signUpSchema = z.object({
  name: signUpNameSchema,
  email: signUpEmailSchema,
  password: z
    .string()
    .min(AUTH_PASSWORD_MIN_LENGTH, AUTH_PASSWORD_MIN_MESSAGE)
    .max(AUTH_PASSWORD_MAX_LENGTH, AUTH_PASSWORD_MAX_MESSAGE)
    .refine((value) => evaluatePasswordRules(value).hasLetter, {
      message: AUTH_PASSWORD_LETTER_MESSAGE,
    })
    .refine((value) => evaluatePasswordRules(value).hasNumber, {
      message: AUTH_PASSWORD_NUMBER_MESSAGE,
    }),
})
