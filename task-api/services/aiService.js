// services/aiService.js - Practical 13: provider selection, prompt and response parsing
const OpenAI = require('openai');

async function generateTaskSuggestion(title) {
  const timeoutMs = parseInt(process.env.AI_TIMEOUT_MS, 10) || 8000;

  if (!process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
    throw new Error('No AI provider API key configured');
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: timeoutMs
  });

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: 'You are a task management assistant. Output valid JSON with "description" and "priority" ("low", "medium", or "high").'
      },
      {
        role: 'user',
        content: `Suggest a description and priority for this task: "${title}"`
      }
    ]
  });

  try {
    return JSON.parse(response.choices[0].message.content);
  } catch {
    return {
      description: response.choices[0].message.content,
      priority: 'medium'
    };
  }
}

module.exports = { generateTaskSuggestion };

