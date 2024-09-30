from django.urls import path,include
from . import views
from knox.views import LogoutView,LogoutAllView

urlpatterns = [
    path("register/",views.user_register_view,name="user_detial"),
    path("login/",views.LoginView.as_view(),name="user_login"),
    path("logout/",LogoutView.as_view(),name="logout"),
    path("logoutall/",LogoutAllView.as_view(),name="logoutall"),

    path('profile/',views.ProfileApiView.as_view(),name="profile"),
    path('friends/',views.FriendsView,name='friends'),
    path('friends/<int:id>',views.FriendsView,name='delete_friend'),

    path('<int:pk>',views.UserView.as_view(),name='user_data'),

    path("change_password/",views.user_change_password_view,name="change_password"),

    path("serach/",views.UserSearchView.as_view(),name="search")
]