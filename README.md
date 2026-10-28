<a id="top"></a>

<div align="center">

# ADB-QR

### Android wireless debugging, without the command-line hassle.

**Generate pairing QR codes · Discover ADB services · Pair devices · Manage wireless connections**

ADB-QR is a Windows-first toolkit for Android Debug Bridge (ADB). Use the interactive Python app or install the lightweight Node.js CLI from npm to make common wireless-debugging tasks easier.

<p>
  <a href="https://www.npmjs.com/package/adb-qr-windows"><img src="https://img.shields.io/npm/v/adb-qr-windows?logo=npm&logoColor=white&label=npm%20version" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/adb-qr-windows"><img src="https://img.shields.io/npm/dm/adb-qr-windows?logo=npm&label=monthly%20downloads" alt="npm monthly downloads"></a>
  <a href="https://github.com/ilter2014/ADB-QR/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-green.svg" alt="MIT License"></a>
  <a href="https://github.com/ilter2014/ADB-QR/stargazers"><img src="https://img.shields.io/github/stars/ilter2014/ADB-QR?style=flat&logo=github&label=stars" alt="GitHub stars"></a>
  <a href="https://github.com/ilter2014/ADB-QR/issues"><img src="https://img.shields.io/github/issues/ilter2014/ADB-QR?label=issues" alt="GitHub issues"></a>
</p>

<p>
  <img src="https://img.shields.io/badge/Platform-Windows-0078D4?logo=windows&logoColor=white" alt="Windows">
  <img src="https://img.shields.io/badge/Android-ADB-3DDC84?logo=android&logoColor=white" alt="Android ADB">
  <img src="https://img.shields.io/badge/Node.js-18%2B-339933?logo=nodedotjs&logoColor=white" alt="Node.js 18 or newer">
  <img src="https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white" alt="Python 3.10 or newer">
</p>

<a href="#quick-start"><img src="https://img.shields.io/badge/🚀_Get_Started-2ea44f?style=for-the-badge" alt="Get started"></a> <a href="#command-reference"><img src="https://img.shields.io/badge/⌨_Commands-0969da?style=for-the-badge" alt="Commands"></a> <a href="#troubleshooting"><img src="https://img.shields.io/badge/🛠_Troubleshooting-6f42c1?style=for-the-badge" alt="Troubleshooting"></a> <a href="#contributing"><img src="https://img.shields.io/badge/🤝_Contributing-57606a?style=for-the-badge" alt="Contributing"></a>

</div>

---

## What is ADB-QR?

Android's Wireless debugging feature is useful, but pairing and connecting can involve several manual steps. ADB-QR brings common tasks into one place, with a QR-first pairing flow and direct access to ADB commands.

### Features

- **QR pairing:** Create a pairing QR code on your PC for your Android phone to scan.
- **Service discovery:** Find Android wireless-debugging pairing and connection services through ADB mDNS.
- **Pair and connect:** Pair with a device and attempt to connect to its wireless ADB endpoint.
- **Device management:** List connected devices and connect or disconnect network endpoints.
- **Two ways to use it:** Choose the Windows-focused Python app or the Node.js CLI available on npm.

> **Project status:** Early development. CLI tests cover core behavior, but successful end-to-end pairing can depend on your Android device, ADB version, network, and Windows Firewall configuration.

## Choose your edition

| Edition | Best for | Requirements | Start here |
| --- | --- | --- | --- |
| **Python app** | Interactive Windows workflow | Python 3.10+ | `py .\adb-qr.py` |
| **npm CLI** | Terminal use and scripting | Node.js 18+ | `adb-qr --help` |

Both editions require Android SDK Platform-Tools so that the `adb` command is available. The npm CLI is implemented in Node.js and does not require Python.

## Quick start

### Option A — Install with npm

**Requirements:** Node.js 18 or newer and Android SDK Platform-Tools.

```powershell
npm install --global adb-qr-windows
adb-qr --help
```

Check the installed version:

```powershell
adb-qr --version
```

If ADB is not on your `PATH`, pass its location with `--adb`:

```powershell
adb-qr --adb "C:\Android\platform-tools\adb.exe" devices
```

### Option B — Run the Python app from source

**Requirements:** Python 3.10 or newer and Android SDK Platform-Tools.

1. Download or clone this repository.
2. Open a terminal in the project folder.
3. Install the QR-code dependency.
4. Start the app.

```powershell
py -m pip install "qrcode[pil]>=7.4.2,<9"
py .\adb-qr.py
```

You can also double-click `adb-qr.cmd` to launch the Windows app.

If ADB is installed in a non-standard location, set the `ADB_PATH` environment variable or use the path supported by the Python app.

## Android wireless debugging

1. On Android, enable **Developer options → Wireless debugging**.
2. Keep the phone and computer on the same trusted Wi-Fi network.
3. Use the QR pairing option on the phone when prompted by ADB-QR.
4. Accept Android's authorization prompt if one appears.

Official documentation buttons: <a href="https://developer.android.com/tools/adb"><img src="https://img.shields.io/badge/Android_Debug_Bridge_(ADB)-3DDC84?style=for-the-badge&logo=android&logoColor=white" alt="Android Debug Bridge documentation"></a> <a href="https://developer.android.com/tools/releases/platform-tools"><img src="https://img.shields.io/badge/SDK_Platform--Tools-4285F4?style=for-the-badge&logo=android&logoColor=white" alt="SDK Platform-Tools download"></a>

### Pair with a QR code

For the npm CLI, run:

```powershell
adb-qr pair
```

ADB-QR creates a QR image on the computer. On the phone, open **Wireless debugging → Pair device with QR code** and scan the image displayed on the PC. **The PC webcam is not used.**

The CLI waits for the phone to scan the QR, then attempts pairing and connection through ADB mDNS. This flow requires the phone and computer to be able to discover each other on the network.

### Generate a QR image from pairing details

If Android has provided a pairing service name and pairing code, you can create a QR image directly:

```powershell
adb-qr qr --service "SERVICE_NAME" --password "PAIRING_CODE" --output .\qr-output
```

The image is written to `qr-output\adb-qr.png`. Replace the example values with the exact values shown by your device. This command does not discover or invent pairing details.

### Discover available services

```powershell
adb-qr scan
```

This lists pairing and connection endpoints discovered through ADB mDNS.

## Command reference

| Command | Description |
| --- | --- |
| `adb-qr --help` | Show help and available commands |
| `adb-qr --version` | Show the installed CLI version |
| `adb-qr scan` | Discover wireless-debugging services |
| `adb-qr pair` | Create a QR on the PC, then pair and connect |
| `adb-qr pair --auto` | Pair using the code shown on Android |
| `adb-qr qr --service NAME --password CODE` | Generate a pairing QR image |
| `adb-qr devices` | List ADB devices |
| `adb-qr connect HOST:PORT` | Connect to a wireless ADB endpoint |
| `adb-qr disconnect HOST:PORT` | Disconnect one endpoint |
| `adb-qr disconnect --all` | Disconnect all connected network devices |

To use a specific ADB executable, place the global option before the command:

```powershell
adb-qr --adb "C:\Android\platform-tools\adb.exe" devices
```

> **Note:** The pairing port and connection port can be different. Use the connection endpoint discovered by ADB mDNS or shown by Android's Wireless debugging screen.

## Requirements and compatibility

- **Operating system:** Windows is the primary target.
- **Python edition:** Python 3.10+.
- **npm edition:** Node.js 18+.
- **Android tooling:** Android SDK Platform-Tools (`adb`).
- **Phone:** Android device with Developer options and Wireless debugging support.
- **Network:** The PC and phone should be on a network that allows device discovery and communication.

Download Android SDK Platform-Tools: <a href="https://developer.android.com/tools/releases/platform-tools"><img src="https://img.shields.io/badge/Download_Platform--Tools-4285F4?style=for-the-badge&logo=android&logoColor=white" alt="Download Android SDK Platform-Tools"></a>

## Development and tests

Clone the repository and install the dependencies for the edition you want to work on.

### Test the npm CLI

From the repository root:

```powershell
npm install
npm test
npm pack --dry-run
```

### Test the Python app

Install the development dependencies:

```powershell
py -m pip install -e ".[dev]"
py -m pytest
ruff check .
```

If you report a bug, include the command you ran, the relevant error output, your Windows version, your Node.js or Python version, and your ADB version. **Do not include pairing codes, QR images, private IP details, or other credentials.**

## Security notes

- Use ADB-QR only with devices you own or are authorized to administer.
- Treat pairing codes and pairing QR images as temporary credentials.
- Do not commit QR images, pairing codes, or device-specific credentials.
- Turn off Wireless debugging when you no longer need it.
- ADB-QR uses Android's standard authorization flow; it does not bypass device authorization.

Security reporting: <a href="./SECURITY.md"><img src="https://img.shields.io/badge/Security_Policy-D1242F?style=for-the-badge&logo=github&logoColor=white" alt="Read security policy"></a>

## Contributing

Bug reports, ideas, documentation improvements, and pull requests are welcome.

1. Check existing issues before opening a new one: <a href="https://github.com/ilter2014/ADB-QR/issues"><img src="https://img.shields.io/badge/Browse_Issues-0969da?style=for-the-badge&logo=github&logoColor=white" alt="Browse issues"></a>
2. For bugs, include clear reproduction steps and expected versus actual behavior.
3. For pull requests, explain the change and run the relevant tests.

Contribution guide: <a href="./CONTRIBUTING.md"><img src="https://img.shields.io/badge/Contribution_Guide-57606a?style=for-the-badge&logo=github&logoColor=white" alt="Read contribution guide"></a>

## License

ADB-QR is released under the MIT License: <a href="./LICENSE"><img src="https://img.shields.io/badge/Read_MIT_License-green?style=for-the-badge&logo=opensourceinitiative&logoColor=white" alt="Read MIT License"></a>

---

<div align="center">

**Built for Android developers who want a smoother wireless ADB workflow.**

<a href="#top"><img src="https://img.shields.io/badge/⬆_Back_to_Top-57606a?style=for-the-badge" alt="Back to top"></a> <a href="https://github.com/ilter2014/ADB-QR/issues"><img src="https://img.shields.io/badge/🐛_Report_a_Bug-d1242f?style=for-the-badge&logo=github&logoColor=white" alt="Report a bug"></a> <a href="https://www.npmjs.com/package/adb-qr-windows"><img src="https://img.shields.io/badge/📦_View_on_NPM-cb3837?style=for-the-badge&logo=npm&logoColor=white" alt="View on npm"></a>

</div>
