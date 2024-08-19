# Используйте базовый образ Python
FROM python:3.9-slim

# Установите рабочую директорию
WORKDIR /app

# Копируйте файлы проекта в контейнер
COPY requirements.txt ./
COPY user_service.proto ./
COPY grpc_services/ ./grpc_services/

# Установите зависимости
RUN pip install --no-cache-dir -r requirements.txt

# Скопируйте остальные файлы
COPY . .

# Установите переменную окружения для порта
ENV PORT 10000

# Запустите сервер
CMD ["python", "grpc_services/server.py"]
