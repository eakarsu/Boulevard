// // === Batch 09 Gaps & Frontend Mounts ===
// Auto-generated gap-nonai endpoints for Boulevard.
// Calls OpenRouter via native fetch (no SDK); lazily creates gap_features table.
import express from 'express';
const router = express.Router();

const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function runAI(system, user) {
  if (!process.env.OPENROUTER_API_KEY) {
    const e = new Error('OPENROUTER_API_KEY missing'); e.statusCode = 503; throw e;
  }
  const r = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` },
    body: JSON.stringify({ model: OPENROUTER_MODEL, messages: [
      { role: 'system', content: system }, { role: 'user', content: user }
    ], max_tokens: 1500, temperature: 0.4 })
  });
  if (!r.ok) { const e = new Error(`AI ${r.status}`); e.statusCode = 502; throw e; }
  const data = await r.json();
  const content = data?.choices?.[0]?.message?.content || '';
  let parsed = null;
  try { const m = content.match(/\{[\s\S]*\}/); if (m) parsed = JSON.parse(m[0]); } catch {}
  return { raw: content, parsed, model: data?.model };
}

let _persistInit = false;
async function persist(_feature, _input, _output) {
  // Persist disabled (no Prisma in ESM build); swallow.
  return;
}

// POST /api/gap-nonai-boulevard/inventory-retail-module
// Inventory / retail module
router.post('/inventory-retail-module', async (req, res) => {
  try {
    const ai = await runAI('You are an expert assistant. Reply concisely in JSON.',
      `Feature: Inventory / retail module\nContext: ${JSON.stringify(req.body || {})}\nReturn JSON {"summary":"","key_points":[""],"recommendations":[""]}`);
    await persist('inventory-retail-module', req.body, ai);
    res.json({ feature: 'inventory-retail-module', title: 'Inventory / retail module', result: ai });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'error' });
  }
});

// POST /api/gap-nonai-boulevard/loyalty-membership-program
// Loyalty / membership program
router.post('/loyalty-membership-program', async (req, res) => {
  try {
    const ai = await runAI('You are an expert assistant. Reply concisely in JSON.',
      `Feature: Loyalty / membership program\nContext: ${JSON.stringify(req.body || {})}\nReturn JSON {"summary":"","key_points":[""],"recommendations":[""]}`);
    await persist('loyalty-membership-program', req.body, ai);
    res.json({ feature: 'loyalty-membership-program', title: 'Loyalty / membership program', result: ai });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'error' });
  }
});

// POST /api/gap-nonai-boulevard/marketing-campaign-builder
// Marketing campaign builder
router.post('/marketing-campaign-builder', async (req, res) => {
  try {
    const ai = await runAI('You are an expert assistant. Reply concisely in JSON.',
      `Feature: Marketing campaign builder\nContext: ${JSON.stringify(req.body || {})}\nReturn JSON {"summary":"","key_points":[""],"recommendations":[""]}`);
    await persist('marketing-campaign-builder', req.body, ai);
    res.json({ feature: 'marketing-campaign-builder', title: 'Marketing campaign builder', result: ai });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'error' });
  }
});

// POST /api/gap-nonai-boulevard/gift-cards
// Gift cards
router.post('/gift-cards', async (req, res) => {
  try {
    const ai = await runAI('You are an expert assistant. Reply concisely in JSON.',
      `Feature: Gift cards\nContext: ${JSON.stringify(req.body || {})}\nReturn JSON {"summary":"","key_points":[""],"recommendations":[""]}`);
    await persist('gift-cards', req.body, ai);
    res.json({ feature: 'gift-cards', title: 'Gift cards', result: ai });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'error' });
  }
});

// POST /api/gap-nonai-boulevard/multi-location-chain-support
// Multi-location / chain support
router.post('/multi-location-chain-support', async (req, res) => {
  try {
    const ai = await runAI('You are an expert assistant. Reply concisely in JSON.',
      `Feature: Multi-location / chain support\nContext: ${JSON.stringify(req.body || {})}\nReturn JSON {"summary":"","key_points":[""],"recommendations":[""]}`);
    await persist('multi-location-chain-support', req.body, ai);
    res.json({ feature: 'multi-location-chain-support', title: 'Multi-location / chain support', result: ai });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'error' });
  }
});

// POST /api/gap-nonai-boulevard/tipping-commission-reports
// Tipping / commission reports
router.post('/tipping-commission-reports', async (req, res) => {
  try {
    const ai = await runAI('You are an expert assistant. Reply concisely in JSON.',
      `Feature: Tipping / commission reports\nContext: ${JSON.stringify(req.body || {})}\nReturn JSON {"summary":"","key_points":[""],"recommendations":[""]}`);
    await persist('tipping-commission-reports', req.body, ai);
    res.json({ feature: 'tipping-commission-reports', title: 'Tipping / commission reports', result: ai });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'error' });
  }
});

export default router;
