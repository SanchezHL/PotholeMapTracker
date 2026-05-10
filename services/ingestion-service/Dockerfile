# Usamos Python como base
FROM python:3.11-slim

# Directorio de trabajo dentro del contenedor
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Copiamos los archivos de la carpeta actual al contenedor
COPY . .

# Exponemos el puerto que usa tu main.py (asumo que es el 8000)
EXPOSE 8000

# Comando para arrancar la API
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

