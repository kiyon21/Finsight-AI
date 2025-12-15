"""
Service to fetch user data from the main API server
"""
import requests
from django.conf import settings
from typing import Dict, List, Optional


class DataFetcher:
    """Fetches user data (goals, income, transactions) from the main API server"""
    
    def __init__(self, auth_token: Optional[str] = None):
        self.base_url = settings.MAIN_API_URL
        self.timeout = 10
        self.auth_token = auth_token
    
    def _make_request(self, endpoint: str, method: str = 'GET', data: Optional[Dict] = None) -> Optional[Dict]:
        """Make HTTP request to the main API"""
        url = f"{self.base_url}{endpoint}"
        headers = {}
        
        # Add authentication header if token is provided
        if self.auth_token:
            headers['Authorization'] = f'Bearer {self.auth_token}'
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=self.timeout)
            elif method == 'POST':
                response = requests.post(url, headers=headers, json=data, timeout=self.timeout)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            # Handle 403 Forbidden - likely authentication required
            if response.status_code == 403:
                print(f"403 Forbidden: Access denied to {url}. Authentication may be required.")
                if not self.auth_token:
                    print("Hint: Try providing an auth_token (Firebase ID token) in the request.")
                return None
            
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 403:
                print(f"403 Forbidden: Access denied to {url}. Authentication may be required.")
            else:
                print(f"HTTP error fetching data from {url}: {e}")
            return None
        except requests.exceptions.RequestException as e:
            print(f"Error fetching data from {url}: {e}")
            return None
    
    def get_user_goals(self, user_id: str) -> List[Dict]:
        """Fetch user goals from the main API"""
        endpoint = f"/api/users/{user_id}/goals"
        result = self._make_request(endpoint)
        return result if result else []
    
    def get_user_income(self, user_id: str) -> List[Dict]:
        """Fetch user income sources from the main API"""
        endpoint = f"/api/users/{user_id}/income"
        result = self._make_request(endpoint)
        return result if result else []
    
    def get_user_transactions(self, user_id: str, limit: Optional[int] = None, 
                             start_date: Optional[str] = None, 
                             end_date: Optional[str] = None) -> List[Dict]:
        """Fetch user transactions from the main API"""
        endpoint = f"/api/transactions/{user_id}/transactions"
        params = {}
        if limit:
            params['limit'] = limit
        if start_date:
            params['startDate'] = start_date
        if end_date:
            params['endDate'] = end_date
        
        # Build query string
        if params:
            query_string = '&'.join([f"{k}={v}" for k, v in params.items()])
            endpoint = f"{endpoint}?{query_string}"
        
        result = self._make_request(endpoint)
        return result if result else []
    
    def get_user_data(self, user_id: str) -> Dict:
        """Get all user data (goals, income, transactions)"""
        return {
            'goals': self.get_user_goals(user_id),
            'income': self.get_user_income(user_id),
            'transactions': self.get_user_transactions(user_id, limit=100),  # Get last 100 transactions
        }
