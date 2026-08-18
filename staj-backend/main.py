import os
from dotenv import load_dotenv
from fastapi import FastAPI
from pydantic import BaseModel
from google import genai
from auth import gecerli_kullanici, token_olustur, sifre_hashle, sifre_dogrula
from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import engine, get_db, Base
from models import Kullanici
from fastapi.middleware.cors import CORSMiddleware


kullanicilar_db = {}

load_dotenv()  # .env dosyasını okur

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
Base.metadata.create_all(bind=engine)

@app.post("/kayit")
def kayit_ol(kullanici_adi: str, sifre: str, db: Session = Depends(get_db)):
    mevcut_kullanici = db.query(Kullanici).filter(Kullanici.kullanici_adi == kullanici_adi).first()
    if mevcut_kullanici:
        raise HTTPException(status_code=400, detail="Bu kullanıcı adı zaten kayıtlı")
    hashli_sifre = sifre_hashle(sifre)
    yeni_kullanici = Kullanici(kullanici_adi=kullanici_adi, hashli_sifre=hashli_sifre)
    db.add(yeni_kullanici)
    db.commit()
    return {"mesaj": "Kayıt başarılı"}

@app.post("/giris")
def giris_yap(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    kullanici = db.query(Kullanici).filter(Kullanici.kullanici_adi == form_data.username).first()
    if not kullanici or not sifre_dogrula(form_data.password, kullanici.hashli_sifre):
        raise HTTPException(status_code=401, detail="Kullanıcı adı veya şifre hatalı")
    token = token_olustur({"sub": kullanici.kullanici_adi})
    return {"access_token": token, "token_type": "bearer"}

@app.get("/")
def ana_sayfa():
    return {"mesaj": "Merhaba, bu benim ilk API'm!"}

@app.get("/selam/{isim}")
def selamla(isim):
    return {"mesaj": f"Merhaba {isim}, hoş geldin!"}

class Soru(BaseModel):
    metin: str

@app.post("/sor")
def sor(soru: Soru, kullanici: str = Depends(gecerli_kullanici)):
    cevap = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=soru.metin
    )
    return {"cevap": cevap.text}




