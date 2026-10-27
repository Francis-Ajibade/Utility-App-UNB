import { Clock, Mail } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'

import { AuthCard, CardIcon } from '@/components/auth-card'
import { ErrorNotice } from '@/components/form-message'
import { GlowButton } from '@/components/glow-button'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { linkError, supabase } from '@/lib/supabase'
import { Welcome } from '@/pages/welcome'

const LAST_EMAIL = 'lastSignInEmail'
const RESEND_SECONDS = 45
const UNB_EMAIL = /^[^@\s]+@unb\.ca$/

export function SignIn() {
  const [email, setEmail] = useState(() => localStorage.getItem(LAST_EMAIL) ?? '')
  // Welcome only for someone who has never asked for a link on this device
  const [step, setStep] = useState<'welcome' | 'form' | 'sent' | 'expired'>(() => {
    if (linkError && email) return 'expired'
    return email ? 'form' : 'welcome'
  })
  // A wrong email is the person's to fix (shown on the field); a failed send is not
  const [fieldError, setFieldError] = useState('')
  const [sendFailed, setSendFailed] = useState(false)
  const [sending, setSending] = useState(false)
  const [wait, setWait] = useState(0)

  useEffect(() => {
    if (wait <= 0) return
    const timer = setTimeout(() => setWait((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [wait])

  async function sendLink(event?: FormEvent) {
    event?.preventDefault()
    const value = email.trim().toLowerCase()
    if (!UNB_EMAIL.test(value)) {
      setFieldError(value ? "That isn't a UNB address" : 'Enter your UNB email')
      return
    }

    setSending(true)
    setFieldError('')
    setSendFailed(false)
    const { error } = await supabase.auth.signInWithOtp({
      email: value,
      options: { emailRedirectTo: window.location.origin },
    })
    setSending(false)

    if (error) {
      setSendFailed(true)
      return
    }
    localStorage.setItem(LAST_EMAIL, value)
    setEmail(value)
    setStep('sent')
    setWait(RESEND_SECONDS)
  }

  if (step === 'welcome') return <Welcome onStart={() => setStep('form')} />

  if (step === 'sent') {
    return (
      <AuthCard
        icon={
          <CardIcon>
            <Mail className="animate-bounce" />
          </CardIcon>
        }
        title="Check your email"
        subtitle={
          <>
            We sent a sign-in link to <span className="text-foreground">{email}</span>. It works
            once and expires in 1 hour.
          </>
        }
      >
        <div className="flex flex-col gap-2">
          {sendFailed && (
            <ErrorNotice title="Couldn't send the link">
              Check your connection, then try again in a minute.
            </ErrorNotice>
          )}
          <Button variant="outline" disabled={wait > 0 || sending} onClick={() => sendLink()}>
            {wait > 0 ? `Resend in 0:${String(wait).padStart(2, '0')}` : 'Resend link'}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setSendFailed(false)
              setStep('form')
            }}
          >
            Use a different email
          </Button>
        </div>
      </AuthCard>
    )
  }

  if (step === 'expired') {
    return (
      <AuthCard
        icon={
          <CardIcon tone="amber">
            <Clock />
          </CardIcon>
        }
        title="This link has expired"
        subtitle={`Sign-in links work once and last 1 hour. We can send a new one to ${email}.`}
      >
        <div className="flex flex-col gap-3">
          {sendFailed && (
            <ErrorNotice title="Couldn't send the link">
              Check your connection, then try again in a minute.
            </ErrorNotice>
          )}
          <GlowButton loading={sending} onClick={() => sendLink()}>
            {sending ? 'Sending...' : 'Send a new link'}
          </GlowButton>
          <Button
            variant="ghost"
            onClick={() => {
              setSendFailed(false)
              setStep('form')
            }}
          >
            Use a different email
          </Button>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Sign in"
      subtitle="Use your UNB email. We'll send you a link, no password needed."
    >
      <form className="flex flex-col gap-4" onSubmit={sendLink} noValidate>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">UNB email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            placeholder="name@unb.ca"
            value={email}
            aria-invalid={!!fieldError}
            aria-describedby={fieldError ? 'email-error' : undefined}
            onChange={(e) => {
              setEmail(e.target.value)
              setFieldError('')
              setSendFailed(false)
            }}
          />
        </div>
        {fieldError && (
          <ErrorNotice id="email-error" title={fieldError}>
            Only @unb.ca addresses can sign in.
          </ErrorNotice>
        )}
        {sendFailed && (
          <ErrorNotice title="Couldn't send the link">
            Check your connection, then try again in a minute.
          </ErrorNotice>
        )}
        <GlowButton type="submit" loading={sending} className="mt-1">
          {sending ? 'Sending...' : 'Send sign-in link'}
        </GlowButton>
      </form>
    </AuthCard>
  )
}
