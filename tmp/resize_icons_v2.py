from PIL import Image
import base64
import os

source_path = r'c:\workspace\daypoo\favicon.jpg'
icons_dir = r'c:\workspace\daypoo\frontend\public\icons'
public_dir = r'c:\workspace\daypoo\frontend\public'

sizes = [72, 96, 128, 144, 152, 192, 384, 512]

img = Image.open(source_path)

# Generate PNG icons in icons directory
for size in sizes:
    resized_img = img.resize((size, size), Image.Resampling.LANCZOS)
    target_filename = f'icon-{size}x{size}.png'
    resized_img.save(os.path.join(icons_dir, target_filename), 'PNG')
    print(f'Generated: {target_filename} in icons/')

# Generate favicon.ico in icons directory
img.resize((32, 32), Image.Resampling.LANCZOS).save(os.path.join(icons_dir, 'favicon.ico'), format='ICO', sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
print('Generated: favicon.ico in icons/')

# Generate icon.svg in icons directory
with open(source_path, 'rb') as f:
    encoded_string = base64.b64encode(f.read()).decode('utf-8')

svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 {img.width} {img.height}">
  <image xlink:href="data:image/jpeg;base64,{encoded_string}" x="0" y="0" width="{img.width}" height="{img.height}" />
</svg>'''

with open(os.path.join(icons_dir, 'icon.svg'), 'w', encoding='utf-8') as f:
    f.write(svg_content)
print('Generated: icon.svg in icons/')

# Generate favicon.png in public directory (typical size 32x32 or 512x512, let's go with 512x512)
img.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(public_dir, 'favicon.png'), 'PNG')
print('Generated: favicon.png in public/')
