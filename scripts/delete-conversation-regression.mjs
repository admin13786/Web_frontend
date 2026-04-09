import { chromium } from 'playwright'

const APP_BASE = 'http://127.0.0.1:5173'
const API_BASE = 'http://127.0.0.1:8000'

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

async function createConversation(page, conversation) {
  return await page.evaluate(async ({ payload, apiBase }) => {
    const token = window.localStorage.getItem('token')
    const response = await fetch(`${apiBase}/api/workshop-history/conversations/${encodeURIComponent(payload.id)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
    const text = await response.text()
    let data = null
    try {
      data = text ? JSON.parse(text) : null
    } catch {
      data = text
    }
    return { ok: response.ok, status: response.status, data }
  }, { payload: conversation, apiBase: API_BASE })
}

async function listConversations(page) {
  return await page.evaluate(async (apiBase) => {
    const token = window.localStorage.getItem('token')
    const response = await fetch(`${apiBase}/api/workshop-history/conversations`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const text = await response.text()
    let data = null
    try {
      data = text ? JSON.parse(text) : null
    } catch {
      data = text
    }
    return { ok: response.ok, status: response.status, data }
  }, API_BASE)
}

async function deleteConversation(page, conversationId) {
  return await page.evaluate(async ({ id, apiBase }) => {
    const token = window.localStorage.getItem('token')
    const response = await fetch(`${apiBase}/api/workshop-history/conversations/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const text = await response.text()
    let data = null
    try {
      data = text ? JSON.parse(text) : null
    } catch {
      data = text
    }
    return { ok: response.ok, status: response.status, data }
  }, { id: conversationId, apiBase: API_BASE })
}

async function createSession() {
  const response = await fetch(`${API_BASE}/api/auth/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: 'workshop_guest',
      password: '123456',
    }),
  })
  const data = await response.json()
  assert(response.ok && data?.success && data?.token, 'Failed to create backend session')
  return data
}

async function ensureSidebarConversationVisible(page, title) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const item = page.locator('.workshop-history__item', { hasText: title })
    if (await item.count()) {
      return item.first()
    }
    const nextPageButton = page.locator('.workshop-history__page-btn').last()
    if (!(await nextPageButton.count()) || await nextPageButton.isDisabled()) {
      break
    }
    await nextPageButton.click()
    await page.waitForTimeout(150)
  }
  throw new Error(`Could not find sidebar conversation ${title}`)
}

async function run() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const session = await createSession()
  await page.route('**/api/workshop-history/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const target = `${API_BASE}${url.pathname}${url.search}`
    const response = await fetch(target, {
      method: request.method(),
      headers: request.headers(),
      body: request.method() === 'GET' || request.method() === 'HEAD' ? undefined : await request.postDataBuffer(),
    })
    await route.fulfill({
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: Buffer.from(await response.arrayBuffer()),
    })
  })
  await page.addInitScript((sessionPayload) => {
    const authSession = {
      username: sessionPayload.user.username,
      displayName: sessionPayload.user.displayName,
      token: sessionPayload.token,
      loggedInAt: new Date().toISOString(),
    }
    window.localStorage.setItem('token', sessionPayload.token)
    window.localStorage.setItem('username', sessionPayload.user.username)
    window.localStorage.setItem('isLoggedIn', 'true')
    window.localStorage.setItem('auth_session_v1', JSON.stringify(authSession))
  }, session)
  const trackedRequests = []
  page.on('request', (request) => {
    const url = request.url()
    if (url.includes('/api/workshop-history/conversations')) {
      trackedRequests.push({ method: request.method(), url })
    }
  })

  const now = Date.now()
  const activeConversation = {
    id: `reg_delete_active_${now}`,
    title: `reg-delete-active-${now}`,
    createdAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
    orderIndex: null,
    messages: [
      { role: 'user', content: `delete active ${now}` },
      { role: 'assistant', content: 'ack' },
    ],
    preview: {
      mode: 'empty',
      html: '',
      url: '',
      code: { lang: '', content: '' },
    },
  }
  const spareConversation = {
    id: `reg_delete_spare_${now}`,
    title: `reg-delete-spare-${now}`,
    createdAt: new Date(now + 1).toISOString(),
    updatedAt: new Date(now + 1).toISOString(),
    orderIndex: null,
    messages: [
      { role: 'user', content: `spare ${now}` },
    ],
    preview: {
      mode: 'empty',
      html: '',
      url: '',
      code: { lang: '', content: '' },
    },
  }

  try {
    await page.goto(`${APP_BASE}/workshop`, { waitUntil: 'networkidle' })

    const activeCreate = await createConversation(page, activeConversation)
    const spareCreate = await createConversation(page, spareConversation)
    console.log(JSON.stringify({ activeCreate, spareCreate }, null, 2))
    assert(activeCreate.ok && activeCreate.data?.success, 'Failed to create active test conversation')
    assert(spareCreate.ok && spareCreate.data?.success, 'Failed to create spare test conversation')

    await page.goto(`${APP_BASE}/workshop?cid=${encodeURIComponent(activeConversation.id)}`, { waitUntil: 'networkidle' })

    const sidebarItem = await ensureSidebarConversationVisible(page, activeConversation.title)
    await sidebarItem.locator('.workshop-history__delete').click()
    await page.locator('.delete-conv-modal__btn--danger').click()
    await page.waitForTimeout(1200)
    const deleteRequestIndex = trackedRequests.findIndex(
      (request) => request.method === 'DELETE' && request.url.includes(encodeURIComponent(activeConversation.id)),
    )
    assert(deleteRequestIndex >= 0, 'Delete request was not observed')

    const afterDelete = await listConversations(page)
    assert(afterDelete.ok && afterDelete.data?.success, 'Failed to list conversations after delete')
    assert(
      !afterDelete.data.list.some((item) => item.id === activeConversation.id),
      'Deleted conversation still exists immediately after delete',
    )

    await page.reload({ waitUntil: 'networkidle' })

    const afterReload = await listConversations(page)
    assert(afterReload.ok && afterReload.data?.success, 'Failed to list conversations after reload')
    assert(
      !afterReload.data.list.some((item) => item.id === activeConversation.id),
      'Deleted conversation reappeared after reload',
    )

    const resurrectingRequests = trackedRequests.slice(deleteRequestIndex + 1).filter(
      (request) => request.method === 'PUT' && request.url.includes(encodeURIComponent(activeConversation.id)),
    )
    assert(resurrectingRequests.length === 0, 'Observed a PUT for the deleted conversation after delete')

    console.log(JSON.stringify({
      success: true,
      deletedConversationId: activeConversation.id,
      remainingCount: afterReload.data.list.length,
      trackedRequests,
      resurrectingRequests,
    }, null, 2))
  } finally {
    try {
      await deleteConversation(page, activeConversation.id)
      await deleteConversation(page, spareConversation.id)
    } catch {
      // ignore cleanup failures in regression script
    }
    await browser.close()
  }
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
