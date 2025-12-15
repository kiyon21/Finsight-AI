from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.utils import timezone
from .serializers import (
    FinancialInsightRequestSerializer,
    FinancialInsightResponseSerializer,
    AIAnalysisSerializer
)
from .services.huggingface_service import HuggingFaceService
from .models import AIAnalysis


@api_view(['POST'])
def financial_insights(request):
    """
    Generate AI-powered financial insights based on user goals, income, and transactions.
    
    Expected payload:
    {
        "user_id": "user123",
        "analysis_type": "spending_analysis" | "goal_recommendation" | "budget_suggestion" | "savings_advice" | "spending_pattern",
        "goals": [...],  # List of user goals
        "income": [...],  # List of income sources
        "transactions": [...],  # List of transactions
        "additional_context": {}  # Optional
    }
    
    Note: This endpoint is decoupled from the main API. The caller should fetch
    the data from the main API and pass it directly to this endpoint.
    """
    serializer = FinancialInsightRequestSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    user_id = serializer.validated_data['user_id']
    analysis_type = serializer.validated_data['analysis_type']
    goals = serializer.validated_data['goals']
    income = serializer.validated_data['income']
    transactions = serializer.validated_data['transactions']
    additional_context = serializer.validated_data.get('additional_context', {})
    
    # Initialize Hugging Face service
    hf_service = HuggingFaceService()
    
    # Perform analysis based on type
    insights = {}
    model_used = None
    
    try:
        if analysis_type == 'spending_analysis':
            result = hf_service.analyze_spending_patterns(transactions, goals, income)
            insights = result
            model_used = result.get('model_used')
        
        elif analysis_type == 'goal_recommendation':
            result = hf_service.generate_goal_recommendations(goals, income, transactions)
            insights = result
            model_used = result.get('model_used')
        
        elif analysis_type == 'budget_suggestion':
            result = hf_service.generate_budget_suggestions(income, transactions, goals)
            insights = result
            model_used = result.get('model_used')
        
        elif analysis_type == 'savings_advice':
            result = hf_service.analyze_spending_advice(transactions, goals)
            insights = result
            model_used = result.get('model_used')
        
        elif analysis_type == 'spending_pattern':
            result = hf_service.analyze_spending_patterns(transactions, goals, income)
            insights = result
            model_used = result.get('model_used')
        
        else:
            return Response(
                {'error': f'Unknown analysis type: {analysis_type}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Store analysis in database
        ai_analysis = AIAnalysis.objects.create(
            user_id=user_id,
            analysis_type=analysis_type,
            input_data={
                'goals': goals,
                'income': income,
                'transactions_count': len(transactions),
                'additional_context': additional_context
            },
            result=insights,
            model_used=model_used
        )
        
        # Extract recommendations from insights
        recommendations = []
        if isinstance(insights, dict):
            # Try different possible keys for recommendations
            recommendations = (
                insights.get('recommendations', []) or
                insights.get('actionable_tips', []) or
                []
            )
            # If recommendations is a string, try to parse it
            if isinstance(recommendations, str):
                recommendations = [rec.strip() for rec in recommendations.split('\n') if rec.strip()]
        
        # Prepare response
        response_data = {
            'user_id': user_id,
            'analysis_type': analysis_type,
            'insights': insights,
            'recommendations': recommendations if recommendations else [],
            'model_used': model_used,
            'analysis_id': ai_analysis.id,
            'created_at': ai_analysis.created_at.isoformat()
        }
        
        response_serializer = FinancialInsightResponseSerializer(data=response_data)
        if response_serializer.is_valid():
            return Response(response_serializer.validated_data, status=status.HTTP_200_OK)
        else:
            return Response(response_data, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response(
            {'error': f'Error generating insights: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def get_analysis_history(request, user_id):
    """
    Get analysis history for a user.
    
    Query params:
    - analysis_type: Filter by analysis type (optional)
    - limit: Limit number of results (default: 10)
    """
    analysis_type = request.query_params.get('analysis_type', None)
    limit = int(request.query_params.get('limit', 10))
    
    queryset = AIAnalysis.objects.filter(user_id=user_id)
    
    if analysis_type:
        queryset = queryset.filter(analysis_type=analysis_type)
    
    queryset = queryset[:limit]
    
    serializer = AIAnalysisSerializer(queryset, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
def get_analysis_detail(request, analysis_id):
    """Get detailed information about a specific analysis"""
    try:
        analysis = AIAnalysis.objects.get(id=analysis_id)
        serializer = AIAnalysisSerializer(analysis)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except AIAnalysis.DoesNotExist:
        return Response(
            {'error': 'Analysis not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
def quick_insight(request):
    """
    Quick insight endpoint that provides a general financial overview.
    
    Expected payload:
    {
        "user_id": "user123",
        "goals": [...],  # List of user goals
        "income": [...],  # List of income sources
        "transactions": [...]  # List of transactions
    }
    
    Note: This endpoint is decoupled from the main API. The caller should fetch
    the data from the main API and pass it directly to this endpoint.
    """
    user_id = request.data.get('user_id')
    goals = request.data.get('goals', [])
    income = request.data.get('income', [])
    transactions = request.data.get('transactions', [])
    
    if not user_id:
        return Response(
            {'error': 'user_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not isinstance(goals, list) or not isinstance(income, list) or not isinstance(transactions, list):
        return Response(
            {'error': 'goals, income, and transactions must be arrays'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Calculate basic metrics
    total_income = sum(float(inc.get('amount', 0)) for inc in income)
    total_expenses = sum(
        float(tx.get('amount', 0)) 
        for tx in transactions 
        if tx.get('isExpense', True)
    )
    net_income = total_income - total_expenses
    
    # Get AI-powered spending analysis
    hf_service = HuggingFaceService()
    spending_analysis = hf_service.analyze_spending_patterns(transactions, goals, income)
    
    # Extract recommendations
    recommendations = spending_analysis.get('recommendations', [])
    if not recommendations:
        recommendations = []
    
    # Store analysis in database (like other insights)
    ai_analysis = AIAnalysis.objects.create(
        user_id=user_id,
        analysis_type='quick_insight',
        input_data={
            'goals': goals,
            'income': income,
            'transactions_count': len(transactions),
        },
        result={
            'summary': {
                'total_income': total_income,
                'total_expenses': total_expenses,
                'net_income': net_income,
                'goals_count': len(goals),
                'transactions_count': len(transactions),
            },
            'ai_insights': spending_analysis.get('analysis', 'Analysis unavailable'),
            'recommendations': recommendations,
            'spending_by_category': spending_analysis.get('spending_by_category', {}),
        },
        model_used=spending_analysis.get('model_used')
    )
    
    return Response({
        'user_id': user_id,
        'summary': {
            'total_income': total_income,
            'total_expenses': total_expenses,
            'net_income': net_income,
            'goals_count': len(goals),
            'transactions_count': len(transactions),
        },
        'ai_insights': spending_analysis.get('analysis', 'Analysis unavailable'),
        'recommendations': recommendations,
        'spending_by_category': spending_analysis.get('spending_by_category', {}),
        'analysis_id': ai_analysis.id,
        'created_at': ai_analysis.created_at.isoformat(),
    }, status=status.HTTP_200_OK)
