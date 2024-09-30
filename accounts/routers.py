from rest_framework.routers import DefaultRouter

from .viewsets import UserRgisterViewSet

router = DefaultRouter()

# router.register('register',UserRgisterViewSet,basename='user_register')
# router.register('products-genericview',ProductGenericViewSet,basename='products2')


urlpatterns = router.urls