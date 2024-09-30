from rest_framework.routers import DefaultRouter


from .viewsets import GroupViewSet
 
# app_name="apiv2"

router = DefaultRouter()

router.register('',GroupViewSet,basename="group")
router.register('<int:pk>/users/',GroupViewSet,basename="group_users")


urlpatterns = router.urls