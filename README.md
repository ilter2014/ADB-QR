<!-- ADB-QR project README -->
<a id="top"></a>
<div align="center">

# ADB-QR

### Wireless Android ADB pairing, made simpler.

Generate Android Wireless Debugging QR codes, discover ADB services, pair devices, and manage wireless connections from a lightweight command-line tool.

<p>
  <a href="#quick-start"><img src="https://img.shields.io/badge/QUICK_START-Get_Started-2563EB?style=for-the-badge" alt="Quick start"></a>
  <a href="#android-wireless"><img src="https://img.shields.io/badge/ANDROID-Wireless_Debugging-16A34A?style=for-the-badge&logo=android&logoColor=white" alt="Android wireless debugging"></a>
  <a href="#commands"><img src="https://img.shields.io/badge/COMMANDS-CLI_Reference-7C3AED?style=for-the-badge" alt="CLI commands"></a>
  <a href="#troubleshooting"><img src="https://img.shields.io/badge/HELP-Troubleshooting-F59E0B?style=for-the-badge" alt="Troubleshooting"></a>
</p>

<p>
  <img src="https://img.shields.io/badge/Python-3.10%2B-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python 3.10+">
  <a href="https://www.npmjs.com/package/adb-qr-windows"><img src="https://img.shields.io/npm/v/adb-qr-windows?style=flat-square&logo=npm" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/adb-qr-windows"><img src="https://img.shields.io/npm/dm/adb-qr-windows?style=flat-square" alt="npm downloads"></a>
  <img src="https://img.shields.io/badge/Windows-primary-0078D4?style=flat-square&logo=windows&logoColor=white" alt="Windows">
  <img src="https://img.shields.io/badge/Android-ADB_Wi--Fi-3DDC84?style=flat-square&logo=android&logoColor=white" alt="Android ADB Wi-Fi">
  <img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="MIT license">
</p>

[ADB documentation](https://developer.android.com/tools/adb) · [Wireless debugging guide](https://developer.android.com/tools/adb#wireless) · [Report an issue](https://github.com/ilter2014/ADB-QR/issues)

</div>

---

## What is ADB-QR?

ADB-QR is a Windows-first command-line helper for Android Debug Bridge (ADB). It aims to make Android wireless-debugging workflows easier to use.

- Generate a QR image from ADB pairing details.
- Discover pairing and connection endpoints using ADB mDNS.
- Pair with an Android device and attempt to connect after pairing.
- List connected devices and connect or disconnect wireless endpoints.
- Run automated tests locally and through GitHub Actions.

> **Project status:** Early development. Automated tests cover core parsing and CLI behavior. End-to-end pairing with a physical Android device has not yet been verified for this release.

## Requirements

- Windows is the primary target.
- Python 3.10 or newer for the Python CLI.
- Android SDK Platform-Tools, including ADB.
- An Android device with Developer options and Wireless debugging enabled.

<p>
  <a href="https://developer.android.com/tools/releases/platform-tools"><img src="https://img.shields.io/badge/ANDROID-Platform--Tools-3DDC84?style=for-the-badge&logo=android&logoColor=white" alt="Download Android Platform-Tools"></a>
  <a href="https://www.python.org/downloads/"><img src="https://img.shields.io/badge/PYTHON-Download-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Download Python"></a>
</p>

<a id="quick-start"></a>

## Quick start

### 1. Download the repository

    git clone https://github.com/ilter2014/ADB-QR.git
    cd ADB-QR

### 2. Create a virtual environment

    py -m venv .venv
    .\.venv\Scripts\Activate.ps1

### 3. Install the Python CLI

    python -m pip install --upgrade pip
    python -m pip install -e .

### 4. Check ADB

    adb version
    adb devices

If ADB is not on PATH, pass its full path with the global --adb option.

## npm CLI

The Node.js CLI is published on npm as **adb-qr-windows**. It uses Node.js and does not require Python.

Install the published package:

    npm install --global adb-qr-windows
    adb-qr --help

The npm edition requires Node.js 18+ and Android Platform-Tools (ADB) on PATH. It does not require Python.

<a id="android-wireless"></a>

## Android wireless pairing

On your phone, open **Developer options → Wireless debugging**. Keep the phone and computer on the same trusted network.

### Generate a pairing QR image

    adb-qr qr --service "SERVICE_NAME" --password "PAIRING_CODE" --output .\qr-output

The QR image is saved as qr-output\adb-qr.png. Use the exact service name and pairing code shown by your device. The QR command does not discover or invent these values.

### Pair using ADB mDNS discovery

    adb-qr pair

The tool looks for an ADB pairing service and prompts for the code displayed by Android. After pairing, it checks for a connection service and attempts to connect.

### List devices

    adb-qr devices

<a id="commands"></a>

## Commands

| Command | Purpose |
|---|---|
| adb-qr --help | Show help and global options |
| adb-qr qr --service NAME --password CODE | Generate a pairing QR image |
| adb-qr pair | Discover and pair through ADB mDNS |
| adb-qr devices | List connected devices |
| adb-qr connect HOST:PORT | Connect to a wireless endpoint |
| adb-qr disconnect HOST:PORT | Disconnect one endpoint |
| adb-qr disconnect --all | Disconnect all connected network devices |

To use a specific ADB executable:

    adb-qr --adb "C:\Android\platform-tools\adb.exe" devices

<a id="troubleshooting"></a>

## Troubleshooting

<details>
<summary><strong>ADB cannot be found</strong></summary>

Install Android SDK Platform-Tools and add adb.exe to PATH, or pass the full path using --adb.
</details>

<details>
<summary><strong>No pairing service is found</strong></summary>

Enable Wireless debugging, open the pairing screen on Android, keep the screen active, and make sure the computer and phone can communicate on the same network.
</details>

<details>
<summary><strong>Pairing succeeded but the device is not connected</strong></summary>

Run adb-qr devices. If necessary, use the connection HOST:PORT displayed on the Wireless debugging screen with adb-qr connect HOST:PORT. The connection port can differ from the pairing port.
</details>

<details>
<summary><strong>Run the tests</strong></summary>

    python -m pip install -e ".[dev]"
    python -m pytest
    ruff check .
</details>

## Security

- Only pair devices you own or are authorized to administer.
- Treat pairing codes and QR images as credentials.
- Never commit pairing codes, QR images, or device-specific credentials.
- Turn off Wireless debugging when you finish.
- ADB-QR uses Android's standard authorization flow; it does not bypass device authorization.

See [SECURITY.md](SECURITY.md) for reporting security issues.

## Contributing

Contributions and bug reports are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## License

MIT. See [LICENSE](LICENSE).

---

<div align="center">

[Report a bug or suggest a feature](https://github.com/ilter2014/ADB-QR/issues) · [Back to top](#top)

</div>

