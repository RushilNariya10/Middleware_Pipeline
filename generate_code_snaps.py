import os
from PIL import Image, ImageDraw, ImageFont

def render_code_to_image(title, code_str, output_path, max_lines=45):
    lines = code_str.strip().split('\n')[:max_lines]
    
    # Try fonts
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
    
    # Measure width
    max_line_len = max(len(l) for l in lines) if lines else 20
    char_width = 9.2
    width = max(780, int(max_line_len * char_width + padding * 2 + 50))
    height = header_height + len(lines) * line_height + padding * 2

    # Canvas
    img = Image.new('RGB', (width, height), color='#1e1e2e')
    draw = ImageDraw.Draw(img)

    # Header bar
    draw.rectangle([(0, 0), (width, header_height)], fill='#181825')
    
    # Window buttons
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
        
        # Simple syntax tinting based on contents
        color = '#cdd6f4'
        stripped = line.strip()
        if stripped.startswith('//') or stripped.startswith('/*') or stripped.startswith('*'):
            color = '#6c7086'
        elif any(k in line for k in ['import ', 'export ', 'from ', 'default ', 'return ']):
            color = '#cba6f7'
        elif any(k in line for k in ['const ', 'let ', 'var ', 'function ']):
            color = '#89b4fa'
        elif any(k in line for k in ['<', '>', '/>']):
            color = '#f38ba8'
        elif '"' in line or "'" in line or '`' in line:
            color = '#a6e3a1'

        draw.text((padding + 42, y), line, fill=color, font=font)
        y += line_height

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    img.save(output_path)
    print(f"Rendered: {output_path}")

# 1. LoadingFallback.jsx
with open('portfolio/src/components/LoadingFallback.jsx', encoding='utf-8') as f:
    render_code_to_image('src/components/LoadingFallback.jsx', f.read(), 'docs/code_snaps/LoadingFallback.png')

# 2. TaskChart.jsx (HeavyChart)
with open('portfolio/src/components/TaskChart.jsx', encoding='utf-8') as f:
    render_code_to_image('src/components/TaskChart.jsx (Recharts Heavy Component)', f.read(), 'docs/code_snaps/HeavyChart.png')

# 3. Analytics.jsx
with open('portfolio/src/pages/Analytics.jsx', encoding='utf-8') as f:
    render_code_to_image('src/pages/Analytics.jsx (Lazy Component Consumer)', f.read(), 'docs/code_snaps/Analytics.png')

# 4. App.jsx (Routes with Suspense & Lazy)
with open('portfolio/src/App.jsx', encoding='utf-8') as f:
    render_code_to_image('src/App.jsx (Route-Level Code Splitting & Suspense)', f.read(), 'docs/code_snaps/AppRoutes.png')

# 5. lazyWithDelay.js & RouteErrorBoundary.jsx
with open('portfolio/src/utils/lazyWithDelay.js', encoding='utf-8') as f:
    render_code_to_image('src/utils/lazyWithDelay.js (Minimum-Delay Helper)', f.read(), 'docs/code_snaps/lazyWithDelay.png')

# 6. TaskItem.jsx (Profiler & React.memo fix)
with open('portfolio/src/components/TaskItem.jsx', encoding='utf-8') as f:
    render_code_to_image('src/components/TaskItem.jsx (Profiler React.memo Optimization)', f.read(), 'docs/code_snaps/TaskItemMemo.png')

print("All code snapshot images generated successfully!")

