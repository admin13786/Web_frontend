import { request } from './client.js'
import { USE_AUTH_MOCK } from '../config.js'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const MOCK_USER_STORE_KEY = 'mock_auth_users_v1'

function normalizeMockRole(user, username = '') {
  const role = String(user?.role || '').trim().toLowerCase()
  if (role === 'admin') return 'admin'
  if (String(username || '').trim().toLowerCase() === 'admin') return 'admin'
  return 'user'
}

function buildUserPayload(user, username) {
  const role = normalizeMockRole(user, username)
  return {
    username,
    displayName: user?.displayName || username,
    role,
    isAdmin: role === 'admin',
  }
}

function readMockUsers() {
  const defaultUsers = {
    admin: { password: 'admin123', displayName: '管理员', role: 'admin' },
    workshop_guest: { password: '123456', displayName: '默认用户', role: 'user' },
  }
  try {
    const raw = localStorage.getItem(MOCK_USER_STORE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return {
      ...defaultUsers,
      ...parsed,
    }
  } catch {
    return defaultUsers
  }
}

function writeMockUsers(users) {
  localStorage.setItem(MOCK_USER_STORE_KEY, JSON.stringify(users))
}

async function mockLogin(username, password) {
  await delay(300)
  const users = readMockUsers()
  const user = users[username]
  if (!user || user.password !== password) {
    return {
      ok: false,
      status: 401,
      data: { success: false, message: '用户名或密码错误' },
    }
  }
  return {
    ok: true,
    data: {
      success: true,
      token: `mock_${Date.now()}_${username}`,
      user: buildUserPayload(user, username),
    },
  }
}

async function mockRegister(username, password, displayName) {
  await delay(300)
  const users = readMockUsers()
  if (users[username]) {
    return {
      ok: false,
      status: 409,
      data: { success: false, message: '用户名已存在' },
    }
  }
  users[username] = {
    password,
    displayName: displayName || username,
    role: 'user',
  }
  writeMockUsers(users)
  return {
    ok: true,
    data: {
      success: true,
      token: `mock_${Date.now()}_${username}`,
      user: buildUserPayload(users[username], username),
    },
  }
}

export async function login(payload) {
  if (USE_AUTH_MOCK) {
    const res = await mockLogin(payload.username, payload.password)
    return res.data
  }

  const { ok, status, data } = await request('/api/auth/sessions', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (!ok) {
    return {
      success: false,
      message: data?.detail || data?.message || (status === 401 ? '用户名或密码错误' : '登录失败'),
    }
  }
  return data
}

export async function register(payload) {
  if (USE_AUTH_MOCK) {
    const res = await mockRegister(payload.username, payload.password, payload.displayName)
    return res.data
  }

  const { ok, status, data } = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      username: payload.username,
      password: payload.password,
      display_name: payload.displayName,
    }),
  })
  if (!ok) {
    return {
      success: false,
      message:
        data?.detail ||
        data?.message ||
        (status === 409 ? '用户名已存在' : '注册失败'),
    }
  }
  return data
}

export async function fetchCurrentSession() {
  if (USE_AUTH_MOCK) {
    return { success: false, user: null, status: 0 }
  }
  const { ok, status, data } = await request('/api/auth/me')
  if (!ok || !data?.success) {
    return { success: false, user: null, status }
  }
  return { ...data, status }
}

export async function logout() {
  if (USE_AUTH_MOCK) return { success: true }
  const { data } = await request('/api/auth/sessions/current', {
    method: 'DELETE',
  })
  return data || { success: true }
}
