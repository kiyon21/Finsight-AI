#!/bin/bash

# Setup script for Finsight AI Django server

echo "Setting up Finsight AI Django server..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Creating .env file from example..."
    # Generate secret key after Django is installed
    SECRET_KEY=$(python manage.py shell -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())" 2>/dev/null)
    if [ -z "$SECRET_KEY" ]; then
        # Fallback if Django command fails
        if command -v openssl &> /dev/null; then
            SECRET_KEY="django-insecure-$(openssl rand -hex 32)"
        else
            SECRET_KEY="django-insecure-$(python3 -c 'import secrets; print(secrets.token_urlsafe(50))')"
        fi
    fi
    echo "DJANGO_SECRET_KEY=$SECRET_KEY" > .env
    echo "DEBUG=True" >> .env
    echo "HUGGINGFACE_API_KEY=your-huggingface-api-key-here" >> .env
    echo "MAIN_API_URL=http://localhost:5000" >> .env
    echo ""
    echo "WARNING: Please update the .env file with your Hugging Face API key!"
    echo "   See ENV_EXAMPLE.md for instructions."
fi

# Run migrations
echo "Running database migrations..."
python manage.py migrate

echo ""
echo "Setup complete!"
echo ""
echo "To start the server, run:"
echo "  source venv/bin/activate"
echo "  python manage.py runserver"
echo ""
echo "To create a superuser (for admin access):"
echo "  python manage.py createsuperuser"

