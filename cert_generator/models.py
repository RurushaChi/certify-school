from django.db import models


class ImageTemplate(models.Model):
  title = models.CharField(max_length=255)
  image = models.ImageField(upload_to='templates/')
  created_at = models.DateTimeField(auto_now_add=True)


class ImageLabel(models.Model):
  template = models.ForeignKey(
      ImageTemplate, related_name='labels', on_delete=models.CASCADE
  )
  name = models.CharField(
      max_length=100
  )  # e.g., "first_name", matches CSV column
  x = models.FloatField()  # Percentage or pixel coordinates
  y = models.FloatField()
  width = models.FloatField()
  height = models.FloatField()
  font_size = models.IntegerField(default=24)
  text_color = models.CharField(
      max_length=7, default='#000000'
  )  # Hex color
