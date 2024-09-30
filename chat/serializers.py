from rest_framework import serializers
from . import models
from accounts.serializers import UserSerializer
from django.utils import timezone



class PrivateChatSerializer(serializers.ModelSerializer):

    user            = serializers.SerializerMethodField()

    class Meta:
        model = models.PrivateChat
        fields = [
            'id',
            'user',
            'created',
            'last_message_id'
        ]


    def get_user(self,obj):
        request = self.context.get('request')
        if request and request.user:
            user = request.user
            if user.is_authenticated:
                return UserSerializer(obj.user2 if user == obj.user1 else obj.user1 if user == obj.user2 else None
                                      ,context={'request': request}).data

        return UserSerializer(None).data
    

class PrivateChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.PrivateChatMessage
        fields = "__all__"




class GroupCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Group
        # fields = "__all__"
        exclude  = ('users',)

        extra_kwargs = {
            'admin': {'read_only': True},
        }

        

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user:
            user = request.user
            if user.is_authenticated:
                validated_data["admin"] = user
                return super().create(validated_data)
        
        raise serializers.ValidationError({"admin":"invalid group admin!"})
        

class GroupSerializer(serializers.ModelSerializer):

    admin               = serializers.SerializerMethodField()

    created             = serializers.SerializerMethodField()

    class Meta:
        model = models.Group
        # fields = "__all__"
        exclude  = ('users',)

    def get_admin(self,obj):
        if self.can_access(obj):
            return obj.admin.id
            
        return None
    
    def get_created(self,obj):
        if self.can_access(obj):
            return timezone.localtime(obj.created)
        
        return None
    
    def can_access(self,obj):
        request = self.context.get('request')
        if request and request.user:
            user = request.user
            if user.is_authenticated:
                if obj.can_access(user):
                    return True
                
        return False
    

class GroupMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.GroupMessage
        fields = "__all__"
