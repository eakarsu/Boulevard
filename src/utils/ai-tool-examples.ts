export const AI_EXAMPLE_LABELS = ['Everyday service', 'Careful review', 'Client preparation'] as const
export const DEFAULT_SCOPE = '__default__'
export type AIReference = { id: string | number; name?: string; first_name?: string; last_name?: string; clientName?: string; service?: string }
export type AIReferences = { clients: AIReference[]; services: AIReference[]; staff: AIReference[]; appointments: AIReference[] }
export type AIExampleField = { name: string; label: string; required?: boolean }
export const REFERENCE_LISTS: Record<string, keyof AIReferences> = { client_id: 'clients', service_id: 'services', staff_id: 'staff', appointment_id: 'appointments' }

export function referenceLabel(record: AIReference) {
  return record.name || [record.first_name, record.last_name].filter(Boolean).join(' ') || [record.clientName, record.service].filter(Boolean).join(' · ') || String(record.id)
}
export function scopeLabel(toolId: string, fieldName: string) {
  if (toolId === 'no-show-predict') return fieldName === 'client_id' ? 'Use the selected appointment’s client' : 'Client history only (no appointment)'
  if (fieldName === 'client_id') return 'No specific client context'
  return fieldName === 'staff_id' ? 'All staff' : 'All services'
}
function localDate(date: Date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}

export function fillAIToolExample(toolId: string, index: number, fields: AIExampleField[], current: Record<string, string>, references: AIReferences) {
  const today = new Date(), future = new Date(today), from = new Date(today)
  future.setDate(future.getDate() + index + 1)
  from.setDate(from.getDate() - [30, 90, 180][index])
  const text: Record<string, string[]> = {
    message: ['Please suggest services from the current catalog for a weekday morning visit. Confirm duration, price and availability before making a booking.', 'I want to compare current services for a relaxing visit. Explain the choices and ask about any preferences before booking.', 'Help me prepare for an upcoming event using the current catalog. Suggest suitable options and ask for confirmation before any booking.'],
    context: ['{"visit_goal":"routine care","time_preference":"weekday morning","booking_status":"inquiry only"}', '{"visit_goal":"relaxation","time_preference":"weekday afternoon","booking_status":"inquiry only"}', '{"visit_goal":"event preparation","time_preference":"weekend morning","booking_status":"inquiry only"}'],
    preferences: ['{"priority":"service skills and availability","accessibility":"ask the client","selection":"recommend only"}', '{"priority":"consistent service quality","accessibility":"ask about accommodations","selection":"recommend only"}', '{"priority":"suitable preparation time","accessibility":"confirm client preferences","selection":"recommend only"}'],
    occasion: ['Routine self-care', 'Relaxation and recovery', 'Preparing for a celebration'], budget: ['100', '150', '200'],
    review_text: ['Fictional example review: The team explained the options clearly and the appointment started on time. I appreciated the friendly service.', 'Fictional example review: The service was helpful, but my appointment started later than expected. I would appreciate clearer updates.', 'Fictional example review: I am planning another visit and would like more guidance on choosing the right service.'],
    rating: ['5', '3', '4'], platform: ['Google', 'Yelp', 'Google'], tone: ['Warm and professional', 'Empathetic and constructive', 'Friendly and concise'],
    channel: ['sms', 'email', 'sms'], offer: ['Invite the client to browse current services; do not promise a discount.', 'Offer help finding a convenient appointment; confirm all pricing with the business.', 'Invite the client to discuss suitable options; do not send or book without approval.'],
    date: [localDate(today), localDate(future), localDate(future)], from: [localDate(from), localDate(from), localDate(from)], to: [localDate(today), localDate(today), localDate(today)],
    slot_start: [`${localDate(future)}T10:00`, `${localDate(future)}T14:00`, `${localDate(future)}T16:00`],
  }
  const values: Record<string, string> = {}, missing: string[] = []
  for (const field of fields) {
    const list = REFERENCE_LISTS[field.name]
    if (list) {
      const existing = current[field.name]
      const saved = references[list][index % Math.max(references[list].length, 1)]
      values[field.name] = existing && existing !== DEFAULT_SCOPE ? existing : saved ? String(saved.id) : field.required ? '' : DEFAULT_SCOPE
      if (!values[field.name]) missing.push(field.label)
    } else values[field.name] = text[field.name]?.[index] || ''
  }
  if (toolId === 'no-show-predict') {
    // The native appointment endpoint derives the actual linked client server-side.
    if (values.appointment_id && values.appointment_id !== DEFAULT_SCOPE && (!current.client_id || current.client_id === DEFAULT_SCOPE)) values.client_id = DEFAULT_SCOPE
    else if (!values.client_id || values.client_id === DEFAULT_SCOPE) missing.push('Saved appointment or client')
  }
  return { values, missing }
}
