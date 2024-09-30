from django.contrib.auth.base_user import BaseUserManager
from django.utils.translation import gettext_lazy as _
from django.db.models.query import QuerySet
from django.db.models import Q,Value as V
from django.db.models.functions import Concat
import re


class CustomUserQuerySet(QuerySet):
    def search(self,query:str):
        q = query.strip()
        if q:
            if re.match(r"@\w+",q):
                lookup = Q(username__icontains=q[1:])
            elif re.match(r"09\d{9}",q):
                lookup = Q(phone_number__icontains=q,show_phone_number=True)
            else:
                lookup =    Q(first_name__icontains=q) |\
                            Q(last_name__icontains=q) |\
                            Q(full_name__icontains=q) |\
                            Q(email__icontains=q,show_email=True) |\
                            Q(username__icontains=q)
                
            qs = self.annotate(full_name=Concat('first_name', V(' '), 'last_name'))
            
            return qs.filter(lookup).distinct()
        
        return self.none()


class CustomUserManager(BaseUserManager):
    def get_queryset(self) -> QuerySet:
        return CustomUserQuerySet(self.model,using=self._db)
    
    def search(self,query):
        return self.get_queryset().search(query)

    def create_user(self,email,username,password=None):
        if not email:
            raise ValueError("Please Enter valid email")
        if not username:
            raise ValueError("Please Enter valid username")

        user=self.model(
            email=email,
            username=username,
        )

        user.set_password(password)
        user.save()
        
        return user

    def create_superuser(self,email,username,password=None):
        user=self.create_user(
            email=email,
            username=username,
            password=password,
        )

        user.is_staff=True
        user.is_superuser=True
        user.save()

        return user