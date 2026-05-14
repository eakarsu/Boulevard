import React, { useState } from 'react'
import { Sparkles, Loader2, AlertCircle } from 'lucide-react'
import api from '../services/api'

// AI tool registry — one entry per /api/ai endpoint exposed by the backend.
type ToolField = {
  name: string
  label: string
  type?: 'text' | 'textarea' | 'date' | 'datetime-local' | 'number'
  placeholder?: string
  required?: boolean
}

type Tool = {
  id: string
  path: string
  title: string
  description: string
  resultKey: string
  fields: ToolField[]
}

const TOOLS: Tool[] = [
  {
    id: 'booking-assistant',
    path: '/ai/booking-assistant',
    title: 'Booking Assistant',
    description: 'Chat-style booking concierge using your live service catalog.',
    resultKey: 'reply',
    fields: [
      { name: 'message', label: 'Message', type: 'textarea', placeholder: 'I need a haircut on Saturday afternoon', required: true },
      { name: 'context', label: 'Context (optional, JSON)', type: 'textarea', placeholder: '{"client_id":"..."}' },
    ],
  },
  {
    id: 'no-show-predict',
    path: '/ai/no-show-predict',
    title: 'No-Show Prediction',
    description: 'Risk score & mitigations for an appointment or client.',
    resultKey: 'analysis',
    fields: [
      { name: 'appointment_id', label: 'Appointment ID', placeholder: 'uuid (optional if client_id given)' },
      { name: 'client_id', label: 'Client ID', placeholder: 'uuid (optional if appointment_id given)' },
    ],
  },
  {
    id: 'staff-match',
    path: '/ai/staff-match',
    title: 'Staff Match',
    description: 'Rank staff for a requested service + client.',
    resultKey: 'ranking',
    fields: [
      { name: 'service_id', label: 'Service ID', required: true },
      { name: 'client_id', label: 'Client ID' },
      { name: 'preferences', label: 'Preferences (JSON)', type: 'textarea', placeholder: '{"prefers_female":true}' },
    ],
  },
  {
    id: 'service-recommend',
    path: '/ai/service-recommend',
    title: 'Service Recommendations',
    description: 'Upsell-aware service suggestions for a client.',
    resultKey: 'recommendations',
    fields: [
      { name: 'client_id', label: 'Client ID', required: true },
      { name: 'occasion', label: 'Occasion', placeholder: 'wedding, birthday, ...' },
      { name: 'budget', label: 'Budget', type: 'number', placeholder: '150' },
    ],
  },
  {
    id: 'schedule-optimizer',
    path: '/ai/schedule-optimizer',
    title: 'Schedule Optimizer',
    description: 'Find gaps / overbookings for a day.',
    resultKey: 'analysis',
    fields: [
      { name: 'date', label: 'Date (YYYY-MM-DD)', type: 'date', required: true },
      { name: 'staff_id', label: 'Staff ID (optional)' },
    ],
  },
  {
    id: 'client-insights',
    path: '/ai/client-insights',
    title: 'Client Insights',
    description: 'Narrative profile for a client.',
    resultKey: 'insights',
    fields: [
      { name: 'client_id', label: 'Client ID', required: true },
    ],
  },
  {
    id: 'upsell-suggestions',
    path: '/ai/upsell-suggestions',
    title: 'Upsell Suggestions',
    description: 'At-checkout upsells for an appointment.',
    resultKey: 'upsells',
    fields: [
      { name: 'appointment_id', label: 'Appointment ID', required: true },
    ],
  },
  {
    id: 'review-response',
    path: '/ai/review-response',
    title: 'Review Response',
    description: 'Draft a public response to a review.',
    resultKey: 'reply',
    fields: [
      { name: 'review_text', label: 'Review text', type: 'textarea', required: true },
      { name: 'rating', label: 'Rating (1-5)', type: 'number' },
      { name: 'platform', label: 'Platform', placeholder: 'Google, Yelp ...' },
      { name: 'tone', label: 'Tone', placeholder: 'warm, professional' },
    ],
  },
  {
    id: 'reactivation-message',
    path: '/ai/reactivation-message',
    title: 'Reactivation Message',
    description: 'SMS/email win-back for a lapsed client.',
    resultKey: 'message',
    fields: [
      { name: 'client_id', label: 'Client ID', required: true },
      { name: 'channel', label: 'Channel (sms or email)', placeholder: 'sms' },
      { name: 'offer', label: 'Offer', placeholder: '15% off your next visit' },
    ],
  },
  {
    id: 'revenue-forecast',
    path: '/ai/revenue-forecast',
    title: 'Revenue Forecast',
    description: 'Narrative forecast over a date range.',
    resultKey: 'forecast',
    fields: [
      { name: 'from', label: 'From (YYYY-MM-DD)', type: 'date', required: true },
      { name: 'to', label: 'To (YYYY-MM-DD)', type: 'date', required: true },
    ],
  },
  {
    id: 'waitlist-intelligence',
    path: '/ai/waitlist-intelligence',
    title: 'Waitlist Intelligence',
    description: 'Rank waitlist clients for a freed slot.',
    resultKey: 'ranking',
    fields: [
      { name: 'slot_start', label: 'Slot start (ISO datetime)', type: 'datetime-local', required: true },
      { name: 'service_id', label: 'Service ID' },
      { name: 'staff_id', label: 'Staff ID' },
    ],
  },
]

function parseMaybeJson(value: string): any {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed)
    } catch {
      return value
    }
  }
  return value
}

function buildPayload(tool: Tool, formState: Record<string, string>): Record<string, any> {
  const out: Record<string, any> = {}
  tool.fields.forEach((f) => {
    const v = formState[f.name]
    if (v === undefined || v === '') return
    if (f.type === 'number') {
      const n = Number(v)
      if (!Number.isNaN(n)) out[f.name] = n
      return
    }
    if (f.type === 'textarea' && (f.name === 'context' || f.name === 'preferences')) {
      const parsed = parseMaybeJson(v)
      if (parsed !== undefined) out[f.name] = parsed
      return
    }
    out[f.name] = v
  })
  return out
}

export default function AITools() {
  const [selected, setSelected] = useState<Tool>(TOOLS[0])
  const [formState, setFormState] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<any[] | null>(null)

  const updateField = (name: string, value: string) => {
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  const selectTool = (tool: Tool) => {
    setSelected(tool)
    setFormState({})
    setResult(null)
    setError(null)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    // Validate required fields client-side.
    for (const f of selected.fields) {
      if (f.required && !formState[f.name]) {
        setError(`Field "${f.label}" is required.`)
        setLoading(false)
        return
      }
    }

    try {
      const payload = buildPayload(selected, formState)
      const { data } = await api.post(selected.path, payload)
      setResult(data)
    } catch (err: any) {
      const status = err?.response?.status
      const msg = err?.response?.data?.error || err?.message || 'Request failed'
      if (status === 503 || /OPENROUTER_API_KEY/i.test(msg)) {
        setError(
          'AI is not configured on the server. Set OPENROUTER_API_KEY in the backend environment and restart.'
        )
      } else if (status === 401) {
        setError('Not authenticated. Please log in again.')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const loadHistory = async () => {
    try {
      const { data } = await api.get('/ai/history')
      setHistory(Array.isArray(data) ? data : data?.results || [])
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to load history')
    }
  }

  const renderResult = () => {
    if (!result) return null
    const primary = result?.[selected.resultKey]
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Result</h3>
        {primary ? (
          typeof primary === 'string' ? (
            <pre className="whitespace-pre-wrap text-sm text-gray-800 bg-gray-50 p-4 rounded border border-gray-200">
              {primary}
            </pre>
          ) : (
            <pre className="text-xs text-gray-800 bg-gray-50 p-4 rounded border border-gray-200 overflow-x-auto">
              {JSON.stringify(primary, null, 2)}
            </pre>
          )
        ) : (
          <pre className="text-xs text-gray-800 bg-gray-50 p-4 rounded border border-gray-200 overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
        {result?.model && (
          <p className="mt-3 text-xs text-gray-500">
            Model: {result.model}
            {result.tokens != null ? ` · ${result.tokens} tokens` : ''}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-purple-600" />
        <h1 className="text-2xl font-bold text-gray-900">AI Tools</h1>
      </div>
      <p className="text-sm text-gray-600">
        Operational AI helpers backed by <code>/api/ai</code>. Requires{' '}
        <code>OPENROUTER_API_KEY</code> in the backend environment.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tool list */}
        <div className="lg:col-span-1 bg-white shadow rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Tools
          </h2>
          <ul className="space-y-1">
            {TOOLS.map((tool) => (
              <li key={tool.id}>
                <button
                  type="button"
                  onClick={() => selectTool(tool)}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                    selected.id === tool.id
                      ? 'bg-purple-50 text-purple-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tool.title}
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={loadHistory}
            className="mt-4 w-full text-xs text-gray-600 hover:text-gray-900 border border-gray-200 rounded px-3 py-2"
          >
            Load recent AI history
          </button>
        </div>

        {/* Form + result */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900">{selected.title}</h2>
            <p className="text-sm text-gray-600 mb-4">{selected.description}</p>
            <form onSubmit={submit} className="space-y-4">
              {selected.fields.map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      value={formState[field.name] || ''}
                      onChange={(e) => updateField(field.name, e.target.value)}
                      placeholder={field.placeholder}
                      rows={4}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  ) : (
                    <input
                      type={field.type || 'text'}
                      value={formState[field.name] || ''}
                      onChange={(e) => updateField(field.name, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  )}
                </div>
              ))}
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Running...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" /> Run
                  </>
                )}
              </button>
            </form>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          {renderResult()}

          {history && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent AI history</h3>
              {history.length === 0 ? (
                <p className="text-sm text-gray-500">No history yet.</p>
              ) : (
                <ul className="space-y-2 text-sm text-gray-700">
                  {history.slice(0, 25).map((h: any, i: number) => (
                    <li key={i} className="border-b border-gray-100 pb-2">
                      <span className="font-medium">{h.endpoint || h.kind || 'entry'}</span>
                      {h.created_at && (
                        <span className="text-gray-500 ml-2">
                          {new Date(h.created_at).toLocaleString()}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
