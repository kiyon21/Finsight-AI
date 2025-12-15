from django.db import models


class AIAnalysis(models.Model):
    """Store AI analysis results for users"""
    user_id = models.CharField(max_length=255, db_index=True)
    analysis_type = models.CharField(max_length=100)  # e.g., 'spending_insight', 'goal_recommendation'
    input_data = models.JSONField()  # Store the input data used for analysis
    result = models.JSONField()  # Store the AI-generated result
    model_used = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user_id', 'analysis_type']),
        ]

    def __str__(self):
        return f"{self.user_id} - {self.analysis_type} - {self.created_at}"

