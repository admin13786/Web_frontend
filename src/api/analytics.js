import { request } from './client.js'
import { getCurrentUser, getGuestSessionUser } from '../utils/auth.js'
import { FUNCTION_MODE, getRouteFunctionMode } from '../utils/functionMode.js'

function resolvePageKey(route) {
  const path = String(route?.path || '').trim()
  if (path === '/channel') return 'channel'
  if (path === '/edu-repo') return 'edu_repo'
  if (path === '/openmaic') return 'openmaic'
  if (/^\/news\/[^/]+$/i.test(path)) return 'news_detail'
  if (/^\/brief\/[^/]+$/i.test(path)) return 'news_brief'
  if (path === '/home') return 'home'
  if (path === '/workshop' || path === '/skills') {
    return getRouteFunctionMode(route) === FUNCTION_MODE.SKILL_ASSISTANT ? 'skill_assistant' : 'workshop'
  }
  return ''
}

export async function trackPageView(route) {
  const pageKey = resolvePageKey(route)
  if (!pageKey) return

  const currentUser = getCurrentUser()
  const payload = {
    page_key: pageKey,
    guest_id: currentUser?.username ? '' : getGuestSessionUser(),
  }

  try {
    await request('/api/analytics/page-view', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch {
    // Ignore analytics failures so they never block navigation.
  }
}
