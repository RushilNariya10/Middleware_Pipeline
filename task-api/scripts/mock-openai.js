/**
 * TEST DOUBLE - NOT the real OpenAI. Mimics POST /v1/chat/completions so the success path of
 * Practical 13 can be exercised offline (OPENAI_BASE_URL=http://127.0.0.1:4010/v1).
 */
const http = require('http');
http.createServer((req, res) => {
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    const title = (body.match(/Task title: \\"(.*?)\\"/) || [])[1] || 'task';
    const content = JSON.stringify({
      description: `Break "${title}" into small steps, set a deadline and review the result when finished.`,
      priority: /exam|deadline|urgent|viva|submit/i.test(title) ? 'high' : 'medium'
    });
    setTimeout(() => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ id: 'mock', object: 'chat.completion', choices: [{ index: 0, message: { role: 'assistant', content }, finish_reason: 'stop' }] }));
    }, parseInt(process.env.MOCK_DELAY_MS, 10) || 0);
  });
}).listen(4010, '127.0.0.1', () => console.log('MOCK OpenAI (test double) on http://127.0.0.1:4010/v1'));
