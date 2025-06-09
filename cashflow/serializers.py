from rest_framework import serializers
from rest_framework.validators import UniqueTogetherValidator, UniqueValidator

from .models import Status, Type, Category, SubCategory, CashFlow


class StatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Status
        fields = '__all__'


class TypeSerializer(serializers.ModelSerializer):
    name = serializers.CharField(
        validators=[
            UniqueValidator(
                queryset=Type.objects.all(),
                message='Тип с таким названием уже существует.'
            )
        ],
        error_messages={
            'blank':    'Поле «Тип» не может быть пустым.',
            'required': 'Поле «Тип» обязательно для заполнения.'
        }
    )

    class Meta:
        model = Type
        fields = '__all__'


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'
        extra_kwargs = {
            'type': {
                'error_messages': {
                    'unique': 'Категория с таким типом уже существует.'
                }
            },
            'name': {
                'error_messages': {
                    'blank':    'Поле «Категория» не может быть пустым.',
                    'required': 'Поле «Категория» обязательно для заполнения.'
                }
            }
        }
        validators = [
            UniqueTogetherValidator(
                queryset=Category.objects.all(),
                fields=['type', 'name'],
                message='Категория с таким типом и названием уже существует.'
            )
        ]


class SubCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SubCategory
        fields = '__all__'


class CashFlowSerializer(serializers.ModelSerializer):
    status = serializers.PrimaryKeyRelatedField(queryset=Status.objects.all())
    type = serializers.PrimaryKeyRelatedField(queryset=Type.objects.all())
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all())
    subcategory = serializers.PrimaryKeyRelatedField(queryset=SubCategory.objects.all())
    status_name = serializers.CharField(source='status.name', read_only=True)
    type_name = serializers.CharField(source='type.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    subcategory_name = serializers.CharField(source='subcategory.name', read_only=True)

    class Meta:
        model = CashFlow
        fields = [
            'id', 'date', 'amount', 'comment',
            'status', 'type', 'category', 'subcategory',
            'status_name', 'type_name', 'category_name', 'subcategory_name',
        ]
