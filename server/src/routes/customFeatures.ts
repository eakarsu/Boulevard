// Custom feature endpoints (batch_09 audit suggestions)
import express from 'express'
import { query } from '../config/database.js'

const router = express.Router()

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5'

async function callLLM(system: string, user: string, maxTokens = 1500, temperature = 0.4) {
  if (!process.env.OPENROUTER_API_KEY) {
    const e: any = new Error('OPENROUTER_API_KEY not configured'); e.statusCode = 503; throw e
  }
  const r = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
      'X-Title': 'Boulevard Clone'
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      max_tokens: maxTokens,
      temperature
    })
  })
  const data: any = await r.json()
  return { content: data?.choices?.[0]?.message?.content || '', model: data?.model }
}

function parseJSON(t: string) {
  if (!t) return null
  const c = t.replace(/```(?:json)?/gi, '').replace(/```/g, '')
  const m = c.match(/\{[\s\S]*\}/)
  if (!m) return null
  try { return JSON.parse(m[0]) } catch { return null }
}

function err(res: any, e: any, label: string) {
  if (e.statusCode === 503) return res.status(503).json({ error: e.message })
  console.error(`${label} error:`, e.message)
  res.status(500).json({ error: e.message })
}

// 1. Computer-vision check-in via kiosk camera
// TODO: configure credentials for KIOSK_VISION_API_KEY (Rekognition/Custom CV).
router.post('/kiosk-checkin', async (req, res) => {
  try {
    const { kiosk_id, image_caption, recognized_face_token } = req.body || {}
    if (!kiosk_id) return res.status(400).json({ error: 'kiosk_id required' })
    const ai = await callLLM(
      `You produce a kiosk check-in decision. Vision API configured: ${Boolean(process.env.KIOSK_VISION_API_KEY)}. JSON only.`,
      `KIOSK: ${kiosk_id}\nIMG_CAPTION: ${image_caption || 'n/a'}\nFACE_TOKEN: ${recognized_face_token || 'unmatched'}\nReturn JSON {"matched_client_id":"","confidence":0,"next_appointment":"","fallback_prompt":""}`
    )
    res.json({ type: 'kiosk-checkin', result: parseJSON(ai.content) || { raw: ai.content }, model: ai.model })
  } catch (e: any) { err(res, e, 'kiosk-checkin') }
})

// 2. Predictive ad spend on lapsed clients
router.post('/lapsed-ad-spend', async (req, res) => {
  try {
    const { days_since_last_visit_min = 60, budget_usd } = req.body || {}
    const lapsed = await query(
      `SELECT id, first_name, last_name, email, created_at FROM clients
       WHERE id NOT IN (SELECT DISTINCT client_id FROM appointments WHERE start_time > NOW() - INTERVAL '${Number(days_since_last_visit_min)} days')
       LIMIT 50`
    ).catch(() => ({ rows: [] as any[] }))
    const ai = await callLLM(
      'You allocate paid-ad budget across lapsed client segments and propose creative angles. JSON only.',
      `LAPSED_SAMPLE: ${JSON.stringify(lapsed.rows.slice(0, 30))}\nBUDGET_USD: ${budget_usd || 500}\nReturn JSON {"segments":[{"name":"","client_count":0,"recommended_spend_usd":0,"creative_angle":""}],"expected_recovery_count":0,"top_segment":""}`
    )
    res.json({ type: 'lapsed-ad-spend', lapsed_considered: lapsed.rows.length, result: parseJSON(ai.content) || { raw: ai.content }, model: ai.model })
  } catch (e: any) { err(res, e, 'lapsed-ad-spend') }
})

// 3. Therapist-client compatibility scoring
router.post('/therapist-compatibility', async (req, res) => {
  try {
    const { client_id, candidate_staff_ids } = req.body || {}
    if (!client_id) return res.status(400).json({ error: 'client_id required' })
    let staffRows: any[] = []
    if (Array.isArray(candidate_staff_ids) && candidate_staff_ids.length) {
      const r = await query(`SELECT id, full_name, specialties, rating FROM staff WHERE id = ANY($1::uuid[])`, [candidate_staff_ids]).catch(() => ({ rows: [] }))
      staffRows = (r as any).rows
    } else {
      const r = await query(`SELECT id, full_name, specialties, rating FROM staff WHERE is_active = true LIMIT 20`).catch(() => ({ rows: [] }))
      staffRows = (r as any).rows
    }
    const ai = await callLLM(
      'You score therapist-client compatibility for a salon visit. JSON only.',
      `CLIENT_ID: ${client_id}\nSTAFF_POOL: ${JSON.stringify(staffRows)}\nReturn JSON {"ranked":[{"staff_id":"","name":"","compatibility":0,"why":""}],"top_pick":""}`
    )
    res.json({ type: 'therapist-compatibility', result: parseJSON(ai.content) || { raw: ai.content }, model: ai.model })
  } catch (e: any) { err(res, e, 'therapist-compatibility') }
})

// 4. POS hardware integration helper
// TODO: configure credentials for POS_VENDOR_API_KEY.
router.post('/pos-hardware', async (req, res) => {
  try {
    const { action, terminal_id, problem } = req.body || {}
    if (!action) return res.status(400).json({ error: 'action required (pair|diagnose|optimize)' })
    const ai = await callLLM(
      `You help a salon owner with POS terminal pairing/diagnostics. Vendor API: ${Boolean(process.env.POS_VENDOR_API_KEY)}. JSON only.`,
      `ACTION: ${action}\nTERMINAL: ${terminal_id || 'unassigned'}\nPROBLEM: ${problem || 'n/a'}\nReturn JSON {"steps":[""],"warnings":[""],"requires_vendor_call":false,"estimated_minutes":0}`
    )
    res.json({ type: 'pos-hardware', vendor_configured: Boolean(process.env.POS_VENDOR_API_KEY), result: parseJSON(ai.content) || { raw: ai.content }, model: ai.model })
  } catch (e: any) { err(res, e, 'pos-hardware') }
})

export default router
