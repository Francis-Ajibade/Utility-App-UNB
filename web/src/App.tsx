import type { Session } from '@supabase/supabase-js'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router'

import { AppShell } from '@/components/app-shell'
import { AuthCard } from '@/components/auth-card'
import { Button } from '@/components/ui/button'
import { getMe } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Dashboard, NotYet } from '@/pages/dashboard'
import { Home } from '@/pages/home'
import { NameStep } from '@/pages/onboarding'
import { SignIn } from '@/pages/sign-in'
import { Splash } from '@/pages/welcome'

export default function App() {
  // undefined = still checking, null = signed out
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  // Keep the launch screen up long enough to read, even when the session is instant
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    // Fires once straight away with the current session, then on every change
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    const timer = setTimeout(() => setBooting(false), 900)
    return () => {
      data.subscription.unsubscribe()
      clearTimeout(timer)
    }
  }, [])

  if (booting || session === undefined) return <Splash />
  if (!session) return <SignIn />
  return <SignedIn userId={session.user.id} />
}

function SignedIn({ userId }: { userId: string }) {
  const { data: me, error } = useQuery({ queryKey: ['me', userId], queryFn: getMe })

  if (error) {
    return (
      <AuthCard title="Couldn't load your account" subtitle={error.message}>
        <Button className="w-full" onClick={() => supabase.auth.signOut()}>
          Sign out
        </Button>
      </AuthCard>
    )
  }
  if (!me) return <Splash />
  if (!me.display_name) return <NameStep me={me} />

  return (
    <Routes>
      <Route path="/" element={<Home me={me} />} />
      <Route path="/t/:teamId" element={<AppShell me={me} />}>
        <Route index element={<Dashboard />} />
        <Route path="stock" element={<NotYet title="Stock" />} />
        <Route path="requests" element={<NotYet title="Requests" />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
