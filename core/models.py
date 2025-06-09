from django.db import models
from django.db.models import ProtectedError
from django.utils.translation import gettext_lazy as _
from safedelete.models import SafeDeleteModel, SOFT_DELETE
from safedelete.managers import SafeDeleteManager, SafeDeleteAllManager


class BaseModel(SafeDeleteModel):
    _safedelete_policy = SOFT_DELETE

    created_at = models.DateTimeField(
        _("дата создания"),
        db_index=True,
        auto_now_add=True
    )
    updated_at = models.DateTimeField(
        _("дата обновления"),
        db_index=True,
        auto_now=True
    )

    objects = SafeDeleteManager()
    all_objects = SafeDeleteAllManager()

    class Meta:
        abstract = True

    def delete(self, using=None, keep_parents=False):
        try:
            return models.Model.delete(self, using=using, keep_parents=keep_parents)
        except ProtectedError:
            return super(BaseModel, self).delete(using=using)
