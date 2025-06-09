from django.urls import path, include
from rest_framework import routers
from .views import (
    CashFlowListView, CashFlowFormView, CatalogManagementView,
    StatusViewSet, KindViewSet, CategoryViewSet, SubCategoryViewSet, CashFlowViewSet
)

router = routers.DefaultRouter()
router.register(r'status', StatusViewSet, basename='status')
router.register(r'kind',   KindViewSet,   basename='kind')
router.register(r'category', CategoryViewSet, basename='category')
router.register(r'subcategory', SubCategoryViewSet, basename='subcategory')
router.register(r'cashflow', CashFlowViewSet, basename='cashflow')

urlpatterns = [
    # DRF API
    path('api/', include(router.urls)),

    # Страницы
    path('', CashFlowListView.as_view(), name='cashflow-list'),
    path('cashflow/new/', CashFlowFormView.as_view(), name='cashflow-new'),
    path('cashflow/<int:pk>/edit/', CashFlowFormView.as_view(), name='cashflow-edit'),
    path('catalog/', CatalogManagementView.as_view(), name='catalog-management'),
]
