import { BACKEND_URL } from './config'

// Sesión admin de la landing (editor de Perspectives). Persiste en
// localStorage y expone una suscripción mínima para que useAdminSession
// reaccione a login/logout sin recargar.
const STORAGE_KEY = 'fq_admin_session'

let currentSession = readStorage()
const listeners = new Set()

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function setSession(session) {
  currentSession = session
  if (session) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
  listeners.forEach(fn => fn())
}

export function subscribeSession(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function getSession() {
  return currentSession
}

function toSession(result) {
  return {
    accessToken: result.session.access_token,
    refreshToken: result.session.refresh_token,
    // Supabase entrega expires_at en segundos unix.
    expiresAt: result.session.expires_at,
    role: result.role,
    name: result.name || '',
    // El backend marca 1 en el primer ingreso (contraseña temporal): la UI
    // obliga a cambiarla antes de dejar entrar al editor.
    mustChangePassword: Boolean(result.must_change_password),
  }
}

async function parseError(res, fallback) {
  const err = await res.json().catch(() => ({}))
  return new Error(err.error || err.message || fallback)
}

/**
 * Login contra el backend. Devuelve:
 *  - { status: 'OTP_REQUIRED' } si el backend exige código por correo
 *  - { status: 'LOGGED_IN' } si la sesión quedó establecida
 * Lanza si las credenciales fallan o si el usuario no es admin.
 */
export async function login(email, password) {
  const res = await fetch(`${BACKEND_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw await parseError(res, 'Login failed')

  const result = await res.json()
  if (result.status === 'OTP_REQUIRED') return { status: 'OTP_REQUIRED' }

  return establish(result)
}

/** Segundo paso cuando login devolvió OTP_REQUIRED. */
export async function verifyOtp(email, token) {
  const res = await fetch(`${BACKEND_URL}/auth/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, token }),
  })
  if (!res.ok) throw await parseError(res, 'Invalid code')

  return establish(await res.json())
}

function establish(result) {
  if (result.status !== 'LOGGED_IN' || !result.session?.access_token) {
    throw new Error('UNEXPECTED_LOGIN_RESPONSE')
  }
  // El editor es solo para admins: cualquier otro rol no guarda sesión.
  if (result.role !== 'admin') {
    throw new Error('NOT_ADMIN')
  }
  setSession(toSession(result))
  return {
    status: 'LOGGED_IN',
    mustChangePassword: Boolean(result.must_change_password),
  }
}

export function logout() {
  const session = currentSession
  setSession(null)
  if (session?.accessToken) {
    // Best-effort: invalidar en el backend sin bloquear la UI.
    fetch(`${BACKEND_URL}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.accessToken}` },
    }).catch(() => {})
  }
}

/**
 * Access token vigente, refrescándolo si está por expirar (margen 60 s).
 * Si el refresh falla, cierra la sesión y lanza: la UI vuelve al login.
 */
export async function getAccessToken() {
  const session = currentSession
  if (!session) throw new Error('NO_SESSION')

  const now = Math.floor(Date.now() / 1000)
  if (session.expiresAt && session.expiresAt - now > 60) {
    return session.accessToken
  }

  const res = await fetch(`${BACKEND_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: session.refreshToken }),
  })
  if (!res.ok) {
    setSession(null)
    throw new Error('SESSION_EXPIRED')
  }

  const data = await res.json()
  setSession({
    ...session,
    accessToken: data.access_token,
    refreshToken: data.refresh_token || session.refreshToken,
    expiresAt: Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
  })
  return data.access_token
}

/**
 * Cambia la contraseña del usuario autenticado. Requiere la actual. Al
 * completarse, apaga must_change_password en la sesión local.
 */
export async function changePassword(currentPassword, newPassword) {
  const accessToken = await getAccessToken()
  const res = await fetch(`${BACKEND_URL}/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  })
  if (!res.ok) throw await parseError(res, 'Could not change password')

  if (currentSession) {
    setSession({ ...currentSession, mustChangePassword: false })
  }
  return res.json().catch(() => ({}))
}

/** Solicita el enlace de recuperación. Respuesta genérica (no revela si existe). */
export async function forgotPassword(email) {
  const res = await fetch(`${BACKEND_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  if (!res.ok) throw await parseError(res, 'Request failed')
  return res.json().catch(() => ({}))
}

/** Fija una nueva contraseña con el token recibido por correo. */
export async function resetPassword(token, newPassword) {
  const res = await fetch(`${BACKEND_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, new_password: newPassword }),
  })
  if (!res.ok) throw await parseError(res, 'Reset failed')
  return res.json().catch(() => ({}))
}
