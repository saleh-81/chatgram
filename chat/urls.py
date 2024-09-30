from django.urls import path,include
from . import views

urlpatterns = [
    path("private_chat/",views.PrivateChatView.as_view(),name='private_chat'),
    path("private_chat/<int:pk>",views.PrivateChatView.as_view(),name='private_chat_datail'),
    path("private_chat/<int:id>/messages/",views.PrivateChatMessageView,name="get_ptivate_chat_or_create"),

    path("group/",views.GroupListCreateView.as_view(),name="group"),
    path("group/<int:pk>/",views.GroupRetrieveUpdateDestroy.as_view(),name="group_detial"),
    path("group/<int:group_id>/users/",views.group_users,name="group_users"),
    path("group/<int:group_id>/users/<int:user_id>",views.group_users,name="group_users"),
    path("group/<int:group_id>/messages/",views.group_messages,name="group_users"),
    path("group/<int:group_id>/left/",views.left_group_view,name="left_group"),

    # path("group/",include("chat.routers"))
]