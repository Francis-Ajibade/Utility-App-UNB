import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'

import { AuthCard } from '@/components/auth-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateMe, type Me } from '@/lib/api'
import { guessName } from '@/lib/names'

export function NameStep({ me }: { me: Me }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(() => guessName(me.email))
  const save = useMutation({
    mutationFn: updateMe,
    // PATCH /me returns the same shape as GET /me, so no refetch is needed
    onSuccess: (updated) => queryClient.setQueryData(['me', me.id], updated),
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    if (name.trim()) save.mutate(name.trim())
  }

  return (
    <AuthCard
      title="What should we call you?"
      subtitle={`Signed in as ${me.email}. Your team sees this on tasks and activity. We only store your name and email.`}
    >
      <form className="flex flex-col gap-4" onSubmit={submit}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            autoComplete="name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {save.error && <p className="text-sm text-destructive">{save.error.message}</p>}
        </div>
        <Button type="submit" disabled={!name.trim() || save.isPending}>
          Continue
        </Button>
      </form>
    </AuthCard>
  )
}
