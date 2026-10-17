import { Home, LogOut, Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Me } from '@/lib/api'
import { initials } from '@/lib/names'
import { supabase } from '@/lib/supabase'
import { currentTheme, setTheme, type Theme } from '@/lib/theme'

type Props = {
  me: Me
  side?: 'right' | 'bottom'
  showHome?: boolean
}

// The avatar and its menu: theme, home, sign out. Settings will live here too.
export function AccountMenu({ me, side = 'bottom', showHome = false }: Props) {
  const navigate = useNavigate()
  const [theme, setThemeState] = useState<Theme>(currentTheme)

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    setThemeState(next)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account"
        className="grid size-10 place-items-center rounded-full border bg-card text-sm font-semibold transition hover:border-foreground/30 data-popup-open:border-foreground/30"
      >
        {initials(me.display_name, me.email)}
      </DropdownMenuTrigger>
      <DropdownMenuContent side={side} align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <span className="block text-sm text-foreground">{me.display_name}</span>
            {me.email}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {showHome && (
          <DropdownMenuItem onClick={() => navigate('/')}>
            <Home />
            Home
          </DropdownMenuItem>
        )}
        <DropdownMenuItem closeOnClick={false} onClick={toggleTheme}>
          {theme === 'dark' ? <Sun /> : <Moon />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => supabase.auth.signOut()}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
