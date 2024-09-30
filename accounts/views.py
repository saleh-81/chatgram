from .models import CustomUser
from .serializers import UserRegisterSerializer,UserChangePasswordSerializer,ProfileSerializer,UserSerializer,FaceLoginSerializer

from rest_framework import generics,mixins,permissions,authentication,throttling,status
from rest_framework.authtoken.serializers import AuthTokenSerializer
from rest_framework.response import Response
from rest_framework.serializers import DateTimeField
from rest_framework.authtoken.models import Token
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes

from django.utils import timezone
from django.contrib.auth.signals import user_logged_in,user_logged_out
from django.shortcuts import get_object_or_404


from knox.views import LoginView as KnoxLoginView
from knox.models import AuthToken
from knox.settings import knox_settings



# Create your views here.
class UserRgisterApiView(generics.CreateAPIView):

    queryset = CustomUser.objects.all()
    serializer_class = UserRegisterSerializer

user_register_view=UserRgisterApiView.as_view()


class UserChangePasswordApiView(
                                mixins.RetrieveModelMixin,
                                mixins.UpdateModelMixin,
                                generics.GenericAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserChangePasswordSerializer

    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user
    
    def put(self,request,*args,**kwargs):  # http post method
        contex = self.update(request,*args,**kwargs).data

        user = self.request.user
        try:
            user.auth_token.delete() # delete rest_framework token
        except:
            pass
        # token = Token.objects.create(user=user)

        user.auth_token_set.all().delete() # delete knox tokens


        ################### recode get knox token ###################
        token_ttl = knox_settings.TOKEN_TTL
        instance, knox_token = AuthToken.objects.create(user, token_ttl)

        datetime_format = knox_settings.EXPIRY_DATETIME_FORMAT

        data = {
            # 'rest_token':token.key,
            # 'knox_token':{
                'token': knox_token,
                'expiry': DateTimeField(format=datetime_format).to_representation(instance.expiry),
            # }
            
        }
        #############################################################
        return Response(data)
    
user_change_password_view = UserChangePasswordApiView.as_view()


class LoginView(KnoxLoginView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request, format=None):
        login_type = request.data.get("type") or None
        

        if login_type == "face":
            serializer = FaceLoginSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            user = serializer.validated_data['user']
            

        else:
            serializer = AuthTokenSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
        
            user = serializer.validated_data['user']


        token_limit_per_user = self.get_token_limit_per_user()
        if token_limit_per_user is not None:
            now = timezone.now()
            token = user.auth_token_set.filter(expiry__gt=now)
            if token.count() >= token_limit_per_user:
                return Response(
                    {"error": "Maximum amount of tokens allowed per user exceeded."},
                    status=status.HTTP_403_FORBIDDEN
                )
        token_ttl = self.get_token_ttl()
        instance, token = AuthToken.objects.create(user, token_ttl)
        user_logged_in.send(sender=user.__class__,
                            request=request, user=user)
        data = self.get_post_response_data(request, token, instance)

        data['user'] = ProfileSerializer(user).data
        # data["login_type"] = "face_login" if login_type == "face" else "password"

        return Response(data)


class ProfileApiView(
                     mixins.RetrieveModelMixin,
                     mixins.UpdateModelMixin,
                     mixins.DestroyModelMixin,
                    generics.GenericAPIView):
    
    queryset = CustomUser.objects.all()
    serializer_class = ProfileSerializer

    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user
    
    def get(self,request,*args,**kwargs):  # http get method
        return self.retrieve(request,*args,**kwargs)
    
    def put(self,request,*args,**kwargs):  # http post method
        return self.update(request,*args,**kwargs)

    def patch(self,request,*args,**kwargs):
        return self.partial_update(request,*args,**kwargs)
    
    def delete(self,request,*args,**kwargs):
        return self.destroy(request,*args,**kwargs)



@api_view(['GET','POST','DELETE'])
@permission_classes([IsAuthenticated])
def FriendsView(request,id=None):
    if request.method == "GET":
        if id is not None:
            friend = get_object_or_404(request.user.friends,id=id)
            return Response(UserSerializer(friend,context={'request': request}).data)
        else:
            paginator = PageNumberPagination()
            paginator.page_size = 10

            friends = request.user.friends.all()

            result_page = paginator.paginate_queryset(friends, request)
            serializer = UserSerializer(result_page, many=True,context={'request': request})

            return paginator.get_paginated_response(serializer.data)
    
    elif request.method == "POST":
        user = get_object_or_404(CustomUser,id=id)
        if not user in request.user.friends.all():
            request.user.friends.add(user)
            return Response(status=200)
        else:
            return Response(status=409)
    
    elif request.method == "DELETE":
        friend = get_object_or_404(request.user.friends,id=id)
        request.user.friends.remove(friend)
        return Response(status=200)
    
    return Response({"detail": f"Method \"{request.method}\" not allowed."},status=405)

    



class UserView(mixins.RetrieveModelMixin,
                generics.GenericAPIView):
    
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    lookup_field = 'pk'

    permission_classes = [permissions.IsAuthenticated]

    def get(self,request,*args,**kwargs):  # http get method
        return self.retrieve(request,*args,**kwargs)
    

class UserSearchView(generics.ListAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer

    permission_classes = [permissions.IsAuthenticated]

    pagination_class = PageNumberPagination
    pagination_class.page_size = 15

    def get_queryset(self):
        qs = super().get_queryset()
        q = self.request.GET.get("q") or ""

        results = qs.search(q)


        return results
    