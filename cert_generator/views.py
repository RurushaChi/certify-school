from django.shortcuts import render

# Create your views here.
from django.conf import settings
import json
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from .models import ImageLabel, ImageTemplate
from .utils import generate_personalized_images
import os
import zipfile


def upload_template_view(request):
  if request.method == 'POST':
    title = request.POST.get('title')
    image = request.FILES.get('image')
    if title and image:
      template = ImageTemplate.objects.create(title=title, image=image)
      return redirect('label_editor', pk=template.pk)
  return render(request, 'cert_generator/upload_template.html')


def label_editor_view(request, pk):
  template = get_object_or_404(ImageTemplate, pk=pk)

  if request.method == 'POST':
    # Expecting JSON data from frontend JavaScript containing box definitions
    try:
      data = json.loads(request.body)
      # Clear existing labels if re-editing
      template.labels.all().delete()

      for box in data.get('labels', []):
        ImageLabel.objects.create(
            template=template,
            name=box['name'],
            x=box['x'],
            y=box['y'],
            width=box['width'],
            height=box['height'],
            font_size=box.get('font_size', 24),
            text_color=box.get('text_color', '#000000'),
        )
      return JsonResponse({'status': 'success', 'redirect_url': f'/cert_generator/template/{template.pk}/generate/'})
    except Exception as e:
      return JsonResponse({'status': 'error', 'message': str(e)}, status=400)

  return render(request, 'cert_generator/label_editor.html', {'template': template})


def generate_images_view(request, pk):
    template = get_object_or_404(ImageTemplate, pk=pk)

    if request.method == 'POST':
        csv_file = request.FILES.get('csv_file')
        if csv_file:
            csv_path = os.path.join(settings.MEDIA_ROOT, 'temp_upload.csv')
            with open(csv_path, 'wb+') as destination:
                for chunk in csv_file.chunks():
                    destination.write(chunk)

            zip_path = generate_personalized_images(template.pk, csv_path)

            if os.path.exists(zip_path):
                with open(zip_path, 'rb') as fh:
                    response = HttpResponse(fh.read(), content_type='application/zip')
                    response['Content-Disposition'] = 'attachment; filename="personalized_images.zip"'
                    return response

    return render(request, 'cert_generator/upload_csv.html', {'template': template})