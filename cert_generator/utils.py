import csv
import os
import zipfile
from PIL import Image, ImageDraw, ImageFont
from django.conf import settings
from .models import ImageTemplate, ImageLabel

def generate_personalized_images(template_id, csv_file_path):
    template = ImageTemplate.objects.get(pk=template_id)
    labels = template.labels.all()
    
    image_file = template.image.open('rb')
    base_image = Image.open(image_file).convert('RGBA')
    
    output_dir = os.path.join(settings.MEDIA_ROOT, 'generated_output')
    os.makedirs(output_dir, exist_ok=True)
    
    zip_filename = f'personalized_images_template_{template_id}.zip'
    zip_path = os.path.join(output_dir, zip_filename)
    
    generated_image_paths = []
    
    with open(csv_file_path, mode='r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        
        for index, row in enumerate(reader):
            img_copy = base_image.copy()
            draw = ImageDraw.Draw(img_copy)
            
            for label in labels:
                text_value = row.get(label.name, '')
                if not text_value:
                    continue
                
                try:
                    font_size = int(label.font_size) if label.font_size else 24
                    font_name = getattr(label, 'font_family', 'arial.ttf') or 'arial.ttf'
                    font = ImageFont.truetype(font_name, font_size)
                except IOError:
                    font = ImageFont.load_default()
                
                x = float(label.x)
                y = float(label.y)
                box_width = float(label.width)
                alignment = getattr(label, 'alignment', 'left')
                fill_color = getattr(label, 'text_color', '#000000') or '#000000'
                
                # Calculate text width accurately
                try:
                    text_bbox = font.getbbox(text_value)
                    text_width = text_bbox[2] - text_bbox[0]
                except AttributeError:
                    text_width = font.getlength(text_value) if hasattr(font, 'getlength') else len(text_value) * (font_size * 0.5)
                
                # Precise alignment calculation inside the box width
                draw_x = x
                if alignment == 'center':
                    draw_x = x + (box_width - text_width) / 2.0
                elif alignment == 'right':
                    draw_x = x + box_width - text_width
                
                draw.text((draw_x, y), text_value, fill=fill_color, font=font)
            
            output_filename = f'certificate_{index + 1}.png'
            output_file_path = os.path.join(output_dir, output_filename)
            
            img_copy.convert('RGB').save(output_file_path, 'PNG')
            generated_image_paths.append(output_file_path)
            
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zip_f:
        for file_path in generated_image_paths:
            arcname = os.path.basename(file_path)
            zip_f.write(file_path, arcname)
            
    return zip_path