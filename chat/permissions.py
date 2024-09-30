from rest_framework import permissions


class IsGroupAdminOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # pk = request.resolver_match.kwargs.get('pk')
        if request.method in permissions.SAFE_METHODS:
            return True
        
        return obj.admin == request.user