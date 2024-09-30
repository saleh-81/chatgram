from collections.abc import Iterable
from typing import Any
from django.db import models
from django.contrib.auth import get_user_model
from django.db.models.query import QuerySet
from django.db.models import Q

user_model = get_user_model()



class PrivateChatQuerySet(models.QuerySet):    
    def find_by_users(self,user1,user2):
        if user1 is not None and user2 is not None:
            lookup = Q(user1=user1,user2=user2) | Q(user1=user2,user2=user1)
            return self.filter(lookup).distinct()
        
        return self.none()
    
    def find_by_user(self,user):
        if user is not None:
            lookup = Q(user1=user) | Q(user2=user)
            return self.filter(lookup).distinct()

        return self.none()
    
    def get_or_create(self,user1,user2):
        objects = self.find_by_users(user1,user2)
        if objects.exists():
            return objects[0]
        
        users = sorted([user1,user2],key=lambda user:user.id)
        return self.create(user1=users[0],user2=users[1])
            

    
class PrivateChatManager(models.Manager):
    def get_queryset(self) -> QuerySet:
        return PrivateChatQuerySet(self.model,using=self._db)

    def find_by_users(self,user1,user2):
        return self.get_queryset().find_by_users(user1,user2)
    
    def create(self, **kwargs: Any) -> Any:
        new_users = sorted([kwargs['user1'],kwargs['user2']],key=lambda i:i.id)
        kwargs['user1']=new_users[0]
        kwargs['user2']=new_users[1]
        return super().create(**kwargs)
    
    def get_or_create(self,user1,user2):
        return self.get_queryset().get_or_create(user1,user2)

class PrivateChat(models.Model):
    user1               = models.ForeignKey(user_model,on_delete=models.CASCADE,related_name='user1')
    user2               = models.ForeignKey(user_model,on_delete=models.CASCADE,related_name='user2')
    created             = models.DateTimeField(auto_now_add=True)

    objects = PrivateChatManager()
    

    @property
    def room_name(self):
        return '-'.join(sorted([str(self.user1.id),str(self.user2.id)],key=lambda i:int(i)))
    
    def messages(self):
        return self.privatechatmessage_set.all()
    
    @property
    def last_message_id(self):
        messages = self.messages()
        if messages.exists():
            return messages[0].id
        return None
    
    class Meta:
        unique_together = ("user1", "user2")
        ordering = ['-id']


def get_chat_image_file_path(self,file_name):
    image_type=file_name.split(".")[-1]
    return f"chat_images/chat_image.{image_type}"

class PrivateChatMessage(models.Model):
    private_chat        = models.ForeignKey(PrivateChat,on_delete=models.CASCADE)
    user                = models.ForeignKey(user_model,on_delete=models.CASCADE)
    datetime            = models.DateTimeField(auto_now_add=True)
    message             = models.TextField(max_length=500)
    image               = models.ImageField(upload_to=get_chat_image_file_path,blank=True,null=True)
    dir_choices = (
        ("ltr","left to right"),
        ("rtl","right to left")
    )
    direction           = models.CharField(max_length=10,choices=dir_choices,default="ltr")

    class Meta:
        ordering = ["-datetime"]

    def summery(self):
        return self.message[:20]+" ..."
    


class GroupQuerySet(models.QuerySet):
    def find_by_admin(self,user):
        if user is not None:
            return self.filter(admin=user)
        
        return self.none()
    
    def find_by_users(self,users:Iterable):
        if users is not None:
            return self.filter(users__in=users).distinct()
    
        return self.none()
    
    def find_by_user(self,user):
        if user is not None:
            lookup = Q(admin=user) | Q(users__in=[user])
            return self.filter(lookup).distinct()

        return self.none()

class GroupManager(models.Manager):
    def get_queryset(self) -> QuerySet:
        return GroupQuerySet(self.model,using=self._db)
    
    def find_by_admin(self,user):
        return self.get_queryset().find_by_admin(user)
    
    def find_by_users(self,users:Iterable):
        return self.get_queryset().find_by_users(users)
    
    def find_by_user(self,user):
        return self.get_queryset().find_by_user(user)


def get_group_image_file_path(self,file_name):
    image_type=file_name.split(".")[-1]
    return f"group_images/{self.pk}_group_image.{image_type}"

class Group(models.Model):
    title               = models.CharField(max_length=100)
    image               = models.ImageField(upload_to=get_group_image_file_path,blank=True,null=True)
    admin               = models.ForeignKey(user_model,on_delete=models.CASCADE,related_name="admin")
    users               = models.ManyToManyField(user_model,blank=True,related_name="users")
    created             = models.DateTimeField(auto_now_add=True)

    objects = GroupManager()

    class Meta:
        ordering = ['-id']

    def messages(self):
        return self.groupmessage_set.all()
    
    @property
    def last_message_id(self):
        messages = self.messages()
        if messages.exists():
            return messages[0].id
        return None
    
    def can_access(self,user):
        if self.admin == user or user in self.users.all():
            return True
        
        return False


class GroupMessage(models.Model):
    group               = models.ForeignKey(Group,on_delete=models.CASCADE)
    user                = models.ForeignKey(user_model,on_delete=models.CASCADE)
    datetime            = models.DateTimeField(auto_now_add=True)
    message             = models.TextField(max_length=500)
    dir_choices = (
        ("ltr","left to right"),
        ("rtl","right to left")
    )
    direction           = models.CharField(max_length=10,choices=dir_choices,default="ltr")

    class Meta:
        ordering = ["-datetime"]

    def summery(self):
        return self.message[:20]+" ..."
    
    