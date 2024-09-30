from django.contrib.auth.models import AnonymousUser
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from urllib.parse import parse_qs

from knox.auth import TokenAuthentication


@database_sync_to_async
def get_user(token_key):
    knoxAuth = TokenAuthentication()
    try:
        user, auth_token = knoxAuth.authenticate_credentials(token_key.encode("utf-8"))
        return user
    except:
        return AnonymousUser()

class TokenAuthMiddleware(BaseMiddleware):
    def __init__(self, inner):
        super().__init__(inner)

    async def __call__(self, scope, receive, send):
        query_dict = parse_qs(scope["query_string"].decode())
        if "token" in query_dict:
            scope['user'] = await get_user(query_dict["token"][0])
        else:
            scope['user'] = AnonymousUser()
        return await super().__call__(scope, receive, send)
    