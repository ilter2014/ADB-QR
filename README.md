<a id="top"></a>

<div align="center">

# ADB-QR

### Android wireless debugging, without the command-line hassle.

**Generate pairing QR codes Â· Discover ADB services Â· Pair devices Â· Manage wireless connections**

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

[**Get started**](#-quick-start) Â· [Commands](#-command-reference) Â· [Troubleshooting](#-troubleshooting) Â· [Contributing](#-contributing)

</div>

---

## âœ¨ What is ADB-QR?

Android's Wireless debugging feature is useful, but pairing and connecting can involve several manual steps. ADB-QR brings common tasks into one place, with a QR-first pairing flow and direct access to ADB commands.

### âœ¨ What you can do

- **QR pairing** â€” create a pairing QR code on your PC for your Android phone to scan.
- **Service discovery** â€” find Android wireless-debugging pairing and connection services through ADB mDNS.
- **Pair and connect** â€” pair with a device and attempt to connect to its wireless ADB endpoint.
- **Device management** â€” list connected devices and connect or disconnect network endpoints.
- **Two ways to use it** â€” choose the Windows-focused Python app or the Node.js CLI available on npm.

> **Project status:** Early development. CLI tests cover core behavior, but successful end-to-end pairing can depend on your Android device, ADB version, network, and Windows Firewall configuration.

## ğŸ§­ Choose your edition

<table>
  <thead>
    <tr>
      <th>ğŸ§° Edition</th>
      <th>ğŸ¯ Best for</th>
      <th>âš™ï¸ Runtime</th>
      <th>ğŸš€ Start here</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Python app</strong></td>
      <td>Interactive Windows workflow</td>
      <td>Python 3.10+</td>
      <td><code>py .\adb-qr.py</code></td>
    </tr>
    <tr>
      <td><strong>npm CLI</strong></td>
      <td>Terminal use and scripting</td>
      <td>Node.js 18+</td>
      <td><code>adb-qr --help</code></td>
    </tr>
  </tbody>
</table>

ğŸ”§ Both editions require Android SDK Platform-Tools so that the `adb` command is available. The npm CLI is implemented in Node.js and does not require Python.

## ğŸš€ Quick start

### ğŸ“¦ Option A â€” Install with npm

ğŸ§© **Requirements:** Node.js 18 or newer and Android SDK Platform-Tools.

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

### ğŸ Option B â€” Run the Python app from source

ğŸ§© **Requirements:** Python 3.10 or newer and Android SDK Platform-Tools.

1. ğŸ“¥ Download or clone this repository.
2. ğŸ’» Open a terminal in the project folder.
3. ğŸ“¦ Install the QR-code dependency.
4. ğŸš€ Start the app.

```powershell
py -m pip install "qrcode[pil]>=7.4.2,<9"
py .\adb-qr.py
```

You can also double-click `adb-qr.cmd` to launch the Windows app.

If ADB is installed in a non-standard location, set the `ADB_PATH` environment variable or use the path supported by the Python app.

## ğŸ“± Android wireless debugging

1. âš™ï¸ On Android, enable **Developer options â†’ Wireless debugging**.
2. ğŸ“¶ Keep the phone and computer on the same trusted Wi-Fi network.
3. ğŸ“· Use the QR pairing option on the phone when prompted by ADB-QR.
4. âœ… Accept Android's authorization prompt if one appears.

ğŸ“š Official documentation: [Android Debug Bridge (ADB)](https://developer.android.com/tools/adb) Â· [SDK Platform-Tools](https://developer.android.com/tools/releases/platform-tools)

### ğŸ“² Pair with a QR code

â–¶ï¸ For the npm CLI, run:

```powershell
adb-qr pair
```

ADB-QR creates a QR image on the computer. On the phone, open **Wireless debugging â†’ Pair device with QR code** and scan the image displayed on the PC. **The PC webcam is not used.**

The CLI waits for the phone to scan the QR, then attempts pairing and connection through ADB mDNS. This flow requires the phone and computer to be able to discover each other on the network.

### ğŸ§¾ Generate a QR image from pairing details

If Android has provided a pairing service name and pairing code, you can create a QR image directly:

```powershell
adb-qr qr --service "SERVICE_NAME" --password "PAIRING_CODE" --output .\qr-output
```

The image is written to `qr-output\adb-qr.png`. Replace the example values with the exact values shown by your device. This command does not discover or invent pairing details.

### ğŸ” Discover available services

```powershell
adb-qr scan
```

This lists pairing and connection endpoints discovered through ADB mDNS.

## ğŸ§° Command reference

| ğŸ’» Command | ğŸ“ Description |
| --- | --- |
| `adb-qr --help` | â” Show help and available commands |
| `adb-qr --version` | ğŸ·ï¸ Show the installed CLI version |
| `adb-qr scan` | ğŸ” Discover wireless-debugging services |
| `adb-qr pair` | ğŸ“² Create a QR on the PC, then pair and connect |
| `adb-qr pair --auto` | ğŸ” Pair using the code shown on Android |
| `adb-qr qr --service NAME --password CODE` | ğŸ§¾ Generate a pairing QR image |
| `adb-qr devices` | ğŸ“± List ADB devices |
| `adb-qr connect HOST:PORT` | ğŸ”— Connect to a wireless ADB endpoint |
| `adb-qr disconnect HOST:PORT` | ğŸ”Œ Disconnect one endpoint |
| `adb-qr disconnect --all` | ğŸ§¹ Disconnect all connected network devices |

To use a specific ADB executable, place the global option before the command:

```powershell
adb-qr --adb "C:\Android\platform-tools\adb.exe" devices
```

> **Note:** The pairing port and connection port can be different. Use the connection endpoint discovered by ADB mDNS or shown by Android's Wireless debugging screen.

## ğŸ› ï¸ Requirements and compatibility

- ğŸªŸ **Operating system:** Windows is the primary target.
- ğŸ **Python edition:** Python 3.10+.
- ğŸ“¦ **npm edition:** Node.js 18+.
- ğŸ¤– **Android tooling:** Android SDK Platform-Tools (`adb`).
- ğŸ“± **Phone:** Android device with Developer options and Wireless debugging support.
- ğŸŒ **Network:** The PC and phone should be on a network that allows device discovery and communication.

â¬‡ï¸ Download Platform-Tools from the [official Android developer website](https://developer.android.com/tools/releases/platform-tools).

## ğŸ§ª Development and tests

Clone the repository and install the dependencies for the edition you want to work on.

### ğŸ§ª Test the npm CLI

ğŸ“‚ From the repository root:

```powershell
npm install
npm test
npm pack --dry-run
```

### ğŸ Test the Python app

ğŸ“¦ Install the development dependencies:

```powershell
py -m pip install -e ".[dev]"
py -m pytest
ruff check .
```

ğŸ› If you report a bug, include the command you ran, the relevant error output, your Windows version, your Node.js or Python version, and your ADB version. **Do not include pairing codes, QR images, private IP details, or other credentials.**

## ğŸ” Security notes

- âœ… Use ADB-QR only with devices you own or are authorized to administer.
- ğŸ”‘ Treat pairing codes and pairing QR images as temporary credentials.
- ğŸš« Do not commit QR images, pairing codes, or device-specific credentials.
- ğŸ”’ Turn off Wireless debugging when you no longer need it.
- ğŸ›¡ï¸ ADB-QR uses Android's standard authorization flow; it does not bypass device authorization.

ğŸ›¡ï¸ For responsible security reporting, see [SECURITY.md](SECURITY.md).

## ğŸ¤ Contributing

ğŸ’¡ Bug reports, ideas, documentation improvements, and pull requests are welcome.

1. Check existing [issues](https://github.com/ilter2014/ADB-QR/issues) before opening a new one.
2. For bugs, include clear reproduction steps and expected versus actual behavior.
3. For pull requests, explain the change and run the relevant tests.

ğŸ“– See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidance.

## ğŸ“„ License

ğŸ“œ ADB-QR is released under the [MIT License](LICENSE).

---

<div align="center">

**Built for Android developers who want a smoother wireless ADB workflow.**

[â¬† Back to top](#top) Â· [Report a bug](https://github.com/ilter2014/ADB-QR/issues) Â· [View on npm](https://www.npmjs.com/package/adb-qr-windows)

</div>
