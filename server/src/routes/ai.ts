import express from 'express'
import { query } from '../config/database.js'

const router = express.Router()

// ---------------------------------------------------------------------------
// OpenRouter helper
// ---------------------------------------------------------------------------
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const DEFAULT_MODEL = 'anthropic/claude-haiku-4.5'

interface OpenRouterResult {
  content: string
  model: string
  tokens: number | null
}

async function callOpenRouter(
  prompt: string,
  systemPrompt: string,
  model?: string
): Promise<OpenRouterResult> {
  const chosenModel = model || process.env.OPENROUTER_MODEL || DEFAULT_MODEL

  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not configured')
  }

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
      'X-Title': 'Boulevard Clone'
    },
    body: JSON.stringify({
      model: chosenModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: 3000
    })
  })

  const data: any = await response.json()
  if (data.error) {
    throw new Error(data.error.message || 'OpenRouter API error')
  }

  return {
    content: data.choices?.[0]?.message?.content ?? '',
    model: chosenModel,
    tokens: data.usage?.total_tokens ?? null
  }
}

// ---------------------------------------------------------------------------
// Result persistence (best-effort; never blocks the response)
// ---------------------------------------------------------------------------
async function ensureAiTable(): Promise<void> {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS ai_results (
        id SERIAL PRIMARY KEY,
        user_id TEXT,
        business_id TEXT,
        endpoint VARCHAR(100) NOT NULL,
        request_params JSONB,
        result_text TEXT NOT NULL,
        model_used VARCHAR(100),
        tokens_used INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)
  } catch (err: any) {
    console.error('ensureAiTable failed:', err?.message)
  }
}

ensureAiTable().catch((err) => console.error('AI table init error:', err?.message))

async function persistResult(
  req: any,
  endpoint: string,
  params: any,
  result: OpenRouterResult
): Promise<void> {
  try {
    await query(
      `INSERT INTO ai_results
         (user_id, business_id, endpoint, request_params, result_text, model_used, tokens_used)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.user?.id ?? null,
        req.user?.businessId ?? null,
        endpoint,
        JSON.stringify(params ?? {}),
        result.content,
        result.model,
        result.tokens
      ]
    )
  } catch (err: any) {
    console.error('Failed to persist AI result:', err?.message)
  }
}

function getBusinessIdOrError(req: any, res: any): string | null {
  if (!req.user) {
    res.status(401).json({ error: 'User not authenticated' })
    return null
  }
  const bid = req.user.businessId
  if (!bid) {
    res.status(400).json({ error: 'No business context for user' })
    return null
  }
  return bid
}

// ---------------------------------------------------------------------------
// GET /api/ai/history – past AI results for the current business
// ---------------------------------------------------------------------------
router.get('/history', async (req: any, res) => {
  try {
    const businessId = getBusinessIdOrError(req, res)
    if (!businessId) return

    const { endpoint, limit = 20, offset = 0 } = req.query
    const params: any[] = [businessId]
    let sql = `SELECT id, endpoint, request_params, result_text, model_used, tokens_used, created_at
               FROM ai_results WHERE business_id = $1`

    if (endpoint) {
      params.push(endpoint)
      sql += ` AND endpoint = $${params.length}`
    }
    params.push(Number(limit))
    params.push(Number(offset))
    sql += ` ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`

    const result = await query(sql, params)
    res.json({ data: result.rows })
  } catch (err: any) {
    console.error('AI history error:', err?.message)
    res.status(500).json({ error: 'Failed to fetch AI history' })
  }
})

// ---------------------------------------------------------------------------
// POST /api/ai/booking-assistant – chat-style help to draft a booking
// ---------------------------------------------------------------------------
router.post('/booking-assistant', async (req: any, res) => {
  try {
    const businessId = getBusinessIdOrError(req, res)
    if (!businessId) return

    const { message, context } = req.body ?? {}
    if (!message) {
      return res.status(400).json({ error: 'message is required' })
    }

    const services = await query(
      'SELECT name, category, duration_minutes, price FROM services WHERE business_id = $1 AND is_active = true LIMIT 50',
      [businessId]
    )

    const systemPrompt = `You are a friendly booking concierge for an appointment-based business
(Boulevard-style salon/spa/wellness platform). Use the available services list to suggest
options, durations and pricing. Be concise. If the user has not given enough info, ask one
clarifying question. Never invent services that are not in the list.`

    const userPrompt = `Services available (JSON):
${JSON.stringify(services.rows, null, 2)}

Caller context: ${context ? JSON.stringify(context) : '(none)'}
Caller message: ${message}`

    const result = await callOpenRouter(userPrompt, systemPrompt)
    await persistResult(req, 'booking-assistant', { message, context }, result)
    res.json({ reply: result.content, model: result.model, tokens: result.tokens })
  } catch (err: any) {
    console.error('booking-assistant error:', err?.message)
    res.status(500).json({ error: err?.message || 'AI request failed' })
  }
})

// ---------------------------------------------------------------------------
// POST /api/ai/no-show-predict – risk score & rationale for an appointment
// ---------------------------------------------------------------------------
router.post('/no-show-predict', async (req: any, res) => {
  try {
    const businessId = getBusinessIdOrError(req, res)
    if (!businessId) return

    const { appointment_id, client_id } = req.body ?? {}
    if (!appointment_id && !client_id) {
      return res.status(400).json({ error: 'appointment_id or client_id is required' })
    }

    let appt: any = null
    let history: any[] = []

    if (appointment_id) {
      const a = await query(
        `SELECT a.*, c.first_name, c.last_name, s.name AS service_name
         FROM appointments a
         LEFT JOIN clients c ON c.id = a.client_id
         LEFT JOIN services s ON s.id = a.service_id
         WHERE a.id = $1 AND a.business_id = $2`,
        [appointment_id, businessId]
      )
      appt = a.rows[0] ?? null
    }

    const cid = client_id ?? appt?.client_id
    if (cid) {
      const h = await query(
        `SELECT id, status, start_time
         FROM appointments
         WHERE business_id = $1 AND client_id = $2
         ORDER BY start_time DESC LIMIT 25`,
        [businessId, cid]
      )
      history = h.rows
    }

    const systemPrompt = `You are a no-show risk analyst for a salon/spa appointment system.
Return STRICT JSON: { "risk": "low"|"medium"|"high", "score": 0-100, "reasons": [string],
"mitigations": [string] }. Base it on the client's appointment history (cancellations,
no-shows, last-minute changes, frequency, service value).`

    const userPrompt = `Appointment: ${JSON.stringify(appt)}
Recent history: ${JSON.stringify(history)}`

    const result = await callOpenRouter(userPrompt, systemPrompt)
    await persistResult(req, 'no-show-predict', { appointment_id, client_id }, result)
    res.json({ analysis: result.content, model: result.model, tokens: result.tokens })
  } catch (err: any) {
    console.error('no-show-predict error:', err?.message)
    res.status(500).json({ error: err?.message || 'AI request failed' })
  }
})

// ---------------------------------------------------------------------------
// POST /api/ai/staff-match – suggest the best staff member for a service
// ---------------------------------------------------------------------------
router.post('/staff-match', async (req: any, res) => {
  try {
    const businessId = getBusinessIdOrError(req, res)
    if (!businessId) return

    const { service_id, client_id, preferences } = req.body ?? {}
    if (!service_id) {
      return res.status(400).json({ error: 'service_id is required' })
    }

    const svc = await query(
      'SELECT * FROM services WHERE id = $1 AND business_id = $2',
      [service_id, businessId]
    )
    const staff = await query(
      `SELECT s.*, u.first_name, u.last_name
       FROM staff s LEFT JOIN users u ON u.id = s.user_id
       WHERE s.business_id = $1 AND s.is_active = true`,
      [businessId]
    )

    const systemPrompt = `You match clients to the best staff member for a requested service.
Score each candidate 0-100 using: skills match, commission/cost, prior client history (if
provided), and stated preferences. Return STRICT JSON:
{ "ranked": [ { "staff_id": string, "name": string, "score": number, "why": string } ] }`

    const userPrompt = `Service: ${JSON.stringify(svc.rows[0] ?? null)}
Staff candidates: ${JSON.stringify(staff.rows)}
Client id: ${client_id ?? '(none)'}
Preferences: ${JSON.stringify(preferences ?? {})}`

    const result = await callOpenRouter(userPrompt, systemPrompt)
    await persistResult(req, 'staff-match', { service_id, client_id, preferences }, result)
    res.json({ ranking: result.content, model: result.model, tokens: result.tokens })
  } catch (err: any) {
    console.error('staff-match error:', err?.message)
    res.status(500).json({ error: err?.message || 'AI request failed' })
  }
})

// ---------------------------------------------------------------------------
// POST /api/ai/service-recommend – upsell-aware service suggestions for a client
// ---------------------------------------------------------------------------
router.post('/service-recommend', async (req: any, res) => {
  try {
    const businessId = getBusinessIdOrError(req, res)
    if (!businessId) return

    const { client_id, occasion, budget } = req.body ?? {}
    if (!client_id) {
      return res.status(400).json({ error: 'client_id is required' })
    }

    const client = await query(
      'SELECT id, first_name, last_name, notes FROM clients WHERE id = $1 AND business_id = $2',
      [client_id, businessId]
    )
    const visits = await query(
      `SELECT a.start_time, s.name AS service_name, s.category, s.price
       FROM appointments a LEFT JOIN services s ON s.id = a.service_id
       WHERE a.business_id = $1 AND a.client_id = $2
       ORDER BY a.start_time DESC LIMIT 30`,
      [businessId, client_id]
    )
    const catalog = await query(
      `SELECT id, name, category, duration_minutes, price
       FROM services WHERE business_id = $1 AND is_active = true LIMIT 80`,
      [businessId]
    )

    const systemPrompt = `You recommend services from a salon/spa catalog to an existing client.
Avoid services they recently received unless explicitly relevant. Respect the budget if given.
Return STRICT JSON: { "recommendations": [ { "service_id": string, "name": string,
"reason": string, "estimated_price": number } ] }`

    const userPrompt = `Client: ${JSON.stringify(client.rows[0] ?? null)}
Visit history: ${JSON.stringify(visits.rows)}
Catalog: ${JSON.stringify(catalog.rows)}
Occasion: ${occasion ?? '(none)'}
Budget: ${budget ?? '(none)'}`

    const result = await callOpenRouter(userPrompt, systemPrompt)
    await persistResult(req, 'service-recommend', { client_id, occasion, budget }, result)
    res.json({ recommendations: result.content, model: result.model, tokens: result.tokens })
  } catch (err: any) {
    console.error('service-recommend error:', err?.message)
    res.status(500).json({ error: err?.message || 'AI request failed' })
  }
})

// ---------------------------------------------------------------------------
// POST /api/ai/schedule-optimizer – suggest reorderings for a daily schedule
// ---------------------------------------------------------------------------
router.post('/schedule-optimizer', async (req: any, res) => {
  try {
    const businessId = getBusinessIdOrError(req, res)
    if (!businessId) return

    const { date, staff_id } = req.body ?? {}
    if (!date) {
      return res.status(400).json({ error: 'date (YYYY-MM-DD) is required' })
    }

    const params: any[] = [businessId, date]
    let sql = `SELECT a.*, c.first_name, c.last_name, s.name AS service_name,
                       s.duration_minutes, s.price
               FROM appointments a
               LEFT JOIN clients c ON c.id = a.client_id
               LEFT JOIN services s ON s.id = a.service_id
               WHERE a.business_id = $1
                 AND DATE(a.start_time) = $2`
    if (staff_id) {
      params.push(staff_id)
      sql += ` AND a.staff_id = $${params.length}`
    }
    sql += ' ORDER BY a.start_time'

    const appts = await query(sql, params)

    const systemPrompt = `You optimize a single-day appointment schedule for a salon/spa.
Identify gaps, overbookings, double-bookings and suggest swaps that minimize idle time and
walk-out risk. Keep client preferences and service durations intact. Return STRICT JSON:
{ "issues": [string], "suggestions": [ { "appointment_id": string, "action": string,
"new_start": string|null, "rationale": string } ], "summary": string }`

    const userPrompt = `Date: ${date}
Appointments: ${JSON.stringify(appts.rows)}`

    const result = await callOpenRouter(userPrompt, systemPrompt)
    await persistResult(req, 'schedule-optimizer', { date, staff_id }, result)
    res.json({ plan: result.content, model: result.model, tokens: result.tokens })
  } catch (err: any) {
    console.error('schedule-optimizer error:', err?.message)
    res.status(500).json({ error: err?.message || 'AI request failed' })
  }
})

// ---------------------------------------------------------------------------
// POST /api/ai/client-insights – narrative insights about a client
// ---------------------------------------------------------------------------
router.post('/client-insights', async (req: any, res) => {
  try {
    const businessId = getBusinessIdOrError(req, res)
    if (!businessId) return

    const { client_id } = req.body ?? {}
    if (!client_id) {
      return res.status(400).json({ error: 'client_id is required' })
    }

    const client = await query(
      'SELECT * FROM clients WHERE id = $1 AND business_id = $2',
      [client_id, businessId]
    )
    const appts = await query(
      `SELECT a.id, a.status, a.start_time, s.name AS service_name, s.price
       FROM appointments a LEFT JOIN services s ON s.id = a.service_id
       WHERE a.business_id = $1 AND a.client_id = $2
       ORDER BY a.start_time DESC LIMIT 50`,
      [businessId, client_id]
    )

    const systemPrompt = `You produce front-desk-friendly insights about a salon/spa client.
Cover: visit cadence, lifetime value estimate, favorite services, possible churn risk, and
two concrete next-best actions. Plain markdown, max 250 words.`

    const userPrompt = `Client: ${JSON.stringify(client.rows[0] ?? null)}
Appointments: ${JSON.stringify(appts.rows)}`

    const result = await callOpenRouter(userPrompt, systemPrompt)
    await persistResult(req, 'client-insights', { client_id }, result)
    res.json({ insights: result.content, model: result.model, tokens: result.tokens })
  } catch (err: any) {
    console.error('client-insights error:', err?.message)
    res.status(500).json({ error: err?.message || 'AI request failed' })
  }
})

// ---------------------------------------------------------------------------
// POST /api/ai/upsell-suggestions – at-checkout upsell ideas for an appointment
// ---------------------------------------------------------------------------
router.post('/upsell-suggestions', async (req: any, res) => {
  try {
    const businessId = getBusinessIdOrError(req, res)
    if (!businessId) return

    const { appointment_id } = req.body ?? {}
    if (!appointment_id) {
      return res.status(400).json({ error: 'appointment_id is required' })
    }

    const appt = await query(
      `SELECT a.*, c.first_name, c.last_name, s.name AS service_name, s.category, s.price
       FROM appointments a
       LEFT JOIN clients c ON c.id = a.client_id
       LEFT JOIN services s ON s.id = a.service_id
       WHERE a.id = $1 AND a.business_id = $2`,
      [appointment_id, businessId]
    )
    const catalog = await query(
      `SELECT id, name, category, duration_minutes, price
       FROM services WHERE business_id = $1 AND is_active = true LIMIT 80`,
      [businessId]
    )

    const systemPrompt = `Suggest at most 3 in-context upsells (add-ons or product retail) for
a salon/spa appointment about to check out. Stay relevant to the booked service. Return
STRICT JSON: { "upsells": [ { "name": string, "kind": "addon"|"product"|"upgrade",
"price_estimate": number, "pitch": string } ] }`

    const userPrompt = `Appointment: ${JSON.stringify(appt.rows[0] ?? null)}
Catalog: ${JSON.stringify(catalog.rows)}`

    const result = await callOpenRouter(userPrompt, systemPrompt)
    await persistResult(req, 'upsell-suggestions', { appointment_id }, result)
    res.json({ upsells: result.content, model: result.model, tokens: result.tokens })
  } catch (err: any) {
    console.error('upsell-suggestions error:', err?.message)
    res.status(500).json({ error: err?.message || 'AI request failed' })
  }
})

// ---------------------------------------------------------------------------
// POST /api/ai/review-response – draft a reply to an online review
// ---------------------------------------------------------------------------
router.post('/review-response', async (req: any, res) => {
  try {
    const businessId = getBusinessIdOrError(req, res)
    if (!businessId) return

    const { review_text, rating, platform, tone } = req.body ?? {}
    if (!review_text) {
      return res.status(400).json({ error: 'review_text is required' })
    }

    const biz = await query('SELECT name FROM businesses WHERE id = $1', [businessId])
    const business_name = biz.rows[0]?.name ?? 'Our team'

    const systemPrompt = `You draft public responses to client reviews of a salon/spa. Match
the requested tone (default: warm, professional). Acknowledge specifics. Never make
unverifiable claims. Sign as the business name provided. Output a single response, no
markdown header.`

    const userPrompt = `Business: ${business_name}
Platform: ${platform ?? 'Google'}
Rating: ${rating ?? 'unknown'}/5
Tone: ${tone ?? 'warm, professional'}
Review: ${review_text}`

    const result = await callOpenRouter(userPrompt, systemPrompt)
    await persistResult(req, 'review-response', { rating, platform, tone }, result)
    res.json({ reply: result.content, model: result.model, tokens: result.tokens })
  } catch (err: any) {
    console.error('review-response error:', err?.message)
    res.status(500).json({ error: err?.message || 'AI request failed' })
  }
})

// ---------------------------------------------------------------------------
// POST /api/ai/reactivation-message – win-back outreach for a lapsed client
// ---------------------------------------------------------------------------
router.post('/reactivation-message', async (req: any, res) => {
  try {
    const businessId = getBusinessIdOrError(req, res)
    if (!businessId) return

    const { client_id, channel, offer } = req.body ?? {}
    if (!client_id) {
      return res.status(400).json({ error: 'client_id is required' })
    }

    const client = await query(
      'SELECT id, first_name, last_name, email, phone FROM clients WHERE id = $1 AND business_id = $2',
      [client_id, businessId]
    )
    const lastVisit = await query(
      `SELECT a.start_time, s.name AS service_name
       FROM appointments a LEFT JOIN services s ON s.id = a.service_id
       WHERE a.business_id = $1 AND a.client_id = $2 AND a.status = 'completed'
       ORDER BY a.start_time DESC LIMIT 1`,
      [businessId, client_id]
    )

    const systemPrompt = `Write a short reactivation message for a lapsed salon/spa client.
Use the channel (sms or email). For sms keep <=160 chars. Reference their last service if
provided. Include the offer. Friendly, not pushy. Output ONLY the message body.`

    const userPrompt = `Client: ${JSON.stringify(client.rows[0] ?? null)}
Last visit: ${JSON.stringify(lastVisit.rows[0] ?? null)}
Channel: ${channel ?? 'sms'}
Offer: ${offer ?? '15% off your next visit'}`

    const result = await callOpenRouter(userPrompt, systemPrompt)
    await persistResult(req, 'reactivation-message', { client_id, channel, offer }, result)
    res.json({ message: result.content, model: result.model, tokens: result.tokens })
  } catch (err: any) {
    console.error('reactivation-message error:', err?.message)
    res.status(500).json({ error: err?.message || 'AI request failed' })
  }
})

// ---------------------------------------------------------------------------
// POST /api/ai/revenue-forecast – narrative forecast over a date range
// ---------------------------------------------------------------------------
router.post('/revenue-forecast', async (req: any, res) => {
  try {
    const businessId = getBusinessIdOrError(req, res)
    if (!businessId) return

    const { from, to } = req.body ?? {}
    if (!from || !to) {
      return res.status(400).json({ error: 'from and to (YYYY-MM-DD) are required' })
    }

    const upcoming = await query(
      `SELECT s.category, COUNT(*) AS booked, COALESCE(SUM(s.price),0) AS gross
       FROM appointments a LEFT JOIN services s ON s.id = a.service_id
       WHERE a.business_id = $1
         AND a.start_time >= $2::date
         AND a.start_time <  ($3::date + INTERVAL '1 day')
         AND a.status IN ('scheduled','confirmed')
       GROUP BY s.category`,
      [businessId, from, to]
    )
    const trailing = await query(
      `SELECT DATE_TRUNC('week', a.start_time) AS week,
              COALESCE(SUM(s.price),0) AS gross
       FROM appointments a LEFT JOIN services s ON s.id = a.service_id
       WHERE a.business_id = $1
         AND a.status = 'completed'
         AND a.start_time >= NOW() - INTERVAL '12 weeks'
       GROUP BY 1 ORDER BY 1`,
      [businessId]
    )

    const systemPrompt = `Produce a short revenue forecast narrative for a salon/spa, based on
already-booked appointments (the "pipeline") and the trailing 12-week completion trend. Call
out top categories, gaps, and one risk. Plain markdown, max 200 words.`

    const userPrompt = `Forecast window: ${from} to ${to}
Pipeline by category: ${JSON.stringify(upcoming.rows)}
Trailing 12-week revenue: ${JSON.stringify(trailing.rows)}`

    const result = await callOpenRouter(userPrompt, systemPrompt)
    await persistResult(req, 'revenue-forecast', { from, to }, result)
    res.json({ forecast: result.content, model: result.model, tokens: result.tokens })
  } catch (err: any) {
    console.error('revenue-forecast error:', err?.message)
    res.status(500).json({ error: err?.message || 'AI request failed' })
  }
})

// ---------------------------------------------------------------------------
// POST /api/ai/waitlist-intelligence – who to call from waitlist for a slot
// ---------------------------------------------------------------------------
router.post('/waitlist-intelligence', async (req: any, res) => {
  try {
    const businessId = getBusinessIdOrError(req, res)
    if (!businessId) return

    const { service_id, slot_start, staff_id } = req.body ?? {}
    if (!slot_start) {
      return res.status(400).json({ error: 'slot_start (ISO datetime) is required' })
    }

    let waitlist: any[] = []
    try {
      const w = await query(
        `SELECT w.*, c.first_name, c.last_name, c.phone, c.email
         FROM waitlist w LEFT JOIN clients c ON c.id = w.client_id
         WHERE w.business_id = $1 AND COALESCE(w.status,'open') = 'open'
         LIMIT 100`,
        [businessId]
      )
      waitlist = w.rows
    } catch {
      // waitlist table may not exist; fall back to empty list
      waitlist = []
    }

    let svc: any = null
    if (service_id) {
      const s = await query(
        'SELECT * FROM services WHERE id = $1 AND business_id = $2',
        [service_id, businessId]
      )
      svc = s.rows[0] ?? null
    }

    const systemPrompt = `Rank waitlisted clients for a newly-open salon/spa slot. Prioritize:
service match, recency of request, scheduling flexibility, and preferred staff. Return
STRICT JSON: { "ranked": [ { "client_id": string, "name": string, "score": number,
"contact_channel": "sms"|"email"|"call", "why": string } ] }`

    const userPrompt = `Open slot: ${slot_start}, staff: ${staff_id ?? 'any'}
Service: ${JSON.stringify(svc)}
Waitlist: ${JSON.stringify(waitlist)}`

    const result = await callOpenRouter(userPrompt, systemPrompt)
    await persistResult(req, 'waitlist-intelligence', { service_id, slot_start, staff_id }, result)
    res.json({ ranking: result.content, model: result.model, tokens: result.tokens })
  } catch (err: any) {
    console.error('waitlist-intelligence error:', err?.message)
    res.status(500).json({ error: err?.message || 'AI request failed' })
  }
})

export default router
