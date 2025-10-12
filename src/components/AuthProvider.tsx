import React, { createContext, useContext } from 'react'
import { useAuth } from '../hooks/useAuth'
import type { User, Session } from '@supabase/supabase-js'
import type { User as AppUser } from '../types/database'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: AppUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<any>
  signOut: () => Promise<any>
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth()

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}