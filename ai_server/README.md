# Finsight AI Server

Django server for AI-powered financial insights using Hugging Face transformers.

## Features

- AI-powered financial analysis using Hugging Face transformers
- Integration with main API server to fetch user data (goals, income, transactions)
- Multiple analysis types:
  - Spending Analysis
  - Goal Recommendations
  - Budget Suggestions
  - Savings Advice
  - Spending Pattern Analysis
- Analysis history tracking
- RESTful API endpoints

## Setup

### Prerequisites

- Python 3.8+
- Virtual environment (recommended)

### Installation

1. Create and activate a virtual environment:

```bash
cd ai_server
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Set up environment variables:

Create a `.env` file in the `ai_server` directory:

```env
DJANGO_SECRET_KEY=your-secret-key-here
DEBUG=True
HUGGINGFACE_API_KEY=your-huggingface-api-key
MAIN_API_URL=http://localhost:5000
```

4. Run migrations:

```bash
python manage.py migrate
```

5. Create a superuser (optional, for admin access):

```bash
python manage.py createsuperuser
```

6. Run the development server:

```bash
python manage.py runserver 8001
```

The server will be available at `http://localhost:8001`

## API Endpoints

### Base URL: `http://localhost:8001/api/ai/`

#### 1. Generate Financial Insights

**POST** `/insights/`

Generate AI-powered financial insights based on user data.

**Request Body:**
```json
{
  "user_id": "user123",
  "analysis_type": "spending_analysis",
  "additional_context": {}
}
```

**Analysis Types:**
- `spending_analysis` - Analyze spending patterns
- `goal_recommendation` - Generate goal recommendations
- `budget_suggestion` - Create budget suggestions
- `savings_advice` - Get savings advice
- `spending_pattern` - Analyze spending patterns

**Response:**
```json
{
  "user_id": "user123",
  "analysis_type": "spending_analysis",
  "insights": {
    "analysis": "AI-generated analysis...",
    "total_income": 5000.00,
    "total_expenses": 3500.00,
    "net_income": 1500.00,
    "spending_by_category": {...},
    "model_used": "gpt2"
  },
  "recommendations": [],
  "model_used": "gpt2",
  "analysis_id": 1,
  "created_at": "2025-01-15T10:30:00Z"
}
```

#### 2. Quick Insight

**POST** `/quick-insight/`

Get a quick financial overview with AI insights.

**Request Body:**
```json
{
  "user_id": "user123"
}
```

**Response:**
```json
{
  "user_id": "user123",
  "summary": {
    "total_income": 5000.00,
    "total_expenses": 3500.00,
    "net_income": 1500.00,
    "goals_count": 3,
    "transactions_count": 50
  },
  "ai_insights": "AI-generated insights...",
  "recommendations": []
}
```

#### 3. Get Analysis History

**GET** `/history/<user_id>/`

Get analysis history for a user.

**Query Parameters:**
- `analysis_type` (optional) - Filter by analysis type
- `limit` (optional, default: 10) - Limit number of results

**Example:**
```
GET /api/ai/history/user123/?analysis_type=spending_analysis&limit=5
```

#### 4. Get Analysis Detail

**GET** `/analysis/<analysis_id>/`

Get detailed information about a specific analysis.

## Configuration

### Hugging Face Models

The service uses Hugging Face transformers. You can modify the model in `ai_services/services/huggingface_service.py`:

- Default: `gpt2`
- Alternative models: `facebook/opt-1.3b`, `microsoft/DialoGPT-medium`, or fine-tuned financial models

### Main API Integration

The server fetches user data from the main API server. Configure the `MAIN_API_URL` in settings or environment variables.

## Development

### Running Tests

```bash
python manage.py test
```

### Accessing Admin Panel

1. Create a superuser: `python manage.py createsuperuser`
2. Access admin at: `http://localhost:8001/admin/`

### Database

The default database is SQLite (`db.sqlite3`). For production, consider using PostgreSQL:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'finsight_ai',
        'USER': 'your_user',
        'PASSWORD': 'your_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

## Production Deployment

1. Set `DEBUG=False` in settings
2. Configure `ALLOWED_HOSTS` appropriately
3. Use a production database (PostgreSQL recommended)
4. Set up proper authentication/authorization
5. Use environment variables for sensitive data
6. Set up HTTPS
7. Configure CORS settings for your frontend domain

## Notes

- The Hugging Face API requires an API key for some models. Get one at https://huggingface.co/settings/tokens
- For better performance, consider using local models instead of API calls
- Fine-tune models on financial data for better results
- Add rate limiting for production use
- Implement proper error handling and logging

