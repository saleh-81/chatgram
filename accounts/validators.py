from re import match
from django.core.exceptions import ValidationError

def validate_phone_number(phone_number):
    if not match(r"^09\d{9}$",phone_number):
        raise ValidationError("Invalid phone number!")