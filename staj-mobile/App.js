import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useState, useRef } from 'react';
import axios from 'axios';

const API_URL = "http://SENIN_IP_ADRESIN:8000"; // Kendi yerel IP adresinle değiştir

export default function App() {
  const [token, setToken] = useState("");
  const [mod, setMod] = useState("giris");
  const [kullaniciAdi, setKullaniciAdi] = useState("");
  const [sifre, setSifre] = useState("");
  const [authHata, setAuthHata] = useState("");
  const [authYukleniyor, setAuthYukleniyor] = useState(false);

  const [mesajlar, setMesajlar] = useState([]);
  const [girdi, setGirdi] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const scrollRef = useRef(null);

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
        {
          rol: "bot",
          metin: response.data.cevap.replace(/\*\*/g, "").replace(/\*/g, ""),
        },
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

  // ----- Giriş / Kayıt ekranı -----
  if (!token) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.baslik}>Staj Projesi</Text>
          <Text style={styles.subtitle}>
            {mod === "giris" ? "Hesabına giriş yap" : "Yeni hesap oluştur"}
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>Kullanıcı adı</Text>
            <TextInput
              style={styles.input}
              value={kullaniciAdi}
              onChangeText={setKullaniciAdi}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Şifre</Text>
            <TextInput
              style={styles.input}
              value={sifre}
              onChangeText={setSifre}
              secureTextEntry={true}
              onSubmitEditing={() => (mod === "giris" ? girisYap() : kayitOl())}
            />
          </View>

          <View style={styles.btnRow}>
            {mod === "giris" ? (
              <>
                <TouchableOpacity
                  style={[styles.btn, styles.btnPrimary]}
                  onPress={girisYap}
                  disabled={authYukleniyor}
                >
                  <Text style={styles.btnPrimaryText}>
                    {authYukleniyor ? "..." : "Giriş Yap"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.btnSecondary]}
                  onPress={() => {
                    setMod("kayit");
                    setAuthHata("");
                  }}
                >
                  <Text style={styles.btnSecondaryText}>Kayıt Ol</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.btn, styles.btnPrimary]}
                  onPress={kayitOl}
                  disabled={authYukleniyor}
                >
                  <Text style={styles.btnPrimaryText}>
                    {authYukleniyor ? "..." : "Kayıt Ol"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.btnSecondary]}
                  onPress={() => {
                    setMod("giris");
                    setAuthHata("");
                  }}
                >
                  <Text style={styles.btnSecondaryText}>Vazgeç</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {authHata ? <Text style={styles.errorMsg}>{authHata}</Text> : null}
        </View>
        <StatusBar style="light" />
      </View>
    );
  }

  // ----- Chat ekranı -----
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.chatCard}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatHeaderText}>Staj Asistanı</Text>
          <TouchableOpacity style={styles.logoutBtn} onPress={() => setToken("")}>
            <Text style={styles.logoutBtnText}>Çıkış</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={{ padding: 16 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {mesajlar.length === 0 && (
            <Text style={styles.emptyText}>Bir soru yazarak başla 👋</Text>
          )}
          {mesajlar.map((m, i) => (
            <View
              key={i}
              style={[
                styles.msg,
                m.rol === "user" ? styles.msgUser : styles.msgBot,
              ]}
            >
              <Text
                style={m.rol === "user" ? styles.msgUserText : styles.msgBotText}
              >
                {m.metin}
              </Text>
            </View>
          ))}
          {yukleniyor && (
            <View style={[styles.msg, styles.msgBot]}>
              <Text style={styles.loadingText}>yazıyor...</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.chatInputRow}>
          <TextInput
            style={styles.chatInput}
            value={girdi}
            onChangeText={setGirdi}
            onSubmitEditing={mesajGonder}
            placeholder="Bir şeyler sor..."
          />
          <TouchableOpacity
            style={styles.sendBtn}
            onPress={mesajGonder}
            disabled={yukleniyor}
          >
            <Text style={styles.sendBtnText}>Gönder</Text>
          </TouchableOpacity>
        </View>
      </View>
      <StatusBar style="light" />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1b1e',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 30,
    width: '100%',
  },
  baslik: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#14b8a6',
    marginBottom: 4,
  },
  subtitle: {
    color: '#888',
    marginBottom: 24,
    fontSize: 14,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  btn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: '#14b8a6',
  },
  btnPrimaryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  btnSecondary: {
    backgroundColor: '#f0f0f5',
  },
  btnSecondaryText: {
    color: '#444',
    fontWeight: '600',
    fontSize: 15,
  },
  errorMsg: {
    color: '#d9455f',
    fontSize: 13,
    marginTop: 14,
    textAlign: 'center',
  },
  chatCard: {
    flex: 1,
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 40,
    marginBottom: 20,
  },
  chatHeader: {
    padding: 20,
    backgroundColor: '#14b8a6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatHeaderText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  logoutBtnText: {
    color: '#fff',
    fontSize: 13,
  },
  messages: {
    flex: 1,
  },
  emptyText: {
    color: '#aaa',
    textAlign: 'center',
    marginTop: 40,
  },
  msg: {
    maxWidth: '78%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  msgUser: {
    alignSelf: 'flex-end',
    backgroundColor: '#14b8a6',
    borderBottomRightRadius: 4,
  },
  msgUserText: {
    color: '#fff',
    fontSize: 14,
  },
  msgBot: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e4f0',
    borderBottomLeftRadius: 4,
  },
  msgBotText: {
    color: '#3d3d55',
    fontSize: 14,
  },
  loadingText: {
    fontStyle: 'italic',
    color: '#999',
  },
  chatInputRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
  },
  sendBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#14b8a6',
    justifyContent: 'center',
  },
  sendBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
});