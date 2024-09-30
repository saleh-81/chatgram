from django.contrib import admin

# Register your models here.
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from . import models


@admin.register(models.CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display=('username','phone_number',"email","first_name","last_name")
    search_fields=('username','phone_number',"email","first_name","last_name","biography")

    readonly_fields=('date_joined','last_login','face_encoding')

    ordering=[]

    # filter_horizontal=[]
    # list_filter=['phone_number']
    fieldsets=[]

    add_fieldsets=(
        (None,{
            "fields":('username',
                      'phone_number',
                      'email',
                      ('first_name','last_name'),
                      'password1',
                      'password2'
                      ),
        }
        ),
    )

    fieldsets=(
        (None,{
            "fields":("username",
                      ('first_name','last_name'),
                      ('email',),
                      ('phone_number',"show_phone_number"),
                      ('profile_image',"show_profile_image"),
                      ('biography',"show_biography"),
                      ('face_image','face_encoding'),
                      "friends",
                      "is_active",
                      "is_staff",
                      "is_superuser",
                      "groups",
                      "user_permissions",
                      ("date_joined","last_login"),
                      "password"),
        }
        ),
    )