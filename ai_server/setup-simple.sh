#!/bin/bash

# Simplified setup script that skips pip upgrade

echo "Setting up Finsight AI Django server (simplified version)..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies (skip pip upgrade)
echo "Installing Python packages from requirements.txt..."
python -m pip install -r requirements.txt

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    python3 -c "from django.core.management.utils import get_random_secret_key; print(f'DJANGO_SECRET_KEY={get_random_secret_key()}')" > .env
    echo "DEBUG=True" >> .env
    echo "HUGGINGFACE_API_KEY=your-huggingface-api-key-here" >> .env
    echo "MAIN_API_URL=http://localhost:5000" >> .env
    echo ""
    echo "WARNING: Please update the .env file with your Hugging Face API key!"
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
