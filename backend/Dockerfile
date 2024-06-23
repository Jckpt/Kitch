# Użyj oficjalnego obrazu Python jako bazowego
FROM python:3.11-alpine

# Ustaw katalog roboczy
WORKDIR /app

# Skopiuj plik requirements.txt i zainstaluj zależności
COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Skopiuj resztę plików aplikacji do kontenera
COPY . .

# Otwórz port 3000
EXPOSE 3000

# Uruchom aplikację
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3000"]
