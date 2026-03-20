/**
 * Workshop API - 对接 url-generate 后端
 */

const API_BASE = import.meta.env.VITE_WORKSHOP_API_URL || '/api/workshop'

/**
 * 流式生成 HTML
 * @param {string} context - 用户输入的内容
 * @param {string} systemPrompt - 系统提示词
 * @returns {AsyncGenerator<string>} 生成的 HTML 片段流
 */
export async function* streamGenerate(context, systemPrompt) {
  const response = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ context, system_prompt: systemPrompt }),
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    yield decoder.decode(value, { stream: true })
  }
}

/**
 * 上传 HTML 文件到 OSS
 * @param {string} fileName - 文件名
 * @param {string} htmlContent - HTML 内容
 * @returns {Promise<{url: string}>} 上传后的 URL
 */
export async function uploadHTML(fileName, htmlContent) {
  const blob = new Blob([htmlContent], { type: 'text/html' })
  const formData = new FormData()
  formData.append('file', blob, fileName)

  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`)
  }

  return response.json()
}
