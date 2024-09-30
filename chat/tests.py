from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient,APIRequestFactory

# Create your tests here.
class ApiTest(TestCase):

    def setUp(self) -> None:
        self.client = APIClient()
        
        
        res = self.client.post(reverse("user_login"),{"username":"saleh","password":"saleh","type":"password"})
        print(res.content)
    
    def test_1(self):
        result = self.client.get(reverse("private_chat"))
        print(result.content)
        self.assertEqual(result.status_code,200)