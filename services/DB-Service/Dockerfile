# Usamos Python como base
FROM python:3.11-slim

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos los archivos de la carpeta actual al contenedor
COPY . .

# Instalamos las librerías necesarias
# (Si tienes un requirements.txt úsalo, si no, instalamos lo básico)
RUN pip install fastapi uvicorn sqlalchemy

# Exponemos el puerto que usa tu main.py (asumo que es el 8000)
EXPOSE 8000

# Comando para arrancar la API
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

