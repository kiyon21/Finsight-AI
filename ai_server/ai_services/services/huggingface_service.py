"""
Service for interacting with Hugging Face transformers using OpenAI-compatible API
"""
import json
from typing import Dict, List, Optional
from django.conf import settings
from openai import OpenAI


class HuggingFaceService:
    """Service for using Hugging Face transformers for financial insights"""
    
    def __init__(self):
        self.api_key = settings.HF_TOKEN
        self.base_url = settings.HUGGINGFACE_ROUTER_URL
        
        # Validate API key
        if not self.api_key:
            print("WARNING: HF_TOKEN is not set in environment variables. Hugging Face API calls will fail.")
            print("Please set HF_TOKEN in your .env file with your Hugging Face API token.")
        
        self.client = OpenAI(
            base_url=self.base_url,
            api_key=self.api_key,
        )
        self.default_model = "openai/gpt-oss-120b:groq"
    
    def generate_text(self, prompt: str, model_name: Optional[str] = None, 
                     max_tokens: int = 500, system_message: Optional[str] = None) -> Optional[str]:
        """Generate text using a language model via OpenAI-compatible API"""
        model = model_name or self.default_model
        
        # Check if API key is set
        if not self.api_key:
            print("Error: HF_TOKEN is not set. Cannot call Hugging Face API.")
            return None
        
        # Default system message for financial analysis
        default_system = "You are a helpful financial advisor assistant. Analyze financial data and provide practical, actionable insights and recommendations. Always provide helpful responses to financial questions."
        system_msg = system_message or default_system
        
        # Check for refusal patterns
        refusal_patterns = [
            "i'm sorry",
            "i can't help",
            "cannot help",
            "unable to",
            "not able to",
            "can't help with that"
        ]
        
        try:
            messages = []
            if system_msg:
                messages.append({"role": "system", "content": system_msg})
            messages.append({"role": "user", "content": prompt})
            
            completion = self.client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=0.7,  # Add some creativity to avoid overly cautious responses
            )
            
            if completion.choices and len(completion.choices) > 0:
                response = completion.choices[0].message.content.strip()
                
                # Check if response is a refusal
                response_lower = response.lower()
                if any(pattern in response_lower for pattern in refusal_patterns):
                    print(f"Warning: Model refused to respond. Response: {response[:100]}...")
                    return None
                
                return response
            return None
        except Exception as e:
            error_msg = str(e)
            # Check for authentication errors
            if "401" in error_msg or "Unauthorized" in error_msg or "credentials" in error_msg.lower():
                print(f"Authentication error calling Hugging Face model {model}: {error_msg}")
                print("Please check that your HF_TOKEN is valid and has the correct permissions.")
            elif "404" in error_msg or "not found" in error_msg.lower():
                print(f"Model {model} not found. Please check the model name.")
            else:
                print(f"Error calling Hugging Face model {model}: {error_msg}")
            return None
    
    def analyze_spending_patterns(self, transactions: List[Dict], goals: List[Dict], 
                                  income: List[Dict]) -> Dict:
        """Analyze spending patterns using AI"""
        # Prepare context for the AI model
        total_income = sum(float(inc.get('amount', 0)) for inc in income)
        total_expenses = sum(
            float(tx.get('amount', 0)) 
            for tx in transactions 
            if tx.get('isExpense', True)
        )
        
        # Categorize spending
        spending_by_category = {}
        for tx in transactions:
            if tx.get('isExpense', True):
                category = tx.get('personalFinanceCategory', {}).get('primary', 'OTHER')
                amount = float(tx.get('amount', 0))
                spending_by_category[category] = spending_by_category.get(category, 0) + amount
        
        # Create prompt for analysis - more direct and conversational
        prompt = f"""Here's a user's financial summary:

Monthly Income: ${total_income:.2f}
Monthly Expenses: ${total_expenses:.2f}
Net Income: ${total_income - total_expenses:.2f}

Spending breakdown by category:
{json.dumps(spending_by_category, indent=2)}

Financial goals:
{json.dumps(goals, indent=2)}

Please analyze this financial situation and provide:
1. Key insights about their spending patterns
2. Specific areas where they could reduce expenses
3. How their current spending aligns with their goals
4. Practical recommendations to improve their financial health

Write a clear, helpful analysis:"""
        
        analysis = self.generate_text(
            prompt, 
            max_tokens=800
        )
        
        # Extract recommendations from analysis if present
        recommendations = []
        if analysis:
            # Try to extract numbered recommendations
            lines = analysis.split('\n')
            for line in lines:
                if any(line.strip().startswith(f"{i}.") for i in range(1, 10)):
                    recommendations.append(line.strip())
        
        return {
            'analysis': analysis or "Unable to generate analysis at this time.",
            'recommendations': recommendations if recommendations else [
                "Review your spending categories regularly",
                "Set up automatic savings transfers",
                "Track progress towards your financial goals"
            ],
            'total_income': total_income,
            'total_expenses': total_expenses,
            'net_income': total_income - total_expenses,
            'spending_by_category': spending_by_category,
            'model_used': self.default_model
        }
    
    def generate_goal_recommendations(self, goals: List[Dict], income: List[Dict], 
                                      transactions: List[Dict]) -> Dict:
        """Generate personalized goal recommendations"""
        total_income = sum(float(inc.get('amount', 0)) for inc in income)
        current_savings = sum(
            float(goal.get('current_amount', 0)) 
            for goal in goals
        )
        
        prompt = f"""A user has the following financial situation:

Monthly Income: ${total_income:.2f}
Current Savings: ${current_savings:.2f}
Number of existing goals: {len(goals)}

Please suggest 3-5 specific financial goals that would be appropriate for this person. For each goal, include:
- The goal name
- Target amount
- Recommended timeline
- Monthly contribution needed
- Priority level (high/medium/low)

Provide practical, achievable recommendations:"""
        
        recommendations_text = self.generate_text(
            prompt,
            max_tokens=600
        )
        
        # Extract recommendations as a list
        recommendations_list = []
        if recommendations_text:
            lines = recommendations_text.split('\n')
            for line in lines:
                line = line.strip()
                if line and (line.startswith('-') or line.startswith('•') or 
                           any(line.startswith(f"{i}.") for i in range(1, 10))):
                    # Clean up the recommendation
                    clean_line = line.lstrip('-•0123456789. ').strip()
                    if clean_line:
                        recommendations_list.append(clean_line)
        
        return {
            'recommendations': recommendations_list if recommendations_list else [
                "Build an emergency fund covering 3-6 months of expenses",
                "Maximize contributions to retirement accounts",
                "Pay off high-interest debt first"
            ],
            'recommendations_text': recommendations_text or "Unable to generate recommendations at this time.",
            'current_savings': current_savings,
            'model_used': self.default_model
        }
    
    def generate_budget_suggestions(self, income: List[Dict], transactions: List[Dict], 
                                    goals: List[Dict]) -> Dict:
        """Generate budget suggestions based on income and spending"""
        monthly_income = sum(
            float(inc.get('amount', 0)) 
            for inc in income 
            if inc.get('frequency', '').lower() in ['monthly', 'weekly', 'bi-weekly']
        )
        
        # Calculate average monthly expenses
        expenses = [float(tx.get('amount', 0)) for tx in transactions if tx.get('isExpense', True)]
        avg_monthly_expenses = sum(expenses) / max(len(expenses), 1)
        
        # Calculate required savings for goals
        monthly_goal_contributions = sum(
            float(goal.get('monthly_contribution', 0)) 
            for goal in goals
        )
        
        prompt = f"""Create a monthly budget plan for someone with:

Monthly Income: ${monthly_income:.2f}
Average Monthly Expenses: ${avg_monthly_expenses:.2f}
Monthly Goal Contributions: ${monthly_goal_contributions:.2f}

Please provide a detailed budget breakdown that includes:
1. Essential expenses (should be 50-60% of income)
2. Savings and goal contributions (should be 20-30% of income)
3. Discretionary spending (should be 10-20% of income)
4. Specific allocations for different spending categories
5. Practical tips for staying within this budget

Write a clear, actionable budget plan:"""
        
        budget_plan = self.generate_text(
            prompt,
            max_tokens=700
        )
        
        return {
            'budget_plan': budget_plan or "Unable to generate budget plan at this time.",
            'monthly_income': monthly_income,
            'avg_monthly_expenses': avg_monthly_expenses,
            'monthly_goal_contributions': monthly_goal_contributions,
            'available_for_discretionary': monthly_income - avg_monthly_expenses - monthly_goal_contributions,
            'model_used': self.default_model
        }
    
    def analyze_spending_advice(self, transactions: List[Dict], goals: List[Dict]) -> Dict:
        """Provide personalized spending advice"""
        # Identify top spending categories
        category_spending = {}
        for tx in transactions:
            if tx.get('isExpense', True):
                category = tx.get('personalFinanceCategory', {}).get('primary', 'OTHER')
                amount = float(tx.get('amount', 0))
                category_spending[category] = category_spending.get(category, 0) + amount
        
        top_categories = sorted(category_spending.items(), key=lambda x: x[1], reverse=True)[:5]
        
        prompt = f"""A user's top spending categories are:
{json.dumps(dict(top_categories), indent=2)}

Their financial goals are:
{json.dumps(goals, indent=2)}

Please provide personalized spending advice that includes:
1. Analysis of their current spending habits
2. Specific areas where they could reduce expenses
3. Actionable tips to cut costs in their top spending categories
4. How to better align their spending with their financial goals

Provide practical, helpful advice:"""
        
        advice = self.generate_text(
            prompt,
            max_tokens=600
        )
        
        # Extract actionable tips
        tips = []
        if advice:
            lines = advice.split('\n')
            for line in lines:
                line = line.strip()
                if line and (line.startswith('-') or line.startswith('•') or 
                           any(line.startswith(f"{i}.") for i in range(1, 10))):
                    clean_line = line.lstrip('-•0123456789. ').strip()
                    if clean_line:
                        tips.append(clean_line)
        
        return {
            'advice': advice or "Unable to generate advice at this time.",
            'actionable_tips': tips if tips else [
                "Review subscriptions and cancel unused services",
                "Use cashback credit cards for regular purchases",
                "Meal plan to reduce food waste and spending"
            ],
            'top_categories': dict(top_categories),
            'model_used': self.default_model
        }
