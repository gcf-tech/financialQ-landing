import { useSyncExternalStore } from 'react'
import { getSession, subscribeSession } from '../api/auth'

/**
 * Sesión admin reactiva: se actualiza con login/logout sin recargar.
 * Devuelve { isAdmin, name, mustChangePassword }.
 *
 * El tercer argumento (getServerSnapshot) es obligatorio para el prerender:
 * sin él React lanza "Missing getServerSnapshot" al renderizar en Node. Sirve
 * el mismo getSession, que allí devuelve null porque no existe localStorage
 * (ver el try/catch de readStorage en shared/api/auth.js) — es decir, el HTML
 * estático se genera siempre en estado "sin sesión", que es lo correcto.
 */
export function useAdminSession() {
  const session = useSyncExternalStore(subscribeSession, getSession, getSession)
  return {
    isAdmin: session?.role === 'admin',
    name: session?.name || '',
    mustChangePassword: Boolean(session?.mustChangePassword),
  }
}
