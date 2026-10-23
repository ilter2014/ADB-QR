# ADB-QR

Pair Android devices over Wi-Fi with Android Debug Bridge (ADB) using QR codes. Windows-first, with a Python CLI.

> **Status:** initial project scaffold. Real-device end-to-end pairing should be verified on your own Android device and ADB version.

## Features

- Generate an ADB Wi-Fi pairing QR code.
- Optionally save the QR image to a directory.
- Discover ADB pairing/connect services using `adb mdns services`.
- Run `adb pair` and `adb connect` interactively.
- List connected devices and disconnect devices.
- Keep ADB executable location configurable.
- Unit tests and GitHub Actions CI.

## Requirements

- Python 3.10+
- Android SDK Platform-Tools (`adb`)
- Android 11+ device with **Wireless debugging** support for QR-based pairing
- Install dependencies with `pip install -e ".[dev]"`

On Windows, install Android SDK Platform-Tools and ensure `adb.exe` is on `PATH`, or pass `--adb C:\path\to\adb.exe`.

## Install from a clone

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -e ".[dev]"
adb version
```

## Commands

Show help:

```powershell
adb-qr --help
```

Create and display a QR code:

```powershell
adb-qr qr
```

Save QR image to a directory:

```powershell
adb-qr qr --output .\qr-output
```

Pair using Android's Wireless debugging pairing screen:

```powershell
adb-qr pair
```

List devices:

```powershell
adb-qr devices
```

Connect to a known host and port (shown by Android Wireless debugging):

```powershell
adb-qr connect 192.168.1.50:37099
```

Disconnect a specific endpoint or all connected endpoints:

```powershell
adb-qr disconnect 192.168.1.50:37099
adb-qr disconnect --all
```

## QR payload and security notes

The QR contains the ADB pairing service name and pairing password. Treat it like a credential: do not post it publicly, commit generated QR images, or share screenshots. The QR image is not itself an expiring credential; Android's pairing service and pairing code/session govern whether it can still be used. Disable Wireless debugging when you finish, and only pair on trusted networks.

The tool does not bypass Android authentication. It relies on Android's official Wireless debugging pairing flow and the installed ADB client.

## Troubleshooting

- **No pairing service found:** open Developer options → Wireless debugging → Pair device with QR code, and keep that pairing screen open.
- **No connect service found:** enable Wireless debugging and keep the phone and computer on the same trusted network.
- **`adb` not found:** install Platform-Tools or pass `--adb`.
- **Pairing fails:** ensure the phone's pairing screen is still active, use a recent Platform-Tools release, and try again.
- **No device appears after pairing:** check the connect service and run `adb-qr devices`.

## Development

```powershell
python -m pip install -e ".[dev]"
python -m pytest
```

## License

MIT. See `LICENSE`.
