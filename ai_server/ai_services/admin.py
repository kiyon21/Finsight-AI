from django.contrib import admin
from .models import AIAnalysis


@admin.register(AIAnalysis)
class AIAnalysisAdmin(admin.ModelAdmin):
    list_display = ['user_id', 'analysis_type', 'model_used', 'created_at']
    list_filter = ['analysis_type', 'created_at', 'model_used']
    search_fields = ['user_id', 'analysis_type']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'

