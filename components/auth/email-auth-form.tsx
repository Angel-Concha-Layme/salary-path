"use client"

import { CheckIcon } from "lucide-react"
import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import type { Dictionary } from "@/app/lib/i18n/get-dictionary"
import { useDictionary } from "@/app/lib/i18n/dictionary-context"
import { authClient } from "@/app/lib/auth/client"
import {
  AUTH_EMAIL_MAX_LENGTH,
  AUTH_EMAIL_INVALID_MESSAGE,
  AUTH_EMAIL_MAX_MESSAGE,
  AUTH_NAME_MAX_LENGTH,
  AUTH_NAME_MAX_MESSAGE,
  AUTH_NAME_REQUIRED_MESSAGE,
  AUTH_PASSWORD_LETTER_MESSAGE,
  AUTH_PASSWORD_MIN_LENGTH,
  AUTH_PASSWORD_MAX_LENGTH,
  AUTH_PASSWORD_MAX_MESSAGE,
  AUTH_PASSWORD_MIN_MESSAGE,
  AUTH_PASSWORD_NUMBER_MESSAGE,
  evaluatePasswordRules,
  normalizeEmail,
  normalizeName,
  signUpSchema,
} from "@/app/lib/models/auth/email-signup-validation.model"
import { authEmailAvailabilityService } from "@/app/lib/services/auth/email-availability.service"
import { ApiClientError } from "@/app/types/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface EmailAuthFormProps {
  callbackUrl?: string
}

type AuthMode = "sign-in" | "sign-up"
type SignUpField = "name" | "email" | "password"
type SignUpFieldErrors = Partial<Record<SignUpField, string>>
type ValidationRuleState = "passed" | "failed" | "pending"
interface EmailValidationFeedback {
  shouldShow: boolean
  state: ValidationRuleState
  label: string
  isInvalid: boolean
  isAlreadyRegistered: boolean
  isChecking: boolean
}
const signUpEmailOnlySchema = signUpSchema.pick({ email: true })

function isSignUpField(value: unknown): value is SignUpField {
  return value === "name" || value === "email" || value === "password"
}

function formatNameCounter(template: string, current: number, max: number): string {
  return template
    .replace("{current}", String(current))
    .replace("{max}", String(max))
}

function getSignUpFieldErrors(values: { name: string; email: string; password: string }, dictionary: Dictionary): SignUpFieldErrors {
  const parsed = signUpSchema.safeParse(values)

  if (parsed.success) {
    return {}
  }

  const nextErrors: SignUpFieldErrors = {}

  for (const issue of parsed.error.issues) {
    const field = issue.path[0]

    if (!isSignUpField(field) || nextErrors[field]) {
      continue
    }

    if (field === "name") {
      if (issue.message === AUTH_NAME_REQUIRED_MESSAGE) {
        nextErrors.name = dictionary.auth.validationNameRequired
        continue
      }

      if (issue.message === AUTH_NAME_MAX_MESSAGE) {
        nextErrors.name = dictionary.auth.validationNameMax
        continue
      }

      nextErrors.name = dictionary.auth.validationNameInvalid
      continue
    }

    if (field === "email") {
      if (issue.message === AUTH_EMAIL_MAX_MESSAGE) {
        nextErrors.email = dictionary.auth.validationEmailMax
        continue
      }

      if (issue.message === AUTH_EMAIL_INVALID_MESSAGE) {
        nextErrors.email = dictionary.auth.validationEmailInvalid
        continue
      }

      nextErrors.email = dictionary.auth.validationEmailInvalid
      continue
    }

    if (issue.message === AUTH_PASSWORD_MIN_MESSAGE) {
      nextErrors.password = dictionary.auth.validationPasswordMinLength
      continue
    }

    if (issue.message === AUTH_PASSWORD_MAX_MESSAGE) {
      nextErrors.password = dictionary.auth.validationPasswordMaxLength
      continue
    }

    if (issue.message === AUTH_PASSWORD_LETTER_MESSAGE) {
      nextErrors.password = dictionary.auth.validationPasswordHasLetter
      continue
    }

    if (issue.message === AUTH_PASSWORD_NUMBER_MESSAGE) {
      nextErrors.password = dictionary.auth.validationPasswordHasNumber
      continue
    }

    nextErrors.password = dictionary.auth.validationPasswordInvalid
  }

  return nextErrors
}

function mapRemoteSignUpErrorToField(message: string, dictionary: Dictionary): SignUpFieldErrors | null {
  const normalizedMessage = message.trim().toLowerCase()

  if (normalizedMessage.includes("user already exists")) {
    return { email: dictionary.auth.validationEmailAlreadyExists }
  }

  if (normalizedMessage.includes("invalid email")) {
    return { email: dictionary.auth.validationEmailInvalid }
  }

  if (normalizedMessage.includes("password too short") || message === AUTH_PASSWORD_MIN_MESSAGE) {
    return { password: dictionary.auth.validationPasswordMinLength }
  }

  if (normalizedMessage.includes("password too long") || message === AUTH_PASSWORD_MAX_MESSAGE) {
    return { password: dictionary.auth.validationPasswordMaxLength }
  }

  if (message === AUTH_PASSWORD_LETTER_MESSAGE) {
    return { password: dictionary.auth.validationPasswordHasLetter }
  }

  if (message === AUTH_PASSWORD_NUMBER_MESSAGE) {
    return { password: dictionary.auth.validationPasswordHasNumber }
  }

  if (message === AUTH_NAME_REQUIRED_MESSAGE) {
    return { name: dictionary.auth.validationNameRequired }
  }

  if (message === AUTH_NAME_MAX_MESSAGE) {
    return { name: dictionary.auth.validationNameMax }
  }

  if (normalizedMessage.includes("invalid name") || normalizedMessage.includes("name")) {
    return { name: dictionary.auth.validationNameInvalid }
  }

  return null
}

function ValidationRuleItem({ state, label }: { state: ValidationRuleState; label: string }) {
  const isPassed = state === "passed"
  const isFailed = state === "failed"

  return (
    <li
      className={cn(
        "flex items-center gap-2 text-xs",
        isPassed ? "text-emerald-600" : isFailed ? "text-destructive" : "text-muted-foreground"
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex size-4 items-center justify-center rounded-full border",
          isPassed
            ? "border-emerald-600 bg-emerald-600 text-white"
            : isFailed
              ? "border-destructive/60 bg-destructive/10"
              : "border-muted-foreground/40"
        )}
      >
        {isPassed ? <CheckIcon className="size-3" /> : null}
      </span>
      <span>{label}</span>
    </li>
  )
}

export function EmailAuthForm({
  callbackUrl,
}: EmailAuthFormProps) {
  const { dictionary } = useDictionary()
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>("sign-in")
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [emailValidationRequestedFor, setEmailValidationRequestedFor] = useState("")
  const [emailAvailabilityResult, setEmailAvailabilityResult] = useState({
    checkedEmail: "",
    exists: false,
    hasError: false,
  })
  const [password, setPassword] = useState("")
  const [fieldErrors, setFieldErrors] = useState<SignUpFieldErrors>({})

  const passwordRules = useMemo(() => evaluatePasswordRules(password), [password])
  const hasStartedPasswordInput = password.length > 0
  const normalizedNameLength = useMemo(() => normalizeName(name).length, [name])
  const normalizedEmail = useMemo(() => normalizeEmail(email), [email])
  const emailValidation = useMemo<EmailValidationFeedback>(() => {
    if (mode !== "sign-up") {
      return {
        shouldShow: false,
        state: "failed" as ValidationRuleState,
        label: dictionary.auth.validationEmailInvalid,
        isInvalid: false,
        isAlreadyRegistered: false,
        isChecking: false,
      }
    }

    if (normalizedEmail.length === 0) {
      return {
        shouldShow: false,
        state: "failed" as ValidationRuleState,
        label: dictionary.auth.validationEmailInvalid,
        isInvalid: false,
        isAlreadyRegistered: false,
        isChecking: false,
      }
    }

    const hasRequestedValidationForCurrentEmail =
      normalizedEmail.length > 0 && normalizedEmail === emailValidationRequestedFor

    if (!hasRequestedValidationForCurrentEmail) {
      return {
        shouldShow: false,
        state: "failed" as ValidationRuleState,
        label: dictionary.auth.validationEmailInvalid,
        isInvalid: false,
        isAlreadyRegistered: false,
        isChecking: false,
      }
    }

    if (normalizedEmail.length > AUTH_EMAIL_MAX_LENGTH) {
      return {
        shouldShow: true,
        state: "failed" as ValidationRuleState,
        label: dictionary.auth.validationEmailMax,
        isInvalid: true,
        isAlreadyRegistered: false,
        isChecking: false,
      }
    }

    const parsed = signUpEmailOnlySchema.safeParse({ email: normalizedEmail })

    if (!parsed.success) {
      const issueMessage = parsed.error.issues[0]?.message

      return {
        shouldShow: true,
        state: "failed" as ValidationRuleState,
        label:
          issueMessage === AUTH_EMAIL_MAX_MESSAGE
            ? dictionary.auth.validationEmailMax
            : dictionary.auth.validationEmailInvalid,
        isInvalid: true,
        isAlreadyRegistered: false,
        isChecking: false,
      }
    }

    const pendingValidation =
      normalizedEmail !== emailAvailabilityResult.checkedEmail

    if (pendingValidation) {
      return {
        shouldShow: true,
        state: "pending" as ValidationRuleState,
        label: dictionary.auth.emailStatusChecking,
        isInvalid: false,
        isAlreadyRegistered: false,
        isChecking: true,
      }
    }

    if (emailAvailabilityResult.hasError) {
      return {
        shouldShow: true,
        state: "failed" as ValidationRuleState,
        label: dictionary.auth.emailStatusError,
        isInvalid: false,
        isAlreadyRegistered: false,
        isChecking: false,
      }
    }

    return {
      shouldShow: true,
      state: emailAvailabilityResult.exists ? "failed" : "passed",
      label: emailAvailabilityResult.exists
        ? dictionary.auth.emailStatusAlreadyRegistered
        : dictionary.auth.emailStatusAvailable,
      isInvalid: emailAvailabilityResult.exists,
      isAlreadyRegistered: emailAvailabilityResult.exists,
      isChecking: false,
    }
  }, [
    dictionary,
    emailAvailabilityResult,
    emailValidationRequestedFor,
    mode,
    normalizedEmail,
  ])

  useEffect(() => {
    if (mode !== "sign-up") {
      return
    }

    if (emailValidationRequestedFor.length === 0) {
      return
    }

    const parsed = signUpEmailOnlySchema.safeParse({ email: emailValidationRequestedFor })

    if (!parsed.success) {
      return
    }

    const abortController = new AbortController()
    const checkedEmail = parsed.data.email

    void authEmailAvailabilityService
      .checkEmailAvailability(checkedEmail, {
        signal: abortController.signal,
      })
      .then((response) => {
        setEmailAvailabilityResult({
          checkedEmail,
          exists: response.exists,
          hasError: false,
        })
      })
      .catch((error: unknown) => {
        if (error instanceof ApiClientError && (error.status === 499 || error.code === "ABORTED")) {
          return
        }

        setEmailAvailabilityResult({
          checkedEmail,
          exists: false,
          hasError: true,
        })
      })

    return () => {
      abortController.abort()
    }
  }, [emailValidationRequestedFor, mode])

  function requestEmailValidation(value: string) {
    const normalized = normalizeEmail(value)

    if (!normalized) {
      setEmailValidationRequestedFor("")
      return
    }

    setEmailValidationRequestedFor(normalized)
  }

  function clearFieldError(field: SignUpField) {
    setFieldErrors((current) => {
      if (!current[field]) {
        return current
      }

      const next = { ...current }
      delete next[field]
      return next
    })
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    startTransition(async () => {
      const payload = {
        email: normalizeEmail(email),
        password,
        callbackURL: callbackUrl ?? "/personal-path",
      }

      let result: Awaited<ReturnType<typeof authClient.signIn.email>>

      if (mode === "sign-up") {
        const nextErrors = getSignUpFieldErrors(
          {
            name,
            email,
            password,
          },
          dictionary
        )

        if (Object.keys(nextErrors).length > 0) {
          setFieldErrors(nextErrors)
          return
        }

        const parsed = signUpSchema.safeParse({
          name,
          email,
          password,
        })

        if (!parsed.success) {
          setFieldErrors(getSignUpFieldErrors({ name, email, password }, dictionary))
          return
        }

        if (emailValidation.isAlreadyRegistered) {
          setFieldErrors({
            email: dictionary.auth.validationEmailAlreadyExists,
          })
          return
        }

        setFieldErrors({})
        result = await authClient.signUp.email({
          ...payload,
          name: parsed.data.name,
          email: parsed.data.email,
          password: parsed.data.password,
        })
      } else {
        setFieldErrors({})
        result = await authClient.signIn.email(payload)
      }

      if (result.error) {
        if (mode === "sign-up" && result.error.message) {
          const mappedErrors = mapRemoteSignUpErrorToField(result.error.message, dictionary)

          if (mappedErrors) {
            setFieldErrors(mappedErrors)
            return
          }

          toast.error(result.error.message || dictionary.auth.validationSignUpGeneric)
          return
        }

        toast.error(result.error.message ?? dictionary.common.unknownError)
        return
      }

      toast.success(mode === "sign-in" ? dictionary.auth.signIn : dictionary.auth.signUp)
      router.push(callbackUrl ?? "/personal-path")
      router.refresh()
    })
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      {mode === "sign-up" ? (
        <div className="space-y-2">
          <Label htmlFor="name">{dictionary.auth.name}</Label>
          <Input
            id="name"
            autoComplete="name"
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              clearFieldError("name")
            }}
            placeholder={dictionary.auth.namePlaceholder}
            className="h-11 rounded-xl"
            aria-invalid={Boolean(fieldErrors.name)}
            required
            maxLength={AUTH_NAME_MAX_LENGTH}
          />
          <p className="text-right text-xs text-muted-foreground">
            {formatNameCounter(dictionary.auth.nameCounter, normalizedNameLength, AUTH_NAME_MAX_LENGTH)}
          </p>
          {fieldErrors.name ? (
            <p role="alert" className="text-sm text-destructive">
              {fieldErrors.name}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">{dictionary.auth.email}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            clearFieldError("email")
          }}
          onBlur={(event) => {
            requestEmailValidation(event.target.value)
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              requestEmailValidation(event.currentTarget.value)
            }
          }}
          placeholder={dictionary.auth.emailPlaceholder}
          className="h-11 rounded-xl"
          aria-invalid={
            Boolean(fieldErrors.email) ||
            (mode === "sign-up" && emailValidation.shouldShow && emailValidation.isInvalid)
          }
          required
        />
        {mode === "sign-up" && emailValidation.shouldShow ? (
          <div className="rounded-lg border border-border/80 bg-muted/30 p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              {dictionary.auth.emailValidationTitle}
            </p>
            <ul className="space-y-1">
              <ValidationRuleItem
                state={emailValidation.state}
                label={emailValidation.label}
              />
            </ul>
          </div>
        ) : null}
        {fieldErrors.email ? (
          <p role="alert" className="text-sm text-destructive">
            {fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{dictionary.auth.password}</Label>
        <Input
          id="password"
          type="password"
          autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
          value={password}
          onChange={(event) => {
            setPassword(event.target.value)
            clearFieldError("password")
          }}
          placeholder={dictionary.auth.passwordPlaceholder}
          className="h-11 rounded-xl"
          aria-invalid={Boolean(fieldErrors.password)}
          required
          minLength={AUTH_PASSWORD_MIN_LENGTH}
          maxLength={mode === "sign-up" ? AUTH_PASSWORD_MAX_LENGTH : undefined}
        />
        {mode === "sign-up" ? (
          <div className="rounded-lg border border-border/80 bg-muted/30 p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              {dictionary.auth.passwordRulesTitle}
            </p>
            <ul className="space-y-1">
              <ValidationRuleItem
                state={
                  hasStartedPasswordInput
                    ? passwordRules.minLength ? "passed" : "failed"
                    : "pending"
                }
                label={dictionary.auth.passwordRuleMinLength}
              />
              <ValidationRuleItem
                state={
                  hasStartedPasswordInput
                    ? passwordRules.maxLength ? "passed" : "failed"
                    : "pending"
                }
                label={dictionary.auth.passwordRuleMaxLength}
              />
              <ValidationRuleItem
                state={
                  hasStartedPasswordInput
                    ? passwordRules.hasLetter ? "passed" : "failed"
                    : "pending"
                }
                label={dictionary.auth.passwordRuleHasLetter}
              />
              <ValidationRuleItem
                state={
                  hasStartedPasswordInput
                    ? passwordRules.hasNumber ? "passed" : "failed"
                    : "pending"
                }
                label={dictionary.auth.passwordRuleHasNumber}
              />
            </ul>
          </div>
        ) : null}
        {fieldErrors.password ? (
          <p role="alert" className="text-sm text-destructive">
            {fieldErrors.password}
          </p>
        ) : null}
      </div>

      <Button
        type="submit"
        className="mt-2 h-11 w-full rounded-xl text-sm font-semibold"
        disabled={isPending || (mode === "sign-up" && emailValidation.isChecking)}
      >
        {isPending
          ? dictionary.auth.pending
          : mode === "sign-in"
            ? dictionary.auth.signIn
            : dictionary.auth.signUp}
      </Button>

      <Button
        type="button"
        variant="link"
        className="h-auto w-full px-0 py-0 text-sm"
        onClick={() => {
          setFieldErrors({})
          setEmailValidationRequestedFor("")
          setMode((current) => (current === "sign-in" ? "sign-up" : "sign-in"))
        }}
      >
        {mode === "sign-in"
          ? dictionary.auth.switchToSignUp
          : dictionary.auth.switchToSignIn}
      </Button>
    </form>
  )
}
