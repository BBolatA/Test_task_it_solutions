# Test-task-PIT

Приложение на Django для учёта движений денежных средств (ДС).

## 📋 Требования

- Python 3.10+
- Django 5+

Все зависимости перечислены в файле `requirements.txt`.  
Установить их можно командой:
```bash
pip install -r requirements.txt
```

## 🚀 Установка и запуск

1. **Клонировать репозиторий**
```bash
git clone https://github.com/BBolatA/Test_task_it_solutions.git
cd test_task_PIT
```

2. **Создать и активировать виртуальное окружение**
```bash
python -m venv .venv
.venv\Scripts\activate
```

3. **Установить зависимости**
```bash
pip install -r requirements.txt
```

4. **Настроить переменные окружения**
В корне проекта создайте файл `.env` со следующим содержимым:
```ini
SECRET_KEY=ваш_секретный_ключ
DEBUG=True
```
> **База данных:** по умолчанию используется SQLite3, файл `db.sqlite3` создаётся автоматически при применении миграций.

5. **Применить миграции**
```bash
python manage.py migrate
```

6. **Заполнить базу начальными данными**
Для генерации 1 000 тестовых записей выполните:
```bash
python manage.py seed_cashflow --count 1000
```

7. **(Опционально) Создать суперпользователя**
```bash
python manage.py createsuperuser
```

8. **Запустить сервер разработки**
```bash
python manage.py runserver
```
Откройте в браузере: `http://127.0.0.1:8000/`

## 📑 Документация API

- **Swagger UI:** `http://127.0.0.1:8000/swagger/`  
- **JSON/YAML схема:** `http://127.0.0.1:8000/swagger.json` / `http://127.0.0.1:8000/swagger.yaml`  
- **Redoc UI:** `http://127.0.0.1:8000/redoc/`

## 📝 Лицензия

Проект распространяется под лицензией MIT. Смотрите файл `LICENSE`.
