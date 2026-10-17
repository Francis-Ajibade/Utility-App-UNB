// "ama.kumi@unb.ca" -> "Ama Kumi". Empty when the address has no . or _
// (e.g. "fokafor@unb.ca"), so the person types their name instead.
export function guessName(email: string): string {
  const local = email.split('@')[0]
  if (!/[._]/.test(local)) return ''
  return local
    .split(/[._]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

// "Ama Kumi" -> "AK", "Ama" -> "A", no name yet -> first letter of the email.
export function initials(name: string | null, email: string): string {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return email[0].toUpperCase()
  const last = words.length > 1 ? words[words.length - 1][0] : ''
  return (words[0][0] + last).toUpperCase()
}

export function greeting(hour: number): string {
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}
