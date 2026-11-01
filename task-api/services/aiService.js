/**
 * Practical 13 - AI provider wrapper. Runs on the BACKEND only: the key never reaches the browser.
 * Supports OpenAI (default, per lab sheet) and Gemini. Only the task TITLE is sent to the
 * third party - never descriptions, e-mails, tokens or other user data.
 */
const OpenAI = require('openai');

const TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT_MS, 10) || 8000;
const PRIORITIES = ['low', 'medium', 'high'];

const PROMPT = (title) =>
  'You help users manage a to-do list. For the task title below, reply with ONLY a JSON object ' +
  '{"description": "<1-2 sentence practical task description>", "priority": "low|medium|high"}.\n' +
  `Task title: ${JSON.stringify(title)}`;

function provider() {
  if (process.env.AI_PROVIDER) return process.env.AI_PROVIDER.toLowerCase();
  return process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY ? 'gemini' : 'openai';
}

/** Turn the model's text into { description, priority }. Tolerates ```json fences. */
function parseSuggestion(text) {
  const cleaned = String(text || '').replace(/```json|```/gi, '').trim();
  let obj;
  try { obj = JSON.parse(cleaned); } catch { obj = { description: cleaned }; }
  const description = String(obj.description || '').trim().slice(0, 1000);
  const priority = PRIORITIES.includes(String(obj.priority).toLowerCase()) ? String(obj.priority).toLowerCase() : null;
  if (!description) throw new Error('Empty AI response');
  return { description, priority };
}

async function callOpenAI(title) {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not configured');
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
    timeout: TIMEOUT_MS,
    maxRetries: 0
  });
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [{ role: 'user', content: PROMPT(title) }],
    max_tokens: 200
  });
  return completion.choices[0].message.content;
}

async function callGemini(title) {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not configured');
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
    body: JSON.stringify({ contents: [{ parts: [{ text: PROMPT(title) }] }] }),
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text;
}

async function generateTaskSuggestion(title) {
  const text = provider() === 'gemini' ? await callGemini(title) : await callOpenAI(title);
  return parseSuggestion(text);
}

module.exports = { generateTaskSuggestion, parseSuggestion };
