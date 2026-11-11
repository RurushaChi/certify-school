from django.db import models


class ImageTemplate(models.Model):
  title = models.CharField(max_length=255)
  image = models.ImageField(upload_to='templates/')
  created_at = models.DateTimeField(auto_now_add=True)


class ImageLabel(models.Model):
    template = models.ForeignKey(ImageTemplate, related_name='labels', on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    x = models.FloatField()
    y = models.FloatField()
    width = models.FloatField()
    height = models.FloatField()
    font_size = models.IntegerField(default=32)
    text_color = models.CharField(max_length=20, default='#000000')
    font_family = models.CharField(max_length=100, default='arial.ttf')
