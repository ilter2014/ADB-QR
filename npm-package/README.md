# ADB-QR for Windows (npm CLI)

The npm edition is implemented in Node.js and does not install Python packages.

## Install

Install the published package:

    npm install --global adb-qr-windows

Then run:

    adb-qr

This opens the interactive ADB-QR panel. To see the command reference instead, run:

    adb-qr --help

## Requirements

- Node.js 18 or newer
- Android SDK Platform-Tools (adb) in PATH, or use --adb C:\\Android\\platform-tools\\adb.exe
- Android Wireless debugging enabled on the phone

## Commands

    adb-qr --help
    adb-qr pair              # Show a QR on the PC; scan it with the phone
    adb-qr qr --service "SERVICE_NAME" --password "PAIRING_CODE"
    adb-qr qr --service "SERVICE_NAME" --password "PAIRING_CODE" --output .\\qr-output
    adb-qr devices
    adb-qr connect 192.168.1.50:41211
    adb-qr disconnect 192.168.1.50:41211
    adb-qr disconnect --all
    adb-qr --adb "C:\\Android\\platform-tools\\adb.exe" devices

`adb-qr pair` opens a QR image on the computer for the phone to scan, then pairs and connects over ADB mDNS. It never opens the PC webcam. Use `adb-qr pair --auto` only for the manual pairing-code workflow. The `qr` command writes adb-qr.png into the current directory by default. Pairing QR images and codes are credentials: never commit or publicly share them.

## Development

From this directory, run npm install, npm test, and npm pack --dry-run.

ADB-QR uses Android's standard wireless-debugging authorization flow and does not bypass device authorization.

