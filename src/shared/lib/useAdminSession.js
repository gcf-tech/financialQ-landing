import { useSyncExternalStore } from 'react'
import { getSession, subscribeSession } from '../api/auth'

/**
 * Sesión admin reactiva: se actualiza con login/logout sin recargar.
 * Devuelve { isAdmin, name, mustChangePassword }.
 */
export function useAdminSession() {
  const session = useSyncExternalStore(subscribeSession, getSession)
  return {
    isAdmin: session?.role === 'admin',
    name: session?.name || '',
    mustChangePassword: Boolean(session?.mustChangePassword),
  }
}
