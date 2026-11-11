import csv
import os
import zipfile
from PIL import Image, ImageDraw, ImageFont
from django.conf import settings
from .models import ImageTemplate, ImageLabel

def generate_personalized_images(template_id, csv_file_path):
    """
    Reads a CSV file, overlays data onto template label boxes, 
    saves individual images, and returns the path to the generated ZIP archive.
    """
    template = ImageTemplate.objects.get(pk=template_id)
    labels = template.labels.all()
    
    # Open the template image
    image_file = template.image.open('rb')
    base_image = Image.open(image_file).convert('RGBA')
    
    # Create output directory for generated files
    output_dir = os.path.join(settings.MEDIA_ROOT, 'generated_output')
    os.makedirs(output_dir, exist_ok=True)
    
    zip_filename = f'personalized_images_template_{template_id}.zip'
    zip_path = os.path.join(output_dir, zip_filename)
    
    generated_image_paths = []
    
    # Read the CSV file data
    with open(csv_file_path, mode='r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        
        for index, row in enumerate(reader):
            # Create a fresh copy of the base image for each row/recipient
            img_copy = base_image.copy()
            draw = ImageDraw.Draw(img_copy)
            
            for label in labels:
                # Match CSV column header with the label name defined in the editor
                text_value = row.get(label.name, '')
                if not text_value:
                    continue
                
                # Load font (falls back to default if TrueType font isn't found)
                try:
                    font_size = int(label.font_size) if label.font_size else 24
                    font_name = getattr(label, 'font_family', 'arial.ttf') or 'arial.ttf'
                    font = ImageFont.truetype(font_name, font_size)
                except IOError:
                    font = ImageFont.load_default()
                
                # Bounding box coordinates
                x = float(label.x)
                y = float(label.y)
                
                # Text color (defaults to black if not set)
                fill_color = getattr(label, 'text_color', '#000000') or '#000000'
                
                # Draw the text onto the image
                draw.text((x, y), text_value, fill=fill_color, font=font)
            
            # Save the generated personalized image
            output_filename = f'certificate_{index + 1}.png'
            output_file_path = os.path.join(output_dir, output_filename)
            
            # Convert back to RGB for standard PNG compatibility
            img_copy.convert('RGB').save(output_file_path, 'PNG')
            generated_image_paths.append(output_file_path)
            
    # Bundle all generated images into a single ZIP file
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zip_f:
        for file_path in generated_image_paths:
            arcname = os.path.basename(file_path)
            zip_f.write(file_path, arcname)
            
    return zip_path