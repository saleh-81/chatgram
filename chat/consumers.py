import json

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.auth import login,logout
from channels.db import database_sync_to_async
from django.forms.models import model_to_dict
from accounts.models import CustomUser

from .models import PrivateChat,PrivateChatMessage
from .serializers import PrivateChatSerializer,PrivateChatMessageSerializer

from django.contrib.auth.models import AnonymousUser
from knox.auth import TokenAuthentication
from urllib.parse import parse_qs
from django.utils import timezone
from datetime import datetime
from django.core.files.base import ContentFile
import base64

class ChatConsumer(AsyncWebsocketConsumer):

    @database_sync_to_async
    def get_private_chat(self,user1:CustomUser,user2:CustomUser):
        return PrivateChat.objects.get_or_create(user1,user2)
    
    @database_sync_to_async
    def get_room_name(self,private_chat:PrivateChat):
        return private_chat.room_name

    @database_sync_to_async
    def get_user(self,id:int):
        try:
            return CustomUser.objects.get(id=id)
        except:
            return AnonymousUser()
    
    @database_sync_to_async
    def save_message(self,private_chat,user,text,direction,image_file):
        return PrivateChatMessage.objects.create(
            private_chat=private_chat,
            user=user,
            message=text,
            direction=direction,
            image = image_file,
        )
        

    async def connect(self):
        self.room_name = None
        self.room_group_name = None

        self.user:CustomUser = self.scope["user"]
        self.cross_user = AnonymousUser()
        if self.user.is_authenticated:

            user_id = self.scope["url_route"]["kwargs"]["user_id"]
            self.cross_user = await self.get_user(user_id)
            if self.cross_user.is_authenticated:
                
                self.private_chat = await self.get_private_chat(self.user,self.cross_user)
                self.room_name = await self.get_room_name(self.private_chat)
                self.room_group_name = f"private-chat-{self.room_name}"
            
                await self.channel_layer.group_add(
                        self.room_group_name,
                        self.channel_name
                        )

                await self.accept()

            else:
                await self.close()
        else:
            await self.close()

    async def disconnect(self, close_code):
        if self.room_group_name:
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
                )

    async def receive(self, text_data):
        self.cross_user = await self.get_user(self.cross_user.id)
        self.user = await self.get_user(self.user.id)

        if self.user.is_authenticated and self.cross_user.is_authenticated:
            text_data_json = json.loads(text_data)
            
            image_data = text_data_json["image"]
            text = text_data_json["text"].strip()
            direction = text_data_json["dir"]
            

            if text or image_data:
                image_file = None
                if image_data:
                    try:
                        format, imgstr = image_data.split(';base64,') 
                        print(format)
                        ext = format.split('/')[-1]
                        image_file = ContentFile(base64.b64decode(imgstr), name=f"message_image.{ext}")
                    except:
                        print("invalid image")

                self.private_chat = await self.get_private_chat(self.user,self.cross_user)
                message = await self.save_message(self.private_chat,self.user,text,direction,image_file)
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "chat.message",
                        "message": message,
                    }
                )
                
        else:
            print("invalid users! chat soket closed.")
            await self.close()

    async def chat_message(self, event):
        message = event["message"]
        message_data = PrivateChatMessageSerializer(message).data
        print(message_data)
        await self.send(text_data=json.dumps(message_data))