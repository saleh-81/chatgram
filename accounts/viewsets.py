from rest_framework import viewsets,mixins

from .models import CustomUser
from .serializers import UserRegisterSerializer


class UserRgisterViewSet(
    mixins.CreateModelMixin,
    viewsets.GenericViewSet
    ):
    '''
    post -> create -> instance
    '''
    queryset = CustomUser.objects.all()
    serializer_class = UserRegisterSerializer
