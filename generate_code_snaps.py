import os
from PIL import Image, ImageDraw, ImageFont

def render_code_to_image(title, code_str, output_path, max_lines=50):
    lines = code_str.strip().split('\n')[:max_lines]
    
    font = None
    title_font = None
    for font_name in ['consola.ttf', 'cour.ttf', 'arial.ttf']:
        try:
            font = ImageFont.truetype(font_name, 15)
            title_font = ImageFont.truetype('arialbd.ttf', 16)
            break
        except Exception:
            continue
    if not font:
        font = ImageFont.load_default()
        title_font = font

    line_height = 22
    header_height = 42
    padding = 24
    
    max_line_len = max(len(l) for l in lines) if lines else 20
    char_width = 9.2
    width = max(800, int(max_line_len * char_width + padding * 2 + 50))
    height = header_height + len(lines) * line_height + padding * 2

    img = Image.new('RGB', (width, height), color='#1e1e2e')
    draw = ImageDraw.Draw(img)

    # Header bar
    draw.rectangle([(0, 0), (width, header_height)], fill='#181825')
    
    # Window controls (macOS style dots)
    draw.ellipse([(16, 15), (28, 27)], fill='#f38ba8')
    draw.ellipse([(36, 15), (48, 27)], fill='#f9e2af')
    draw.ellipse([(56, 15), (68, 27)], fill='#a6e3a1')

    # Title text
    draw.text((80, 12), title, fill='#cdd6f4', font=title_font)

    # Render lines
    y = header_height + padding
    for i, line in enumerate(lines):
        line_num = f"{i+1:2d}  "
        draw.text((padding, y), line_num, fill='#585b70', font=font)
        
        # Basic syntax tinting
        color = '#cdd6f4'
        stripped = line.strip()
        if stripped.startswith('//') or stripped.startswith('/*') or stripped.startswith('*'):
            color = '#6c7086'
        elif any(k in line for k in ['import ', 'require(', 'module.exports', 'return ', 'export ']):
            color = '#cba6f7'
        elif any(k in line for k in ['const ', 'let ', 'var ', 'function ', 'async ', 'await ']):
            color = '#89b4fa'
        elif any(k in line for k in ['if (', 'else', 'try {', 'catch ']):
            color = '#f9e2af'
        elif any(k in line for k in ['app.get(', 'app.post(', 'app.put(', 'app.delete(']):
            color = '#a6e3a1'

        draw.text((padding + 38, y), line, fill=color, font=font)
        y += line_height

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    img.save(output_path)
    print(f"Generated: {output_path}")

def generate_all_snaps():
    output_dir = os.path.join(os.path.dirname(__file__), 'docs', 'code_snaps')
    os.makedirs(output_dir, exist_ok=True)

    # 1. Cache Singleton & Configuration
    code_cache_singleton = '''// utils/cache.js - Singleton NodeCache Instance & Key Generator
const NodeCache = require('node-cache');

let currentTTL = parseInt(process.env.CACHE_TTL_SECONDS, 10) || 60;

const cache = new NodeCache({
  stdTTL: currentTTL,
  checkperiod: 120,
  useClones: true // Deep clone prevents caller mutation of cached items
});

function getActiveTTL() {
  return parseInt(process.env.CACHE_TTL_SECONDS, 10) || currentTTL;
}

function isCacheEnabled() {
  return process.env.CACHE_ENABLED !== 'false' && process.env.CACHE_ENABLED !== false;
}

function getCacheKey(type, id = null) {
  if (type === 'all') return 'all_tasks';
  if (type === 'single') return `task:${id}`;
  throw new Error(`Unknown cache key type: ${type}`);
}'''
    render_code_to_image("utils/cache.js - Singleton Setup & Key Strategy", code_cache_singleton, os.path.join(output_dir, "CacheSingleton.png"))

    # 2. GET /tasks with Caching
    code_get_all = '''// server.js - Cached GET /tasks Route with X-Cache Header
app.get('/tasks', authMiddleware, async (req, res, next) => {
  try {
    const key = getCacheKey('all');

    if (isCacheEnabled()) {
      const cached = cache.get(key);
      if (cached) {
        recordHit('all');
        res.setHeader('X-Cache', 'HIT');
        return res.status(200).json(cached); // Instant return from heap RAM
      }
      recordMiss('all');
      res.setHeader('X-Cache', 'MISS');
    } else {
      res.setHeader('X-Cache', 'BYPASS');
    }

    // Query MongoDB Atlas on cache MISS
    const tasks = await Task.find();

    if (isCacheEnabled()) {
      cache.set(key, tasks, getActiveTTL());
    }

    res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
});'''
    render_code_to_image("server.js - GET /tasks Cached Endpoint", code_get_all, os.path.join(output_dir, "GetAllTasksCached.png"))

    # 3. GET /tasks/:id Separately Cached
    code_get_single = '''// server.js - Single-Task Cached Route (Supplementary Problem a)
app.get('/tasks/:id', authMiddleware, async (req, res, next) => {
  try {
    const key = getCacheKey('single', req.params.id);

    if (isCacheEnabled()) {
      const cached = cache.get(key);
      if (cached) {
        recordHit('single');
        res.setHeader('X-Cache', 'HIT');
        return res.status(200).json(cached); // ~2.5ms latency
      }
      recordMiss('single');
      res.setHeader('X-Cache', 'MISS');
    } else {
      res.setHeader('X-Cache', 'BYPASS');
    }

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (isCacheEnabled()) {
      cache.set(key, task, getActiveTTL());
    }

    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
});'''
    render_code_to_image("server.js - GET /tasks/:id Cached Endpoint", code_get_single, os.path.join(output_dir, "GetSingleTaskCached.png"))

    # 4. Write Invalidation on POST, PUT, DELETE
    code_invalidation = '''// server.js - Automatic Write-Through Invalidation on Mutations
app.post('/tasks', authMiddleware, validateTask, async (req, res, next) => {
  try {
    const task = await Task.create(req.body);
    // Invalidate bulk collection cache only AFTER write succeeds
    if (isCacheEnabled()) invalidateTasksCache();
    res.status(201).json(task);
  } catch (err) { next(err); }
});

app.put('/tasks/:id', authMiddleware, validateTask, async (req, res, next) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    // Invalidate BOTH single-task AND all-tasks cache keys
    if (isCacheEnabled()) invalidateTasksCache(req.params.id);
    res.status(200).json(task);
  } catch (err) { next(err); }
});

app.delete('/tasks/:id', authMiddleware, async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    // Invalidate both single and bulk keys
    if (isCacheEnabled()) invalidateTasksCache(req.params.id);
    res.status(200).json({ message: 'Task deleted successfully', task });
  } catch (err) { next(err); }
});'''
    render_code_to_image("server.js - Cache Invalidation on Mutations", code_invalidation, os.path.join(output_dir, "WriteInvalidation.png"))

    # 5. Debug Endpoints & Telemetry
    code_debug = '''// server.js - Debug Endpoints for Real-Time Telemetry & Reset (Supplementary Problem b)
app.get('/api/debug/cache-stats', authMiddleware, (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ message: 'Debug disabled in production' });
  }
  res.status(200).json(getDetailedStats());
});

app.post('/api/debug/cache-reset', authMiddleware, (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ message: 'Debug disabled in production' });
  }
  const clearData = req.body && req.body.clearData === true;
  resetStats(clearData);
  res.status(200).json({ message: 'Stats reset', currentStats: getDetailedStats() });
});'''
    render_code_to_image("server.js - Debug Telemetry Endpoints", code_debug, os.path.join(output_dir, "DebugEndpoints.png"))

if __name__ == '__main__':
    generate_all_snaps()
