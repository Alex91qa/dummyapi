# Используйте официальный образ Python как родительский образ
FROM python:3.9-slim

# Установите рабочую директорию
WORKDIR /app

# Скопируйте файлы в рабочую директорию
COPY requirements.txt ./
COPY grpc_services/ ./grpc_services/
COPY user_service.proto ./

# Обновите pip, setuptools и wheel
RUN pip install --upgrade pip setuptools wheel

# Установите зависимости
RUN pip install --no-cache-dir -r requirements.txt

# Установите grpcio-reflection отдельно
RUN pip install grpcio-reflection

# Скопируйте остальные файлы, если они есть в корне
COPY . .

# Установите переменную окружения для порта
ENV PORT=10000

# Укажите правильный путь к server.py
CMD ["python", "grpc_services/server.py"]
