from rest_framework import serializers

from django.contrib.auth.password_validation import validate_password
from django.core import exceptions
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404

from . import models
from chat.models import PrivateChat

import face_recognition
import numpy as np
import PIL

user_model = get_user_model()

class UserChangePasswordSerializer(serializers.ModelSerializer):

    old_password = serializers.CharField(write_only=True,required=True)
    new_password = serializers.CharField(write_only=True,required=True)

    class Meta:
        model = user_model
        fields = [
            'old_password',
            'new_password',
        ]

    def validate(self,attrs):
        if not isinstance(self.instance,self.Meta.model):
            raise serializers.ValidationError({"detial":"User not found."})
        
        if not self.instance.check_password(attrs.get("old_password")):
            raise serializers.ValidationError({"old_password":"The password is incorrect."})
        
        try:
            validate_password(attrs.get("new_password"),self.instance)
        except exceptions.ValidationError as e:
            raise serializers.ValidationError({"new_password":list(e.messages)})
        
        return attrs
    
    def update(self, instance, validated_data):
        
        instance.set_password(validated_data.get("new_password"))
        instance.save()
        return instance
    

class FaceLoginSerializer(serializers.Serializer):

    username = serializers.CharField(write_only=True, required=True)
    face_image = serializers.ImageField(write_only=True,required=True)

    class Meta:
        fields = [
            "__all__"
        ]

    def validate(self, attrs):

        user = get_object_or_404(user_model,username=attrs["username"])
        
        if not user.face_encoding:
            raise serializers.ValidationError({"face_id":"user has not face id"})
        

        # print(attrs["face_image"].file.name)
        unknown_encoding = face_recognition.face_encodings(np.array(PIL.Image.open(attrs["face_image"].file).convert('RGB')))

        if unknown_encoding:

            results = face_recognition.compare_faces(unknown_encoding,user.face_encoding[0],0.4)

            if not True in results:
                raise serializers.ValidationError({"face_id":"wronge face id"})
            
        else:
            raise serializers.ValidationError({"face_id":"wronge face id"})
        
        attrs["user"] = user
        return attrs
    

class UserRegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])

    class Meta:
        model = user_model
        fields = [
            'username',
            'phone_number',
            'email',
            'first_name',
            'last_name',
            'password',
        ]

    def validate(self, attrs):
        user = models.CustomUser(
            phone_number=attrs['phone_number'],
            first_name=attrs['first_name'],
            last_name=attrs['last_name']
        )
        try:
            validate_password(
                attrs['password'],
                user=user
            )
        except exceptions.ValidationError as e:
            raise serializers.ValidationError({"password":list(e.messages)})
            
        return attrs
    
    def create(self, validated_data):
        user = models.CustomUser(
            username=validated_data['username'],
            phone_number=validated_data['phone_number'],
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name']
        )
        
        user.set_password(validated_data['password'])
        user.save()

        return user



class UserSerializer(serializers.ModelSerializer):
    email               = serializers.SerializerMethodField()
    profile_image       = serializers.SerializerMethodField()
    biography           = serializers.SerializerMethodField()
    phone_number        = serializers.SerializerMethodField()
    is_friend           = serializers.SerializerMethodField()
    has_chat            = serializers.SerializerMethodField()

    class Meta:
        model = user_model
        fields = [
            'id',
            'username',
            'first_name',
            'last_name',
            'email',
            'profile_image',
            'biography',
            'phone_number',
            'is_friend',
            'has_chat'
        ]

    def get_email(self,obj):
        if obj.show_email:
            return obj.email
        
        request = self.context.get('request')
        if request and request.user:
            user = request.user
            if user.is_authenticated:
                if user in obj.friends.all() or user==obj:
                    return obj.email
                
        return None
    
    def get_profile_image(self,obj):
        if obj.show_profile_image:
            return obj.profile_image.url if obj.profile_image else None
        
        request = self.context.get('request')
        if request and request.user:
            user = request.user
            if user.is_authenticated:
                if user in obj.friends.all() or user==obj:
                    return obj.profile_image.url if obj.profile_image else None
        return None
    
    def get_biography(self,obj):
        if obj.show_biography:
            return obj.biography
        
        request = self.context.get('request')
        if request and request.user:
            user = request.user
            if user.is_authenticated:
                if user in obj.friends.all() or user==obj:
                    return obj.biography
        return None
    
    def get_phone_number(self,obj):
        if obj.show_phone_number:
            return obj.phone_number
        
        request = self.context.get('request')
        if request and request.user:
            user = request.user
            if user.is_authenticated:
                if user in obj.friends.all() or user==obj:
                    return obj.phone_number
        return None
    
    def get_is_friend(self,obj):
        request = self.context.get('request')
        if request and request.user:
            user = request.user
            if user.is_authenticated:
                if obj in user.friends.all():
                    return True
        return False
    
    def get_has_chat(self,obj):
        request = self.context.get('request')
        if request and request.user:
            user = request.user
            if user.is_authenticated:
                if PrivateChat.objects.find_by_users(user,obj).exists():
                    return True
        return False
    


class ProfileSerializer(serializers.ModelSerializer):

    class Meta:
        model = user_model
        fields = [
            'id',
            'username',
            'phone_number',
            'email',
            'first_name',
            'last_name',
            'profile_image',
            'biography',
            'show_phone_number',
            'show_email',
            'show_profile_image',
            'show_biography',
            'face_image',
        ]

    def update(self, instance, validated_data):
        user = super().update(instance, validated_data)
        if 'face_image' in validated_data:
            face_image = validated_data["face_image"]
            if face_image:
                face_encoding = face_recognition.face_encodings(np.array(PIL.Image.open(face_image.file).convert('RGB')))
                if face_encoding:
                    user.face_encoding = face_encoding
                    user.save()
                else:
                    raise serializers.ValidationError({"face_image":"invalid face id"})
            else:
                user.face_encoding = None
                user.save()
        return user
        