from django.views.generic import TemplateView
from rest_framework.filters import OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.pagination import PageNumberPagination

from core.viewsets import SoftDeleteModelViewSet
from .models import Status, Type as Kind, Category, SubCategory, CashFlow
from .serializers import (
    StatusSerializer,
    TypeSerializer,
    CategorySerializer,
    SubCategorySerializer,
    CashFlowSerializer,
)
from .filters import CashFlowFilter


# Page views
class CashFlowListView(TemplateView):
    template_name = 'cashflow/cashflow_list.html'
    extra_context = {
        'page_title': 'Записи ДДС'
    }


class CashFlowFormView(TemplateView):
    template_name = 'cashflow/cashflow_form.html'


class CatalogManagementView(TemplateView):
    template_name = 'catalog/catalog_management.html'
    extra_context = {
        'page_title': 'Управление справочниками'
    }


# DRF API
class StatusViewSet(SoftDeleteModelViewSet):
    queryset = Status.objects.all()
    serializer_class = StatusSerializer


class KindViewSet(SoftDeleteModelViewSet):
    queryset = Kind.objects.all()
    serializer_class = TypeSerializer


class CategoryViewSet(SoftDeleteModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class SubCategoryViewSet(SoftDeleteModelViewSet):
    queryset = SubCategory.objects.select_related('category').all()
    serializer_class = SubCategorySerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category']


class CashFlowPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 20


class CashFlowViewSet(SoftDeleteModelViewSet):
    serializer_class = CashFlowSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = CashFlowFilter
    ordering_fields = ['date', 'amount']
    pagination_class = CashFlowPagination

    def get_queryset(self):
        qs = CashFlow.objects.select_related(
            'status', 'type', 'category', 'subcategory'
        ).order_by('-date')
        return qs.filter(type__deleted__isnull=True)
