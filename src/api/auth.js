import { request } from './client.js'
import { USE_MOCK } from '../config.js'

const delay = (ms) => new Promise((r) => setTimeout(r, ms))

/** Mock 登录：任意用户名密码均成功，返回模拟 token */
async function mockLogin(username, password) {
  await delay(400)
  return {
    ok: true,
    data: {
      success: true,
      token: `mock_${Date.now()}_${username}`,
      user: { username },
    },
  }
}

/**
 * 登录
 * @param {{ username: string, password: string }} payload
 * @returns {Promise<{ success: boolean, token?: string, message?: string }>}
 */
export async function login(payload) {
  if (USE_MOCK) {
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
      message: data?.message || (status === 401 ? '用户名或密码错误' : '登录失败'),
    }
  }
  return data
}
