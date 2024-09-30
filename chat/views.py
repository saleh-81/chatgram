from accounts.models import CustomUser
from accounts.serializers import UserSerializer
from .serializers import PrivateChatSerializer,PrivateChatMessageSerializer,GroupSerializer,GroupCreateSerializer,GroupMessageSerializer
from . models import PrivateChat,PrivateChatMessage,Group,GroupMessage
from .permissions import IsGroupAdminOrReadOnly

from rest_framework import generics,mixins,permissions,authentication,throttling,status
from rest_framework.authtoken.serializers import AuthTokenSerializer
from rest_framework.response import Response
from rest_framework.serializers import DateTimeField
from rest_framework.authtoken.models import Token
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes

from django.shortcuts import get_object_or_404,get_list_or_404




class PrivateChatView(  mixins.RetrieveModelMixin,
                        mixins.ListModelMixin,
                        mixins.DestroyModelMixin,
                        generics.GenericAPIView):
    
    queryset = PrivateChat.objects.all()
    permission_classes=[IsAuthenticated]
    serializer_class = PrivateChatSerializer
    lookup_field = 'pk'

    pagination_class = PageNumberPagination
    
    
        
    def get(self,request,*args,**kwargs):
        pk= kwargs.get("pk")
        if pk is not None:
            user = get_object_or_404(CustomUser,id=pk)
            private_chat = PrivateChat.objects.find_by_users(request.user,user)
            if private_chat.exists():
                serializer = self.serializer_class(private_chat[0],context={"request":request})
                return Response(serializer.data)
            else:
                return Response({"detail": "Not found."},status=404)
            
        self.pagination_class.page_size = 15
        return self.list(request,*args,**kwargs)
    
    def delete(self,request,*args,**kwargs):
        pk = kwargs.get("pk")
        if pk is not None:
            user = get_object_or_404(CustomUser,id=pk)
            instance = PrivateChat.objects.find_by_users(request.user,user)
            if instance.exists():
                self.perform_destroy(instance[0])
                return Response(status=status.HTTP_204_NO_CONTENT)
            else:
                return Response({"detail": "Not found."},status=404)
        else:
            return Response({"detail": fr'Method "{request.method}" not allowed.'},status=405)
        
    
    def get_queryset(self):
        return super().get_queryset().find_by_user(self.request.user)
    

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def PrivateChatMessageView(request,id):
    if request.method=="GET":
        user = get_object_or_404(CustomUser,id=id)
        private_chat = PrivateChat.objects.find_by_users(request.user,user)
        if private_chat.exists():
            messages = private_chat[0].messages()


            paginator = PageNumberPagination()
            paginator.page_size = 20

            result_page = paginator.paginate_queryset(messages, request)
            serializer = PrivateChatMessageSerializer(result_page, many=True,context={'request': request})

            return paginator.get_paginated_response(serializer.data)
        
        else:
            return Response({"detail": "Not found."},status=404)


    return Response({"detail": fr'Method "{request.method}" not allowed.'},status=405)
        

class GroupListCreateView(generics.ListCreateAPIView):
    queryset = Group.objects.all()
    permission_classes=[IsAuthenticated]
    serializer_class = GroupCreateSerializer

    pagination_class = PageNumberPagination
    pagination_class.page_size = 15

    def get_queryset(self):
        return super().get_queryset().find_by_user(self.request.user)
    
    def perform_create(self, serializer):
        instance = serializer.save()
        instance.users.add(self.request.user)
    
class GroupRetrieveUpdateDestroy(generics.RetrieveUpdateDestroyAPIView):
    queryset = Group.objects.all()
    permission_classes=[IsAuthenticated,IsGroupAdminOrReadOnly]
    serializer_class = GroupSerializer


@api_view(['GET','POST','DELETE'])
@permission_classes([IsAuthenticated])
def group_users(request,group_id,user_id=None):

    group = get_object_or_404(Group,id=group_id)
    user = request.user
    has_permission = group.admin == user

    if user_id is None:

        if request.method == "GET":
            
            users = group.users.all()
            if has_permission or user in users:

                paginator = PageNumberPagination()
                paginator.page_size = 5
                result_page = paginator.paginate_queryset(users, request)

                serializer = UserSerializer(result_page, many=True,context={'request': request})

                return paginator.get_paginated_response(serializer.data)
            
            else:
                return Response({"detail": "You do not have permission to perform this action."},status=403)
        
        elif request.method == "POST":
            if has_permission:
                user_id = request.data.get("user_id") or None
                target_user = get_object_or_404(CustomUser,id=user_id)
                if not target_user in group.users.all():
                    group.users.add(target_user)
                    group.save()
                    return Response({"detail":f"'{target_user.first_name} {target_user.last_name}' joined to group '{group.title}'"})

                return Response(status=status.HTTP_204_NO_CONTENT)
            
            return Response({"detail": "You do not have permission to perform this action."},status=403)
        
        return Response({"detail": fr'Method "{request.method}" not allowed.'},status=405)
    
    else:
        if request.method == "DELETE":

            if has_permission:

                target_user = get_object_or_404(CustomUser,id=user_id)

                if target_user != user:
                
                    if target_user in group.users.all():
                        group.users.remove(target_user)
                        group.save()
                        return Response({"detail":f"'{target_user.first_name} {target_user.last_name}' removed from group '{group.title}'"})

                    return Response({"detail": "User is not in this group."},status=404)

            return Response({"detail": "You do not have permission to perform this action."},status=403)
    
        return Response({"detail": fr'Method "{request.method}" not allowed.'},status=405)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def group_messages(request,group_id):
    group = get_object_or_404(Group,id=group_id)

    user = request.user

    if group.can_access(user):
        messages = group.groupmessage_set.all()

        paginator = PageNumberPagination()
        paginator.page_size = 20
        result_page = paginator.paginate_queryset(messages, request)

        serializer = GroupMessageSerializer(result_page, many=True,context={'request': request})

        return paginator.get_paginated_response(serializer.data)
    
    return Response({"detail": "You do not have permission to perform this action."},status=403)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def left_group_view(request,group_id):
    group = get_object_or_404(Group,id=group_id)
    user = request.user
    is_group_admin = group.admin == user

    if not is_group_admin:
        if user in group.users.all():
            group.users.remove(user)
            return Response()
        
        return Response({"detail": "You are not in this group."},status=404)
    
    return Response({"detail": "You do not have permission to perform this action."},status=403) 