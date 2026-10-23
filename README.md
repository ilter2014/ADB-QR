<!-- ADB-QR README -->
<div align="center">

# ADB-QR

### Android cihazlarını Wi-Fi üzerinden ADB ile eşleştir.

**Kablo karmaşasını azalt. QR ile eşleştir. Kontrol sende.**

<p>
  <a href="#-hızlı-başlangıç"><img src="https://img.shields.io/badge/🚀_Hızlı_Başlangıç-Kuruluma_Git-2563EB?style=for-the-badge" alt="Hızlı Başlangıç"></a>
  <a href="#-android-ve-kablosuz-eşleştirme"><img src="https://img.shields.io/badge/📱_Android-Wireless_Debugging-16A34A?style=for-the-badge" alt="Android Wireless Debugging"></a>
  <a href="#-komutlar"><img src="https://img.shields.io/badge/⌨️_Komutlar-CLI-7C3AED?style=for-the-badge" alt="Komutlar"></a>
  <a href="#-sorun-giderme"><img src="https://img.shields.io/badge/🛠️_Sorun_Giderme-Rehber-F59E0B?style=for-the-badge" alt="Sorun Giderme"></a>
</p>

<p>
  <img src="https://img.shields.io/badge/Python-3.10%2B-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python 3.10+">
  <img src="https://img.shields.io/badge/Platform-Windows-0078D4?style=flat-square&logo=windows&logoColor=white" alt="Windows">
  <img src="https://img.shields.io/badge/Android-ADB_Wi--Fi-3DDC84?style=flat-square&logo=android&logoColor=white" alt="Android ADB Wi-Fi">
  <img src="https://img.shields.io/badge/Tests-4_passed-2EA44F?style=flat-square" alt="4 tests passed locally">
  <img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="MIT License">
</p>

<p>
  <a href="https://developer.android.com/tools/adb">📖 ADB Resmî Dokümantasyonu</a>
  &nbsp;·&nbsp;
  <a href="https://developer.android.com/tools/adb#wireless">📡 Kablosuz Hata Ayıklama</a>
  &nbsp;·&nbsp;
  <a href="https://github.com/ilter2014/ADB-QR/issues">💬 Hata Bildir / Öneri Gönder</a>
</p>

</div>

---

## ✨ Nedir?

**ADB-QR**, Android Debug Bridge (ADB) ile Android cihazlarda kablosuz bağlantı iş akışını kolaylaştırmayı amaçlayan, Windows öncelikli bir Python komut satırı aracıdır.

- 📱 Android'in **Wireless debugging** özelliğiyle çalışır.
- 🔳 ADB eşleştirme verilerinden QR görseli üretebilir.
- 🔎 ADB mDNS servislerini listeleyip eşleştirme/bağlantı uç noktalarını bulmaya yardımcı olur.
- 🔌 Cihazları listeleme, bağlanma ve bağlantıyı kesme komutları sunar.
- 🧪 Otomatik testler ve GitHub Actions iş akışı içerir.

> **Proje durumu:** İlk sürüm / geliştirme aşaması. Otomatik testler geçiyor; gerçek Android cihazında uçtan uca eşleştirme henüz doğrulanmış değildir.

## 📋 Gereksinimler

- Windows (öncelikli hedef)
- Python **3.10 veya üzeri**
- Android SDK **Platform-Tools** (ADB)
- QR ile kablosuz eşleştirmeyi destekleyen Android sürümü ve etkin **Developer options → Wireless debugging**

<p>
  <a href="https://developer.android.com/tools/releases/platform-tools"><img src="https://img.shields.io/badge/⬇️_Android_Platform--Tools-İndir-3DDC84?style=for-the-badge&logo=android&logoColor=white" alt="Android Platform-Tools indir"></a>
  <a href="https://www.python.org/downloads/"><img src="https://img.shields.io/badge/⬇️_Python-İndir-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python indir"></a>
</p>

## 🚀 Hızlı Başlangıç

### 1. Depoyu indir

    git clone https://github.com/ilter2014/ADB-QR.git
    cd ADB-QR

### 2. Sanal ortamı oluştur ve etkinleştir

    py -m venv .venv
    .\.venv\Scripts\Activate.ps1

### 3. Aracı kur

    python -m pip install --upgrade pip
    python -m pip install -e ".[dev]"

### 4. ADB'yi kontrol et

    adb version
    adb devices

ADB komutu bulunamazsa Android Platform-Tools'u kur veya komutlarda <code>--adb</code> ile <code>adb.exe</code> dosyasının tam yolunu belirt.

## 📱 Android ve Kablosuz Eşleştirme

Android cihazında **Developer options → Wireless debugging** özelliğini aç. Bilgisayar ve telefon aynı güvenilir ağda olmalıdır.

### QR görseli oluştur

Elindeki eşleştirme servis bilgisi ve eşleştirme koduyla QR üret:

    adb-qr qr --service "SERVİS_ADRESİ" --password "EŞLEŞTİRME_KODU" --output .\qr-output

QR görseli <code>qr-output\adb-qr.png</code> konumuna kaydedilir. Gerçek servis adresini ve kodu Android cihazındaki bilgilerle eşleştir.

> QR komutu servis ve kodu kendiliğinden tahmin etmez; ikisini de açıkça vermen gerekir. QR görselini herkese açık paylaşma veya Git'e ekleme.

### ADB mDNS servislerini kullanarak eşleştir

    adb-qr pair

Araç ADB mDNS servislerini arar ve eşleştirme kodunu ister. Android'in gösterdiği kodu gir. Eşleştirme ekranını açık tut.

### Cihazları listele

    adb-qr devices

### Bir cihaza bağlan

Android'in Wireless debugging ekranında gösterilen <code>HOST:PORT</code> değerini kullan:

    adb-qr connect 192.168.1.50:39871

Yukarıdaki adres yalnızca örnektir; kendi cihazındaki adresi kullan.

### Bağlantıyı kes

    adb-qr disconnect 192.168.1.50:39871

Tüm bağlı ağ ADB cihazlarının bağlantısını kesmek için:

    adb-qr disconnect --all

## ⌨️ Komutlar

| Komut | Açıklama |
|---|---|
| <code>adb-qr --help</code> | Yardım ve genel seçenekler |
| <code>adb-qr qr --service ... --password ...</code> | QR görseli oluştur |
| <code>adb-qr pair</code> | mDNS üzerinden eşleştirmeyi başlat |
| <code>adb-qr devices</code> | Bağlı cihazları listele |
| <code>adb-qr connect HOST:PORT</code> | Bir cihaza bağlan |
| <code>adb-qr disconnect HOST:PORT</code> | Belirtilen bağlantıyı kes |
| <code>adb-qr disconnect --all</code> | Ağ ADB bağlantılarını kes |

ADB'nin tam yolunu belirtmek için:

    adb-qr --adb "C:\Android\platform-tools\adb.exe" devices

## 🛠️ Sorun Giderme

<details>
<summary><strong>❌ ADB komutu bulunamıyor</strong></summary>

Android SDK Platform-Tools'u kur. Ardından <code>adb.exe</code> yolunu PATH'e ekle veya <code>--adb "C:\tam\yol\adb.exe"</code> kullan.
</details>

<details>
<summary><strong>📡 Eşleştirme servisi bulunamıyor</strong></summary>

Android'de Developer options → Wireless debugging'i aç. Eşleştirme ekranını açık tut, bilgisayar ve telefonun aynı güvenilir ağda olduğundan emin ol ve tekrar dene.
</details>

<details>
<summary><strong>🔌 Eşleştirme başarılı ama cihaz bağlı görünmüyor</strong></summary>

<code>adb-qr devices</code> çalıştır. Wireless debugging ekranındaki bağlantı portunu kontrol edip gerekirse <code>adb-qr connect HOST:PORT</code> kullan.
</details>

<details>
<summary><strong>🧪 Testleri çalıştırmak istiyorum</strong></summary>

    python -m pip install -e ".[dev]"
    python -m pytest
    ruff check .
</details>

## 🔐 Güvenlik

- Yalnızca kendi cihazlarını veya yönetmeye yetkili olduğun cihazları eşleştir.
- Eşleştirme kodlarını ve QR görsellerini parola gibi değerlendir.
- QR görsellerini, kodları veya cihaz kimliklerini GitHub'a yükleme.
- İşin bitince Android'de **Wireless debugging** özelliğini kapat.
- ADB-QR, Android'in resmi ADB eşleştirme mekanizmasını kullanır; kimlik doğrulamayı atlatmaz.

Güvenlik bildirimi için [SECURITY.md](SECURITY.md) dosyasına bak.

## 🧑‍💻 Geliştirme

    python -m pip install -e ".[dev]"
    python -m pytest
    ruff check .

Katkı vermek için [CONTRIBUTING.md](CONTRIBUTING.md) dosyasını oku.

## 📄 Lisans

MIT lisansı. Ayrıntılar için [LICENSE](LICENSE) dosyasına bak.

---

<div align="center">

**ADB-QR · Android kablosuz hata ayıklama için pratik bir yardımcı**

<sub>Made for Android developers and tinkerers.</sub>

<p>
  <a href="https://github.com/ilter2014/ADB-QR/issues"><img src="https://img.shields.io/badge/✨_Fikir_ve_Hata_Bildir-GitHub_Issues-181717?style=for-the-badge&logo=github" alt="GitHub Issues"></a>
  <a href="#-hızlı-başlangıç"><img src="https://img.shields.io/badge/⬆️_Başa_Dön-README-64748B?style=for-the-badge" alt="Başa dön"></a>
</p>

</div>
