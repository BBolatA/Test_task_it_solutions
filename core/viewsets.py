from django.http import Http404
from rest_framework import viewsets, status
from rest_framework.response import Response

from cashflow.models import CashFlow
from cashflow.serializers import CashFlowSerializer


class SoftDeleteModelViewSet(viewsets.ModelViewSet):
    def destroy(self, request, *args, **kwargs):
        lookup = self.lookup_field
        lookup_val = kwargs.get(self.lookup_url_kwarg or lookup)

        qs = self.get_queryset()
        Model = qs.model

        try:
            instance = qs.get(**{lookup: lookup_val})
        except Model.DoesNotExist:
            try:
                deleted = Model.all_objects.get(**{lookup: lookup_val})
                return Response(status=status.HTTP_204_NO_CONTENT)
            except Model.DoesNotExist:
                raise Http404
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CashFlowViewSet(SoftDeleteModelViewSet):
    queryset = CashFlow.objects.all()
    serializer_class = CashFlowSerializer
