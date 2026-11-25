import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api, post } from '@/lib/api'
import { clearStoredSession, getStoredSession, onSessionCleared, storeSession } from '@/lib/storage'
import { unregisterPush } from '@/lib/push'
import type { Session, SessionUser } from '@/lib/types'

type Status = 'loading' | 'guest' | 'authenticated'

interface AuthValue {
  status: Status
  user: SessionUser | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (name: string, email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

/**
 * Signed-in state for the whole app. Browsing works as a guest; saving and the
 * personal tabs ask the student to sign in.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<Status>('loading')
  const [user, setUser] = useState<SessionUser | null>(null)

  useEffect(() => {
    getStoredSession().then((s) => {
      setUser(s?.user ?? null)
      setStatus(s ? 'authenticated' : 'guest')
    })
    // A refresh the server refused (expired, revoked) signs the student out everywhere.
    return onSessionCleared(() => {
      setUser(null)
      setStatus('guest')
      // Forget everything personal so the next person on this phone never sees it
      queryClient.removeQueries({ predicate: (q) => ['me', 'saved', 'notifications', 'drafts', 'tool', 'profile', 'referral'].includes(String(q.queryKey[0])) })
    })
  }, [queryClient])

  const start = useCallback(async (session: Session) => {
    await storeSession(session)
    setUser(session.user)
    setStatus('authenticated')
    // Listing detail includes "saved", which depends on who is signed in
    queryClient.invalidateQueries()
  }, [queryClient])

  const signIn = useCallback(async (email: string, password: string) => {
    await start(await api<Session>('/auth/login', post({ email, password }), { auth: false }))
  }, [start])

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    await start(await api<Session>('/auth/register', post({ name, email, password }), { auth: false }))
  }, [start])

  const signOut = useCallback(async () => {
    const current = await getStoredSession()
    // Stop pushes to this phone first (needs the session), then revoke it.
    // A network error must never keep the student signed in.
    await unregisterPush().catch(() => {})
    if (current?.refreshToken) await api('/auth/logout', post({ refreshToken: current.refreshToken }), { auth: false }).catch(() => {})
    await clearStoredSession()
  }, [])

  const value = useMemo(() => ({ status, user, signIn, signUp, signOut }), [status, user, signIn, signUp, signOut])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
