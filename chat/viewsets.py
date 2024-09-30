from rest_framework import viewsets,mixins,permissions

from .models import Group
from .serializers import GroupSerializer
from .permissions import IsGroupAdminOrReadOnly

class GroupViewSet(viewsets.ModelViewSet):
    '''
    get -> list -> queryset
    get -> retrieve -> product instance detial view
    post -> create -> new instance
    put -> update
    patch -> partials update
    delete -> destroy
    '''

    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes=[IsGroupAdminOrReadOnly]