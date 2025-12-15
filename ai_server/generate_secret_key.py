#!/usr/bin/env python3
"""
Generate a Django secret key for use in .env file
"""
import sys
import os

# Add the project directory to the path so we can import Django utilities
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from django.core.management.utils import get_random_secret_key
    secret_key = get_random_secret_key()
    print(f"DJANGO_SECRET_KEY={secret_key}")
except ImportError:
    # Fallback if Django is not installed yet
    import secrets
    import string
    
    # Generate a 50-character random string similar to Django's secret key
    chars = string.ascii_letters + string.digits + '!@#$%^&*(-_=+)'
    secret_key = ''.join(secrets.choice(chars) for _ in range(50))
    print(f"DJANGO_SECRET_KEY={secret_key}")
    print("\nNote: This is a fallback key. For production, install Django and use:")
    print("  python manage.py shell -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'")

