# TheBlueRed Staj Projesi

FastAPI backend + React frontend + PostgreSQL ile geliştirilmiş, JWT authentication içeren bir web uygulaması. Google Gemini API kullanarak soru-cevap yapabilen bir yapay zeka asistanı sunar.

## Özellikler
- Kullanıcı kayıt/giriş (JWT tabanlı authentication)
- Şifreler bcrypt ile hashlenerek saklanır
- PostgreSQL veritabanı ile kalıcı veri depolama
- Google Gemini API entegrasyonu (soru-cevap)
- React tabanlı, modern arayüzlü web uygulaması
- Docker Compose ile backend + veritabanının tek komutla ayağa kalkması

## Teknolojiler
- **Backend:** FastAPI, SQLAlchemy, python-jose (JWT), passlib (bcrypt)
- **Veritabanı:** PostgreSQL
- **Frontend:** React (Vite), axios
- **AI:** Google Gemini API
- **Konteynerleştirme:** Docker, Docker Compose

## Proje Yapısı
final-TBR/
├── staj-backend/
│ ├── main.py # FastAPI uygulaması ve endpoint'ler
│ ├── auth.py # JWT ve şifre hashleme fonksiyonları
│ ├── database.py # SQLAlchemy veritabanı bağlantısı
│ ├── models.py # Veritabanı modelleri (Kullanici)
│ ├── requirements.txt # Python bağımlılıkları
│ ├── Dockerfile # Backend için Docker image tanımı
│ └── docker-compose.yml # Backend + PostgreSQL orkestrasyon
└── staj-frontend/
├── src/
│ ├── App.jsx # Ana React bileşeni (giriş/kayıt + chat)
│ └── App.css # Stil dosyası
└── package.json

## Gereksinimler
- Python 3.14+
- Node.js 18+
- Docker Desktop (backend'i Docker ile çalıştırmak için)
- Bir Google Gemini API anahtarı ([aistudio.google.com](https://aistudio.google.com))

---

## Kurulum — Backend (Docker ile, Önerilen)

1. Repoyu klonla:
git clone https://github.com/micheisaki/final-TBR.git
cd final-TBR/staj-backend

2. `staj-backend` klasöründe bir `.env` dosyası oluştur:
GEMINI_API_KEY=senin_api_keyin
SECRET_KEY=uzun_ve_rastgele_bir_anahtar

3. Docker Compose ile başlat:
docker-compose up --build

4. API artık `http://localhost:8000` adresinde çalışıyor. Swagger dokümantasyonu için: `http://localhost:8000/docs`

---

## Kurulum — Backend (Docker Olmadan, Manuel)

1. `staj-backend` klasörüne gir, sanal ortam oluştur ve aktifleştir:

   **macOS:**
cd staj-backend
python -m venv venv
source venv/bin/activate

   **Windows:**
cd staj-backend
python -m venv venv
venv\Scripts\activate

2. Bağımlılıkları kur:
pip install -r requirements.txt

3. PostgreSQL'i kendi bilgisayarında kurup çalıştır, bir veritabanı oluştur (örn. `staj_db`).

4. `.env` dosyası oluştur:
GEMINI_API_KEY=senin_api_keyin
SECRET_KEY=uzun_ve_rastgele_bir_anahtar
DATABASE_URL=postgresql://kullanici_adin@localhost:5432/staj_db

5. Sunucuyu başlat:
uvicorn main:app --reload


## Kurulum — Frontend

1. Frontend klasörüne geç:
cd staj-frontend

2. Bağımlılıkları kur:
npm install

3. Geliştirme sunucusunu başlat:
npm run dev

4. Tarayıcıdan `http://localhost:5173` adresine git.

---

## Ortam Değişkenleri (.env)

`staj-backend` klasörü içinde olmalı:

| Değişken | Açıklama |
|---|---|
| `GEMINI_API_KEY` | Google Gemini API anahtarı |
| `SECRET_KEY` | JWT token'ları imzalamak için kullanılan gizli anahtar |
| `DATABASE_URL` | PostgreSQL bağlantı adresi (Docker kullanılıyorsa otomatik ayarlanır) |

**Not:** `.env` dosyası `.gitignore` içinde tanımlıdır, repoya gönderilmez. Her ortamda elle oluşturulmalıdır.

## API Endpoint'leri

| Method | Endpoint | Açıklama | Auth gerekli mi |
|---|---|---|---|
| POST | `/kayit` | Yeni kullanıcı kaydı | Hayır |
| POST | `/giris` | Giriş yap, JWT token al | Hayır |
| POST | `/sor` | Gemini'ye soru sor | Evet (Bearer token) |
