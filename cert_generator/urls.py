from django.urls import path
from . import views

urlpatterns = [
    path('', views.upload_template_view, name='upload_template'),
    path(
        'template/<int:pk>/labels/',
        views.label_editor_view,
        name='label_editor',
    ),
    path(
        'template/<int:pk>/generate/',
        views.generate_images_view,
        name='generate_images',
    ),
]