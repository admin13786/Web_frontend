const CONCEPTS = [
  ['RAG', [/\bRAG\b/i, '检索增强', 'Retrieval-Augmented']],
  ['LoRA', [/\bLoRA\b/i, '低秩适配', 'Low-Rank Adaptation']],
  ['Agent', [/\bAgent\b/i, '智能体', '代理', 'agentic']],
  ['Transformer', [/\bTransformer\b/i, '注意力机制', 'Self-Attention']],
  ['Embedding', [/\bEmbedding\b/i, '向量', '向量化', '表征学习']],
  ['微调', ['微调', 'SFT', '指令微调', 'finetune', 'fine-tuning']],
  ['对齐', ['对齐', 'RLHF', 'DPO', '偏好优化', 'alignment']],
  ['蒸馏', ['蒸馏', 'distill', 'distillation']],
  ['推理', ['推理', 'reasoning', 'CoT', '链式思维']],
  ['多模态', ['多模态', 'multimodal', 'VLM', '图文', '语音']],
  ['MoE', [/\bMoE\b/i, '混合专家', 'Mixture of Experts']],
  ['Token', [/\btoken\b/i, 'Token', '上下文窗口', 'context window', 'KV Cache']],
  // 添加英文AI关键词支持
  ['AI', [/\bAI\b/i, 'artificial intelligence', 'machine learning', 'ML']],
  ['GPT', [/\bGPT\b/i, 'ChatGPT', 'GPT-4', 'GPT-3']],
  ['LLM', [/\bLLM\b/i, 'Large Language Model', 'large language model']],
  ['OpenAI', [/\bOpenAI\b/i]],
  ['Claude', [/\bClaude\b/i, 'Anthropic']],
  ['Gemini', [/\bGemini\b/i, 'Google AI', 'Bard']],
]

const LEARNING_HINTS = ['是什么', '什么是', '入门', '科普', '一文读懂', '快速上手', '新手', '基础', '原理', '教程', '指南', '避坑', '图解', '总结', 
  'what is', 'how to', 'beginner', 'guide', 'tutorial', 'introduction', 'explained', 'understanding', 'basics', 'fundamentals', 'overview']
const LOW_QUALITY_HINTS = ['招商', '加盟', '返利', '免费领取', '加微信', '私信', '课程报名', '名额有限']

function blobText(obj) {
  return [
    String(obj?.title || ''),
    String(obj?.summary || ''),
    String(obj?.content || ''),
    String(obj?.source || ''),
    String(obj?.url || ''),
  ]
    .filter(Boolean)
    .join('\n')
    .toLowerCase()
}

function matchAny(patterns, text) {
  for (const p of patterns) {
    if (!p) continue
    if (p instanceof RegExp) {
      if (p.test(text)) return true
      continue
    }
    if (String(p).toLowerCase() && text.includes(String(p).toLowerCase())) return true
  }
  return false
}

export function extractConcepts(obj, topK = 4) {
  const t = blobText(obj)
  const found = []
  for (const [name, pats] of CONCEPTS) {
    if (matchAny(pats, t)) found.push(name)
  }
  return found.slice(0, topK)
}

export function eduScore(obj) {
  const t = blobText(obj)
  if (matchAny(LOW_QUALITY_HINTS, t)) return 0

  let conceptHits = 0
  for (const [, pats] of CONCEPTS) {
    if (matchAny(pats, t)) conceptHits += 1
  }
  let learnHits = 0
  for (const h of LEARNING_HINTS) {
    if (t.includes(h.toLowerCase())) learnHits += 1
  }
  return conceptHits * 1.3 + Math.min(learnHits, 6) * 0.45
}

// Simple stable hash (FNV-1a 32-bit)
export function stableHash32(str) {
  let h = 0x811c9dc5
  const s = String(str || '')
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export function pickTemplateId(key) {
  const n = (stableHash32(key) % 8) + 1
  return `t${n}`
}

export function pickTemplateIds(key, count = 3) {
  const total = 8
  const seed = stableHash32(key)
  const out = []
  for (let i = 0; i < Math.max(1, Number(count) || 3); i++) {
    const n = ((seed + i * 3) % total) + 1
    const id = `t${n}`
    if (!out.includes(id)) out.push(id)
    if (out.length >= total) break
  }
  return out
}

export function generateHookTitle(originalTitle, concepts, stableKey) {
  const concept = concepts?.[0] || '大模型'
  const seed = stableHash32(`${stableKey}|${originalTitle}|${concept}`)

  const templates = [
    (n) => `3分钟搞懂：${concept}到底是什么？`,
    (n) => `新手必看：${concept}的${n}个关键点`,
    (n) => `别再被${concept}绕晕：一句话讲透`,
    (n) => `从0到1：${concept}入门路线图`,
    (n) => `${concept}到底难在哪？用一个例子讲清楚`,
  ]
  const ns = [3, 5, 7]
  const n = ns[seed % ns.length]
  const hook = templates[seed % templates.length](n)

  const highlights = []
  for (const c of concepts || []) {
    if (!highlights.includes(c)) highlights.push(c)
    if (highlights.length >= 3) break
  }
  if (!highlights.length) highlights.push(concept)
  return { hookTitle: hook, highlights }
}
