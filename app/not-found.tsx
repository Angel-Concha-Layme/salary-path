import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-semibold">404</h1>
        <p className="text-muted-foreground">La página que buscas no existe.</p>
        <Button asChild>
          <Link href="/">Volver</Link>
        </Button>
      </div>
    </div>
  )
}
