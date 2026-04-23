export const FUNCTION_MODE = {
  WORKSHOP: 'workshop',
  SKILL_ASSISTANT: 'skill_assistant',
}

export function normalizeFunctionMode(mode) {
  return String(mode || '').trim() === FUNCTION_MODE.SKILL_ASSISTANT
    ? FUNCTION_MODE.SKILL_ASSISTANT
    : FUNCTION_MODE.WORKSHOP
}

export function getPathForFunctionMode(mode) {
  return normalizeFunctionMode(mode) === FUNCTION_MODE.SKILL_ASSISTANT ? '/skills' : '/workshop'
}

export function getRouteFunctionMode(route) {
  const metaMode = normalizeFunctionMode(route?.meta?.functionMode)
  if (route?.path === '/skills') return FUNCTION_MODE.SKILL_ASSISTANT
  if (route?.path === '/workshop') return FUNCTION_MODE.WORKSHOP
  if (route?.path === '/skills/') return FUNCTION_MODE.SKILL_ASSISTANT
  if (route?.path === '/workshop/') return FUNCTION_MODE.WORKSHOP
  return metaMode
}
