from django.contrib import admin
from .models import Status, Type, Category, SubCategory, CashFlow


class SoftDeleteAdmin(admin.ModelAdmin):
    list_filter = ('deleted',)
    readonly_fields = ('deleted', 'created_at', 'updated_at')
    actions = ['restore_selected', 'hard_delete_selected']

    def get_queryset(self, request):
        return self.model.all_objects.all()

    def delete_model(self, request, obj):
        obj.delete()

    def delete_queryset(self, request, queryset):
        queryset.delete()

    def restore_selected(self, request, queryset):
        restored = 0
        for obj in queryset:
            obj.undelete()
            restored += 1
        self.message_user(request, f"Восстановлено {restored} объектов")
    restore_selected.short_description = "Восстановить выделенные записи"

    def hard_delete_selected(self, request, queryset):
        deleted = 0
        for obj in queryset:
            obj.hard_delete()
            deleted += 1
        self.message_user(request, f"Безвозвратно удалено {deleted} объектов")
    hard_delete_selected.short_description = "Безвозвратно удалить выделенные записи"


@admin.register(Status)
class StatusAdmin(SoftDeleteAdmin):
    list_display = ('name', 'created_at', 'updated_at', 'deleted')
    search_fields = ('name',)


@admin.register(Type)
class TypeAdmin(SoftDeleteAdmin):
    list_display = ('name', 'created_at', 'updated_at', 'deleted')
    search_fields = ('name',)


@admin.register(Category)
class CategoryAdmin(SoftDeleteAdmin):
    list_display = ('name', 'type', 'created_at', 'updated_at', 'deleted')
    list_filter = ('type', 'deleted')
    search_fields = ('name',)


@admin.register(SubCategory)
class SubCategoryAdmin(SoftDeleteAdmin):
    list_display = ('name', 'category', 'created_at', 'updated_at', 'deleted')
    list_filter = ('category', 'deleted')
    search_fields = ('name',)


@admin.register(CashFlow)
class CashFlowAdmin(SoftDeleteAdmin):
    list_display = (
        'date', 'status', 'type', 'category', 'subcategory',
        'amount', 'created_at', 'updated_at', 'deleted'
    )
    list_filter = ('status', 'type', 'category', 'subcategory', 'deleted')
    search_fields = ('comment',)
    date_hierarchy = 'date'
