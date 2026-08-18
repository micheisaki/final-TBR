import { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [token, setToken] = useState("");
  const [mod, setMod] = useState("giris"); // "giris" | "kayit"
  const [kullaniciAdi, setKullaniciAdi] = useState("");
  const [sifre, setSifre] = useState("");
  const [authHata, setAuthHata] = useState("");
  const [authYukleniyor, setAuthYukleniyor] = useState(false);

  const [mesajlar, setMesajlar] = useState([]);
  const [girdi, setGirdi] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const mesajSonu = useRef(null);

  useEffect(() => {
    mesajSonu.current?.scrollIntoView({ behavior: "smooth" });
  }, [mesajlar]);

  const girisYap = async () => {
    setAuthHata("");
    setAuthYukleniyor(true);
    try {
      const formData = new URLSearchParams();
      formData.append("username", kullaniciAdi);
      formData.append("password", sifre);
      const response = await axios.post(`${API_URL}/giris`, formData);
      setToken(response.data.access_token);
    } catch (error) {
      setAuthHata(error.response?.data?.detail || "Giriş başarısız");
    } finally {
      setAuthYukleniyor(false);
    }
  };

  const kayitOl = async () => {
    setAuthHata("");
    setAuthYukleniyor(true);
    try {
      await axios.post(
        `${API_URL}/kayit?kullanici_adi=${encodeURIComponent(
          kullaniciAdi
        )}&sifre=${encodeURIComponent(sifre)}`
      );
      setMod("giris");
      setAuthHata("Kayıt başarılı, şimdi giriş yapabilirsin.");
    } catch (error) {
      setAuthHata(error.response?.data?.detail || "Kayıt başarısız");
    } finally {
      setAuthYukleniyor(false);
    }
  };

  const mesajGonder = async () => {
    const soru = girdi.trim();
    if (!soru || yukleniyor) return;
    setMesajlar((prev) => [...prev, { rol: "user", metin: soru }]);
    setGirdi("");
    setYukleniyor(true);
    try {
      const response = await axios.post(
        `${API_URL}/sor`,
        { metin: soru },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMesajlar((prev) => [
        ...prev,
        { rol: "bot", metin: response.data.cevap.replace(/\*\*/g, "").replace(/\*/g, "") },
      ]);
    } catch (error) {
      setMesajlar((prev) => [
        ...prev,
        {
          rol: "bot",
          metin:
            error.response?.data?.detail ||
            "Bir hata oluştu, tekrar dener misin?",
        },
      ]);
    } finally {
      setYukleniyor(false);
    }
  };

  const enterIleGonder = (e) => {
    if (e.key === "Enter") mesajGonder();
  };

  // ----- Giriş / Kayıt ekranı -----
  if (!token) {
    return (
      <div className="app">
        <div className="card">
          <h1>Staj Projesi</h1>
          <p className="subtitle">
            {mod === "giris" ? "Hesabına giriş yap" : "Yeni hesap oluştur"}
          </p>

          <div className="field">
            <label>Kullanıcı adı</label>
            <input
              value={kullaniciAdi}
              onChange={(e) => setKullaniciAdi(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Şifre</label>
            <input
              type="password"
              value={sifre}
              onChange={(e) => setSifre(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  mod === "giris" ? girisYap() : kayitOl();
                }
              }}
            />
          </div>

          <div className="btn-row">
            {mod === "giris" ? (
              <>
                <button
                  className="btn btn-primary"
                  onClick={girisYap}
                  disabled={authYukleniyor}
                >
                  {authYukleniyor ? "..." : "Giriş Yap"}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setMod("kayit");
                    setAuthHata("");
                  }}
                >
                  Kayıt Ol
                </button>
              </>
            ) : (
              <>
                <button
                  className="btn btn-primary"
                  onClick={kayitOl}
                  disabled={authYukleniyor}
                >
                  {authYukleniyor ? "..." : "Kayıt Ol"}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setMod("giris");
                    setAuthHata("");
                  }}
                >
                  Vazgeç
                </button>
              </>
            )}
          </div>

          {authHata && <p className="error-msg">{authHata}</p>}
        </div>
      </div>
    );
  }

  // ----- Chat ekranı -----
  return (
    <div className="app">
      <div className="card chat-card">
        <div className="chat-header">
          <h2>Staj Asistanı</h2>
          <button className="logout-btn" onClick={() => setToken("")}>
            Çıkış
          </button>
        </div>

        <div className="messages">
          {mesajlar.length === 0 && (
            <p style={{ color: "#aaa", textAlign: "center", marginTop: 40 }}>
              Bir soru yazarak başla 👋
            </p>
          )}
          {mesajlar.map((m, i) => (
            <div key={i} className={`msg ${m.rol}`}>
              {m.metin}
            </div>
          ))}
          {yukleniyor && <div className="msg bot loading">yazıyor...</div>}
          <div ref={mesajSonu} />
        </div>

        <div className="chat-input-row">
          <input
            value={girdi}
            onChange={(e) => setGirdi(e.target.value)}
            onKeyDown={enterIleGonder}
            placeholder="Bir şeyler sor..."
          />
          <button
            className="send-btn"
            onClick={mesajGonder}
            disabled={yukleniyor}
          >
            Gönder
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;