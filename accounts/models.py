from django.db import models
from django.contrib.auth.models import AbstractUser
# from .validators import *
from .managers import CustomUserManager
from django.utils.translation import gettext_lazy as _

import face_recognition
import numpy as np
from picklefield.fields import PickledObjectField
import PIL

from .validators import validate_phone_number


def get_profile_image_file_path(self,file_name):
    image_type=file_name.split(".")[-1]
    return f"profile_images/{self.pk}_profile_image.{image_type}"

class CustomUser(AbstractUser):

    first_name = models.CharField(_("first name"), max_length=150)

    email           = models.EmailField(_("email address"), unique=True)

    phone_number    = models.CharField(max_length=11,unique=True,validators=[validate_phone_number])

    profile_image   = models.ImageField(upload_to=get_profile_image_file_path,blank=True,null=True)

    face_image      = models.ImageField(blank=True,null=True)
    face_encoding   = PickledObjectField(blank=True,null=True)

    biography       = models.CharField(max_length=70,blank=True,null=True)

    friends         = models.ManyToManyField('CustomUser',blank=True)

    show_email              = models.BooleanField(default=False)
    show_phone_number       = models.BooleanField(default=False)
    show_profile_image      = models.BooleanField(default=True)
    show_biography          = models.BooleanField(default=True)

    USERNAME_FIELD  = 'username' #login field
    # REQUIRED_FIELDS = ['username'] #requierd fields in console

    objects = CustomUserManager()

    def __str__(self) -> str:
        return self.username
    
    def profile_image_exists(self):
        if self.profile_image:
            return self.profile_image.storage.exists(self.profile_image.name)
        return False
    
    def get_encodings(self):
        if self.face_image:
            try:
                return face_recognition.face_encodings(self.read_image_from_file(self.face_image))
            except Exception as error:
                print(error)
        
        return None
    
    def save(self, *args, **kwargs):
        # self.face_encoding = self.get_encodings()
        super().save(*args, **kwargs)

    def read_image_from_file(self,file):
       return np.array(PIL.Image.open(file))