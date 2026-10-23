# -*- coding: utf-8 -*-
import os
import shutil
import secrets
import string
import subprocess
import sys
import time

ADB = os.environ.get("ADB_PATH") or shutil.which("adb") or r"C:\Android\platform-tools\adb.exe"
TIMEOUT_SECONDS = 120
RESET = "\033[0m"
BOLD = "\033[1m"
DIM = "\033[2m"
CYAN = "\033[96m"
BLUE = "\033[94m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
WHITE = "\033[97m"
BG = "\033[100m"

def paint(text, color):
    return color + str(text) + RESET

def clear():
    os.system("cls")

def run_adb(*args, timeout=12):
    return subprocess.run([ADB, *args], text=True, capture_output=True, timeout=timeout, encoding="utf-8", errors="replace")

def services():
    try:
        result = run_adb("mdns", "services")
        lines = (result.stdout or "") + "\n" + (result.stderr or "")
        found = []
        for line in lines.splitlines():
            parts = line.split()
            if len(parts) >= 3 and parts[1] in ("_adb-tls-pairing._tcp", "_adb-tls-connect._tcp"):
                found.append((parts[0], parts[1], parts[-1]))
        return found
    except Exception:
        return []

def banner():
    clear()
    print(paint("╔══════════════════════════════════════════════════════════════╗", CYAN + BOLD))
    print(paint("║", CYAN + BOLD) + paint("                      A D B  •  Q R                         ", WHITE + BOLD) + paint("║", CYAN + BOLD))
    print(paint("║", CYAN + BOLD) + paint("               ANDROID WIRELESS CONNECT                       ", DIM) + paint("║", CYAN + BOLD))
    print(paint("╚══════════════════════════════════════════════════════════════╝", CYAN + BOLD))
    print()

def pause():
    input("\n" + paint("  ↳ Devam etmek için Enter...", DIM))

def print_qr(payload):
    import qrcode
    qr = qrcode.QRCode(version=None, error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=1, border=3)
    qr.add_data(payload)
    qr.make(fit=True)
    matrix = [[False] * (len(qr.get_matrix()[0]))] + [] if False else qr.get_matrix()
    # Two QR modules per terminal character keeps the printed code close to square.
    for y in range(0, len(matrix), 2):
        line = []
        for x in range(len(matrix[y])):
            top = matrix[y][x]
            bottom = matrix[y + 1][x] if y + 1 < len(matrix) else False
            fg = "\033[30m" if top else "\033[97m"
            bg = "\033[40m" if bottom else "\033[107m"
            line.append(fg + bg + "▀")
        print("".join(line) + RESET)

def wait_for_service(service_name, service_kind, timeout):
    deadline = time.time() + timeout
    while time.time() < deadline:
        for name, kind, addr in services():
            if kind == service_kind and (service_name is None or name == service_name):
                return addr
        time.sleep(1)
    return None

def show_devices():
    banner()
    print(paint("  BAĞLI ADB CİHAZLARI", CYAN + BOLD))
    print(paint("  ────────────────────────────────────────────────────────────", DIM))
    result = run_adb("devices", "-l")
    print(result.stdout or "(Cihaz bulunamadı)")
    if result.stderr:
        print(paint(result.stderr, YELLOW))
    pause()

def pair_phone():
    banner()
    print(paint("  YENİ TELEFON EŞLEŞTİR", CYAN + BOLD))
    print("  1. Telefon ve bilgisayar aynı Wi-Fi ağına bağlı olsun.")
    print("  2. Android: Geliştirici seçenekleri > Kablosuz hata ayıklama")
    print("  3. 'QR koduyla cihaz eşleştir' ekranını aç.")
    print()
    input(paint("  Hazır olduğunda Enter'a bas; QR kodu oluşturulsun...", YELLOW))
    service = "studio-" + secrets.token_urlsafe(9).replace("-", "x").replace("_", "y")
    password = "".join(secrets.choice(string.ascii_letters + string.digits + "-_") for _ in range(10))
    payload = f"WIFI:T:ADB;S:{service};P:{password};;"
    banner()
    print(paint("  TELEFONUNLA BU QR KODU TARA", GREEN + BOLD))
    print(paint("  Android Kablosuz hata ayıklama > QR koduyla cihaz eşleştir", DIM))
    print()
    print_qr(payload)
    print()
    print(paint("  Bekleniyor... QR kodu 120 saniye geçerlidir.", YELLOW))
    print(paint("  İptal etmek için Ctrl+C kullanabilirsin.", DIM))
    pair_addr = wait_for_service(service, "_adb-tls-pairing._tcp", TIMEOUT_SECONDS)
    if not pair_addr:
        print(paint("\n  ZAMAN AŞIMI: Telefon eşleştirme servisi bulunamadı.", RED + BOLD))
        print("  Kablosuz hata ayıklamayı, aynı Wi-Fi ağını ve Windows güvenlik duvarını kontrol et.")
        pause()
        return
    print(paint(f"\n  ✓ Telefon bulundu: {pair_addr}", GREEN + BOLD))
    paired = run_adb("pair", pair_addr, password, timeout=25)
    output = (paired.stdout or "") + (paired.stderr or "")
    print(output.strip())
    if paired.returncode != 0 or "Successfully paired" not in output:
        print(paint("  ✗ Eşleştirme başarısız.", RED + BOLD))
        pause()
        return
    print(paint("\n  ✓ Eşleştirme tamamlandı. Bağlantı servisi aranıyor...", GREEN))
    host = pair_addr.rsplit(":", 1)[0]
    deadline = time.time() + 30
    connect_addr = None
    while time.time() < deadline:
        candidates = [addr for _, kind, addr in services() if kind == "_adb-tls-connect._tcp"]
        for addr in candidates:
            if addr.rsplit(":", 1)[0] == host:
                connect_addr = addr
                break
        if connect_addr:
            break
        time.sleep(1)
    if not connect_addr:
        print(paint("  ! Eşleştirildi; bağlantı servisi bulunamadı.", YELLOW))
        print("  Telefonun Kablosuz hata ayıklama ekranının açık olduğunu kontrol et.")
        print(run_adb("devices").stdout)
        pause()
        return
    result = run_adb("connect", connect_addr, timeout=15)
    out = (result.stdout or "") + (result.stderr or "")
    print(out.strip())
    if "connected to" in out.lower() or "already connected" in out.lower():
        print(paint("\n  ✓ TELEFON BAĞLANDI!", GREEN + BOLD))
    else:
        print(paint("\n  ! Otomatik bağlantı doğrulanamadı. ADB listesini kontrol et.", YELLOW))
    print()
    print(run_adb("devices", "-l").stdout)
    pause()

def connect_available():
    banner()
    print(paint("  AĞDA BULUNAN ADB CİHAZLARI", CYAN + BOLD))
    items = [(name, addr) for name, kind, addr in services() if kind == "_adb-tls-connect._tcp"]
    if not items:
        print("  Şu anda ağda bağlantı servisi bulunamadı.")
        print("  Yeni telefon eklemek için ana menüden QR eşleştirmesini kullan.")
        pause()
        return
    for i, (name, addr) in enumerate(items, 1):
        print(f"  [{i}] {name}  {paint(addr, GREEN)}")
    print("  [0] Geri")
    choice = input("\n  Bağlanılacak cihaz: ").strip()
    if choice == "0":
        return
    if choice.isdigit() and 1 <= int(choice) <= len(items):
        addr = items[int(choice) - 1][1]
        result = run_adb("connect", addr)
        print((result.stdout or "") + (result.stderr or ""))
        print(run_adb("devices", "-l").stdout)
        pause()
    else:
        print(paint("  Geçersiz seçim.", RED))
        pause()

def disconnect_all():
    banner()
    print(paint("  TÜM ADB BAĞLANTILARINI KES", YELLOW + BOLD))
    answer = input("  Emin misin? (E/H): ").strip().lower()
    if answer == "e":
        print(run_adb("disconnect").stdout)
    pause()

def save_qr(directory):
    """Save a high-resolution pairing QR and keep its pairing session alive for five minutes."""
    if not os.path.isdir(directory):
        try:
            os.makedirs(directory, exist_ok=True)
        except OSError as exc:
            print(paint("Dizin oluşturulamadı: " + str(exc), RED + BOLD))
            return 2

    try:
        import qrcode
        from qrcode.constants import ERROR_CORRECT_M
    except ImportError:
        print(paint("QR kütüphanesi eksik. Şunu çalıştır: python -m pip install --user qrcode[pil]", RED + BOLD))
        return 2

    service = "studio-" + secrets.token_urlsafe(9).replace("-", "x").replace("_", "y")
    password = "".join(secrets.choice(string.ascii_letters + string.digits + "-_") for _ in range(10))
    payload = f"WIFI:T:ADB;S:{service};P:{password};;"
    output_path = os.path.abspath(os.path.join(directory, "adb-qr.png"))

    qr = qrcode.QRCode(version=None, error_correction=ERROR_CORRECT_M, box_size=12, border=4)
    qr.add_data(payload)
    qr.make(fit=True)
    image = qr.make_image(fill_color="black", back_color="white")
    image.save(output_path)

    print(paint("\n  ADB-QR | PNG KODU HAZIR", CYAN + BOLD))
    print(paint("  ──────────────────────────────────────────────────────", DIM))
    print("  Dosya: " + paint(output_path, GREEN + BOLD))
    print("  Geçerlilik: " + paint("5 dakika", YELLOW + BOLD))
    print()
    print("  Telefonda Kablosuz hata ayıklama > QR koduyla cihaz eşleştir")
    print("  ekranını açıp bu PNG dosyasını tara.")
    print()
    print(paint("  Tarama bekleniyor. Bu pencereyi kapatma; işlem taramadan", YELLOW))
    print(paint("  sonra eşleştirip telefonu otomatik bağlamaya çalışacak.", YELLOW))
    print(paint("  İptal etmek için Ctrl+C.", DIM))

    pair_addr = wait_for_service(service, "_adb-tls-pairing._tcp", 300)
    if not pair_addr:
        print(paint("\n  Süre doldu. QR artık bu oturum için geçerli değil.", RED + BOLD))
        try:
            os.remove(output_path)
            print("  Süresi dolan PNG dosyası silindi.")
        except OSError:
            print("  PNG dosyası silinemedi; istersen elle silebilirsin.")
        return 1

    print(paint(f"\n  ✓ Telefon bulundu: {pair_addr}", GREEN + BOLD))
    paired = run_adb("pair", pair_addr, password, timeout=25)
    output = (paired.stdout or "") + (paired.stderr or "")
    print(output.strip())
    if paired.returncode != 0 or "Successfully paired" not in output:
        print(paint("  ✗ Eşleştirme başarısız.", RED + BOLD))
        try:
            os.remove(output_path)
        except OSError:
            pass
        return 1

    try:
        os.remove(output_path)
        print(paint("  QR PNG dosyası kullanıldı ve kaldırıldı.", DIM))
    except OSError:
        pass

    print(paint("\n  ✓ Eşleştirildi. Telefonun ADB bağlantısı aranıyor...", GREEN))
    host = pair_addr.rsplit(":", 1)[0]
    deadline = time.time() + 30
    connect_addr = None
    while time.time() < deadline:
        candidates = [addr for _, kind, addr in services() if kind == "_adb-tls-connect._tcp"]
        for addr in candidates:
            if addr.rsplit(":", 1)[0] == host:
                connect_addr = addr
                break
        if connect_addr:
            break
        time.sleep(1)

    if not connect_addr:
        print(paint("  ! Eşleştirme tamamlandı fakat bağlantı servisi bulunamadı.", YELLOW))
        print(run_adb("devices", "-l").stdout)
        return 1

    result = run_adb("connect", connect_addr, timeout=15)
    out = (result.stdout or "") + (result.stderr or "")
    print(out.strip())
    print(run_adb("devices", "-l").stdout)
    if "connected to" in out.lower() or "already connected" in out.lower():
        print(paint("  ✓ TELEFON BAĞLANDI!", GREEN + BOLD))
        return 0
    print(paint("  ! Otomatik bağlantı doğrulanamadı.", YELLOW))
    return 1

def main():
    if not os.path.isfile(ADB):
        print(paint("ADB bulunamadı: " + ADB, RED + BOLD))
        pause()
        return 1
    while True:
        banner()
        print("  " + paint("ADB durumu:", DIM) + " " + paint("Hazır", GREEN + BOLD))
        print()
        print("  " + paint("╭───────────────┐", BLUE) + "     " + paint("╭──────────────────┐", BLUE))
        print("  " + paint("│  [1] QR EŞLEŞTİR │", WHITE + BOLD) + "     " + paint("│  [2] AĞDAN BAĞLAN │", WHITE + BOLD))
        print("  " + paint("╰───────────────┘", BLUE) + "     " + paint("╰──────────────────┘", BLUE))
        print()
        print("  " + paint("[3]", CYAN + BOLD) + " Bağlı cihazları göster")
        print("  " + paint("[4]", CYAN + BOLD) + " Tüm bağlantıları kes")
        print("  " + paint("[0]", RED + BOLD) + " Çıkış")
        choice = input("\n  Seçimini yaz ve Enter'a bas  › ").strip().lower()
        if choice == "1":
            pair_phone()
        elif choice == "2":
            connect_available()
        elif choice == "3":
            show_devices()
        elif choice == "4":
            disconnect_all()
        elif choice in ("0", "q", "exit"):
            clear()
            print(paint("ADB-QR kapatıldı. Görüşürüz!", CYAN + BOLD))
            return 0
        else:
            print(paint("Geçersiz seçim.", RED))
            time.sleep(1)

if __name__ == "__main__":
    try:
        if len(sys.argv) >= 2 and sys.argv[1].lower() == "save":
            if len(sys.argv) < 3:
                print("Kullanım: adb-qr save \"C:\\QR-Dizini\"")
                raise SystemExit(2)
            if not os.path.isfile(ADB):
                print(paint("ADB bulunamadı: " + ADB, RED + BOLD))
                raise SystemExit(2)
            raise SystemExit(save_qr(os.path.abspath(sys.argv[2])))
        raise SystemExit(main())
    except KeyboardInterrupt:
        print("\n\n" + paint("İşlem iptal edildi.", YELLOW))
        raise SystemExit(130)
    except Exception as exc:
        print("\n" + paint("HATA: " + str(exc), RED + BOLD))
        input("Enter...")
        raise SystemExit(1)
