from django.contrib import admin
from . import models

@admin.register(models.PrivateChat)
class PrivateChatAdmin(admin.ModelAdmin):
    list_display = ("id","user1","user2",'created')
    search_fields = ('user1','user2','created')
    list_filter = ('user1','user2','created')


@admin.register(models.PrivateChatMessage)
class PrivateChatMessageAdmin(admin.ModelAdmin):
    list_display = ("id","private_chat","user","datetime","summery")
    search_fields = ("private_chat","user","datetime","summery")
    list_filter = ("private_chat","user","datetime")



@admin.register(models.Group)
class PrivateChatAdmin(admin.ModelAdmin):
    list_display = ("id","title","admin",'created')
    search_fields = ('title',
                     'admin__username',
                     'admin__first_name',
                     'admin__last_name',
                     'admin__phone_number',
                     'admin__email',
                     'created')
    list_filter = ('created',)


@admin.register(models.GroupMessage)
class GroupMessageAdmin(admin.ModelAdmin):
    list_display = ("id","group","user","datetime","summery")
    search_fields = ("group","user","datetime","summery")
    list_filter = ("group","user","datetime")