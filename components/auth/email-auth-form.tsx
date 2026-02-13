"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { useDictionary } from "@/app/lib/i18n/dictionary-context"
import { authClient } from "@/app/lib/auth/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface EmailAuthFormProps {
  callbackUrl?: string
}

type AuthMode = "sign-in" | "sign-up"

export function EmailAuthForm({
  callbackUrl,
}: EmailAuthFormProps) {
  const { dictionary } = useDictionary()
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>("sign-in")
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    startTransition(async () => {
      const payload = {
        email,
        password,
        callbackURL: callbackUrl ?? "/personal-path",
      }

      const result =
        mode === "sign-in"
          ? await authClient.signIn.email(payload)
          : await authClient.signUp.email({
              ...payload,
              name,
            })

      if (result.error) {
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
            onChange={(event) => setName(event.target.value)}
            placeholder={dictionary.auth.namePlaceholder}
            className="h-11 rounded-xl"
            required
          />
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">{dictionary.auth.email}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={dictionary.auth.emailPlaceholder}
          className="h-11 rounded-xl"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{dictionary.auth.password}</Label>
        <Input
          id="password"
          type="password"
          autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={dictionary.auth.passwordPlaceholder}
          className="h-11 rounded-xl"
          required
          minLength={8}
        />
      </div>

      <Button
        type="submit"
        className="mt-2 h-11 w-full rounded-xl text-sm font-semibold"
        disabled={isPending}
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
        onClick={() => setMode((current) => (current === "sign-in" ? "sign-up" : "sign-in"))}
      >
        {mode === "sign-in"
          ? dictionary.auth.switchToSignUp
          : dictionary.auth.switchToSignIn}
      </Button>
    </form>
  )
}
