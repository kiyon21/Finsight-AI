from django.urls import path
from . import views

app_name = 'ai_services'

urlpatterns = [
    path('insights/', views.financial_insights, name='financial_insights'),
    path('quick-insight/', views.quick_insight, name='quick_insight'),
    path('history/<str:user_id>/', views.get_analysis_history, name='analysis_history'),
    path('analysis/<int:analysis_id>/', views.get_analysis_detail, name='analysis_detail'),
]

