from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError

from core.models import BaseModel


class Status(BaseModel):
    name = models.CharField("статус", max_length=50, unique=True)

    def __str__(self):

        return self.name


class Type(BaseModel):
    name = models.CharField("тип", max_length=50, unique=True)

    def __str__(self):
        return self.name


class Category(BaseModel):
    type = models.ForeignKey(
        Type, on_delete=models.CASCADE,
        related_name='categories', verbose_name="тип"
    )
    name = models.CharField("категория", max_length=100)

    def __str__(self):
        return self.name


class SubCategory(BaseModel):
    category = models.ForeignKey(
        Category, on_delete=models.CASCADE,
        related_name='subcategories', verbose_name="категория"
    )
    name = models.CharField("подкатегория", max_length=100)

    def __str__(self):
        return self.name


class CashFlow(BaseModel):
    date = models.DateField(
        default=timezone.localdate,
        verbose_name=_("дата операции")
    )
    status = models.ForeignKey(
        Status, on_delete=models.PROTECT,
        verbose_name=_("статус")
    )
    type = models.ForeignKey(
        Type, on_delete=models.PROTECT,
        verbose_name=_("тип")
    )
    category = models.ForeignKey(
        Category, on_delete=models.PROTECT,
        verbose_name=_("категория")
    )
    subcategory = models.ForeignKey(
        SubCategory, on_delete=models.PROTECT,
        verbose_name=_("подкатегория")
    )
    amount = models.PositiveIntegerField(
        _("сумма, ₽")
    )
    comment = models.TextField(
        _("комментарий"),
        blank=True
    )

    class Meta:
        verbose_name = _("ДДС запись")
        verbose_name_plural = _("ДДС записи")
        ordering = ("-date", "-created_at")

    def clean(self):
        errors = {}

        if self.category_id and self.type_id:
            if self.category.type_id != self.type_id:
                errors['category'] = ValidationError(
                    _('Категория “%(cat)s” не принадлежит типу “%(type)s”'),
                    code='invalid_category',
                    params={'cat': self.category, 'type': self.type}
                )

        if self.subcategory_id and self.category_id:
            if self.subcategory.category_id != self.category_id:
                errors['subcategory'] = ValidationError(
                    _('Подкатегория “%(sub)s” не принадлежит категории “%(cat)s”'),
                    code='invalid_subcategory',
                    params={'sub': self.subcategory, 'cat': self.category}
                )

        if errors:
            raise ValidationError(errors)

    def __str__(self):
        return f"{self.date} | {self.amount}₽"
