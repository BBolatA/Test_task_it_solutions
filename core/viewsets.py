from django.http import Http404
from rest_framework import viewsets, status
from rest_framework.response import Response


class SoftDeleteModelViewSet(viewsets.ModelViewSet):
    def destroy(self, request, *args, **kwargs):
        lookup = self.lookup_field
        lookup_val = self.kwargs.get(self.lookup_url_kwarg or lookup)

        Model = self.queryset.model

        try:
            instance = self.get_queryset().get(**{lookup: lookup_val})
        except Http404:
            try:
                Model.all_objects.get(**{lookup: lookup_val})
            except Model.DoesNotExist:
                raise
            return Response(status=status.HTTP_204_NO_CONTENT)
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)