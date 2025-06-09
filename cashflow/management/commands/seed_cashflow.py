import random
from datetime import date, timedelta

from django.core.management.base import BaseCommand
from django.db import transaction

from cashflow.models import Status, Type, Category, SubCategory, CashFlow


class Command(BaseCommand):
    help = (
        "Заполняет справочники Status, Kind, Category и SubCategory начальными данными, "
        "а затем генерирует N тестовых записей в таблице CashFlow."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--count",
            type=int,
            default=500,
            help="Сколько записей CashFlow создать (по умолчанию: 500).",
        )

    def handle(self, *args, **options):
        count = options["count"]
        with transaction.atomic():
            self.stdout.write("Начинаем заполнение справочников...")

            statuses = ["Бизнес", "Личное", "Налог", "Прочее"]
            for name in statuses:
                obj, created = Status.objects.get_or_create(name=name)
                if created:
                    self.stdout.write(f"  • Создан Status: {name}")
                else:
                    self.stdout.write(f"  • Уже существует Status: {name}")

            types = ["Пополнение", "Списание"]
            for name in types:
                obj, created = Type.objects.get_or_create(name=name)
                if created:
                    self.stdout.write(f"  • Создан Kind: {name}")
                else:
                    self.stdout.write(f"  • Уже существует Kind: {name}")

            categories_map = {
                "Пополнение": ["Зарплата", "Продажи", "Инвестиции"],
                "Списание": ["Аренда", "Закупка товара", "Коммунальные платежи", "Налоги"],
            }
            for type_name, category_list in categories_map.items():
                try:
                    type_obj = Type.objects.get(name=type_name)
                except Type.DoesNotExist:
                    self.stderr.write(f"  ✖ Kind '{type_name}' не найден.")
                    continue

                for cat_name in category_list:
                    cat_obj, created = Category.objects.get_or_create(
                        type=type_obj,
                        name=cat_name
                    )
                    if created:
                        self.stdout.write(f"  • Создана Category: {type_name} » {cat_name}")
                    else:
                        self.stdout.write(f"  • Уже существует Category: {type_name} » {cat_name}")

            subcategories_map = {
                "Зарплата": ["Основная", "Бонусы"],
                "Продажи": ["Оптовая", "Розничная"],
                "Инвестиции": ["Дивиденды", "Капитализация"],
                "Аренда": ["Офис", "Склад"],
                "Закупка товара": ["Упаковка", "Материалы"],
                "Коммунальные платежи": ["Электричество", "Вода", "Интернет"],
                "Налоги": ["НДС", "Прибыль"],
            }
            for cat_name, subcat_list in subcategories_map.items():
                try:
                    category_obj = Category.objects.get(name=cat_name)
                except Category.DoesNotExist:
                    self.stderr.write(f"  ✖ Category '{cat_name}' не найден.")
                    continue

                for sub_name in subcat_list:
                    sub_obj, created = SubCategory.objects.get_or_create(
                        category=category_obj,
                        name=sub_name
                    )
                    if created:
                        self.stdout.write(f"  • Создана SubCategory: {cat_name} » {sub_name}")
                    else:
                        self.stdout.write(f"  • Уже существует SubCategory: {cat_name} » {sub_name}")

            self.stdout.write(self.style.SUCCESS("Справочники заполнены."))
            self.stdout.write(f"\nГенерация {count} записей в CashFlow...")

            all_statuses = list(Status.objects.all())
            all_types = list(Type.objects.all())
            type_to_categories = {
                type.id: list(type.categories.all())
                for type in all_types
            }
            category_to_subcategories = {}
            for cats in type_to_categories.values():
                for cat in cats:
                    category_to_subcategories[cat.id] = list(cat.subcategories.all())
            today = date.today()
            max_days_delta = 365

            created_count = 0
            for i in range(count):
                status_obj = random.choice(all_statuses)
                type_obj = random.choice(all_types)
                categories_for_type = type_to_categories.get(type_obj.id, [])
                if not categories_for_type:
                    continue
                category_obj = random.choice(categories_for_type)
                subcats_for_category = category_to_subcategories.get(category_obj.id, [])
                if not subcats_for_category:
                    continue
                subcategory_obj = random.choice(subcats_for_category)
                random_days = random.randint(0, max_days_delta)
                random_date = today - timedelta(days=random_days)
                amount = random.randint(100, 100_000)
                comment = f"Тестовая запись №{i + 1}"
                CashFlow.objects.create(
                    date=random_date,
                    status=status_obj,
                    type=type_obj,
                    category=category_obj,
                    subcategory=subcategory_obj,
                    amount=amount,
                    comment=comment,
                )
                created_count += 1
                if (i + 1) % 50 == 0:
                    self.stdout.write(f"  • Создано записей: {i + 1}")

            self.stdout.write(self.style.SUCCESS(
                f"\nГенерация завершена. Всего создано {created_count} записей CashFlow."
            ))