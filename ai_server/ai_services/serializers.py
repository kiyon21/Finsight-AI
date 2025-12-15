from rest_framework import serializers
from .models import AIAnalysis


class AIAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIAnalysis
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class FinancialInsightRequestSerializer(serializers.Serializer):
    """Serializer for financial insight requests - now accepts data directly"""
    user_id = serializers.CharField(required=True)
    analysis_type = serializers.ChoiceField(
        choices=[
            ('spending_analysis', 'Spending Analysis'),
            ('goal_recommendation', 'Goal Recommendation'),
            ('budget_suggestion', 'Budget Suggestion'),
            ('savings_advice', 'Savings Advice'),
            ('spending_pattern', 'Spending Pattern'),
        ],
        required=True
    )
    goals = serializers.ListField(
        child=serializers.DictField(),
        required=True,
        help_text="List of user goals"
    )
    income = serializers.ListField(
        child=serializers.DictField(),
        required=True,
        help_text="List of income sources"
    )
    transactions = serializers.ListField(
        child=serializers.DictField(),
        required=True,
        help_text="List of transactions"
    )
    additional_context = serializers.JSONField(required=False, default=dict)


class FinancialInsightResponseSerializer(serializers.Serializer):
    """Serializer for financial insight responses"""
    user_id = serializers.CharField()
    analysis_type = serializers.CharField()
    insights = serializers.JSONField()
    recommendations = serializers.ListField(child=serializers.CharField())
    confidence_score = serializers.FloatField(required=False)
    model_used = serializers.CharField(required=False)

