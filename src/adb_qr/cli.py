from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Sequence
from urllib.parse import quote

PAIR_SERVICE = "_adb-tls-pairing._tcp"
CONNECT_SERVICE = "_adb-tls-connect._tcp"


class AdbError(RuntimeError):
    """Raised when an ADB command fails."""


def run_adb(adb: str, *args: str, timeout: int = 30) -> str:
    """Run ADB safely without invoking a shell."""
    executable = shutil.which(adb) if not Path(adb).is_file() else adb
    if not executable:
        raise AdbError(
            f"Could not find ADB executable '{adb}'. Install Android Platform-Tools "
            "or pass --adb with the full path to adb.exe."
        )
    try:
        result = subprocess.run(
            [executable, *args],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=timeout,
            check=False,
        )
    except subprocess.TimeoutExpired as exc:
        raise AdbError(f"ADB command timed out after {timeout} seconds.") from exc
    except OSError as exc:
        raise AdbError(f"Could not start ADB: {exc}") from exc

    output = "\n".join(part.strip() for part in (result.stdout, result.stderr) if part.strip())
    if result.returncode != 0:
        raise AdbError(output or f"ADB exited with status {result.returncode}.")
    return output


def parse_mdns_services(output: str) -> list[tuple[str, str]]:
    """Parse `adb mdns services` rows into (service, endpoint) tuples."""
    found: list[tuple[str, str]] = []
    for line in output.splitlines():
        match = re.search(r"(_adb-tls-(?:pairing|connect)\._tcp)\.?\s+(\S+)", line)
        if match:
            found.append((match.group(1), match.group(2)))
    return found


def make_pairing_payload(service: str, password: str) -> str:
    """Create the standard ADB Wi-Fi pairing QR payload."""
    if not service or any(ch in service for ch in ";\r\n"):
        raise ValueError("Service name is empty or contains invalid characters.")
    if not password or any(ch in password for ch in ";\r\n"):
        raise ValueError("Pairing password is empty or contains invalid characters.")
    return f"WIFI:T:ADB;S:{service};P:{password};;"


def render_qr(payload: str, output: Path | None = None) -> Path | None:
    """Render a QR code and optionally save it to disk."""
    try:
        import qrcode
    except ImportError as exc:
        raise AdbError("QR dependency missing. Install with: python -m pip install -e .") from exc

    qr = qrcode.QRCode(box_size=10, border=4, error_correction=qrcode.constants.ERROR_CORRECT_M)
    qr.add_data(payload)
    qr.make(fit=True)
    image = qr.make_image(fill_color="black", back_color="white")

    if output is None:
        try:
            image.show()
        except Exception as exc:  # pragma: no cover - desktop-dependent
            raise AdbError(
                "Could not open the QR image viewer. Use `qr --output <directory>` instead."
            ) from exc
        return None

    output.mkdir(parents=True, exist_ok=True)
    path = output / "adb-qr.png"
    image.save(path)
    return path


def command_qr(args: argparse.Namespace) -> int:
    payload = make_pairing_payload(args.service, args.password)
    output = Path(args.output).expanduser().resolve() if args.output else None
    path = render_qr(payload, output)
    if path:
        print(f"QR image saved to: {path}")
        print("Treat this image as a credential; do not share or commit it.")
    else:
        print("QR image opened. Scan it only from Android's Wireless debugging pairing screen.")
    return 0


def command_pair(args: argparse.Namespace) -> int:
    services = parse_mdns_services(run_adb(args.adb, "mdns", "services"))
    pair_endpoints = [endpoint for service, endpoint in services if service == PAIR_SERVICE]
    if not pair_endpoints:
        raise AdbError(
            "No ADB pairing service found. On Android, open Developer options → "
            "Wireless debugging → Pair device with QR code, then try again."
        )

    # ADB QR payload's service field is the service endpoint advertised by mDNS.
    endpoint = pair_endpoints[0]
    host, separator, port = endpoint.rpartition(":")
    if not separator or not host or not port.isdigit():
        raise AdbError(f"Unexpected pairing endpoint from ADB mDNS: {endpoint}")

    password = input("Pairing code/password shown on Android: ").strip()
    if not password:
        raise AdbError("Pairing code cannot be empty.")

    print(f"Pairing with {host}:{port} ...")
    print(run_adb(args.adb, "pair", endpoint, password, timeout=args.timeout))

    services = parse_mdns_services(run_adb(args.adb, "mdns", "services"))
    connect_endpoints = [value for service, value in services if service == CONNECT_SERVICE]
    if connect_endpoints:
        endpoint_to_connect = connect_endpoints[0]
        print(f"Connecting to {endpoint_to_connect} ...")
        print(run_adb(args.adb, "connect", endpoint_to_connect))
    else:
        print(
            "Pairing completed, but no connect service was discovered. "
            "Use `adb-qr connect HOST:PORT` with the endpoint shown in Wireless debugging."
        )
    return 0


def command_devices(args: argparse.Namespace) -> int:
    print(run_adb(args.adb, "devices", "-l"))
    return 0


def command_connect(args: argparse.Namespace) -> int:
    endpoint = args.endpoint.strip()
    if not endpoint or any(ch.isspace() for ch in endpoint):
        raise AdbError("Endpoint must be in HOST:PORT format.")
    print(run_adb(args.adb, "connect", endpoint))
    return 0


def command_disconnect(args: argparse.Namespace) -> int:
    if args.all:
        output = run_adb(args.adb, "devices")
        endpoints = []
        for line in output.splitlines()[1:]:
            parts = line.split()
            if len(parts) >= 2 and parts[1] == "device" and ":" in parts[0]:
                endpoints.append(parts[0])
        if not endpoints:
            print("No connected network ADB devices found.")
            return 0
        for endpoint in endpoints:
            print(run_adb(args.adb, "disconnect", endpoint))
        return 0

    if not args.endpoint:
        raise AdbError("Provide HOST:PORT or use --all.")
    print(run_adb(args.adb, "disconnect", args.endpoint))
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="adb-qr",
        description="Pair Android devices over Wi-Fi using ADB and QR codes.",
    )
    parser.add_argument(
        "--adb",
        default="adb",
        help="ADB executable name or full path (default: adb on PATH).",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    qr = subparsers.add_parser("qr", help="Create a pairing QR image from a service and password.")
    qr.add_argument("--service", required=True, help="Pairing service name/address to encode.")
    qr.add_argument("--password", required=True, help="Pairing password/code to encode.")
    qr.add_argument("--output", help="Directory in which to save adb-qr.png.")
    qr.set_defaults(func=command_qr)

    pair = subparsers.add_parser("pair", help="Pair using an endpoint discovered by ADB mDNS.")
    pair.add_argument("--timeout", type=int, default=30, help="ADB command timeout in seconds.")
    pair.set_defaults(func=command_pair)

    devices = subparsers.add_parser("devices", help="List ADB devices.")
    devices.set_defaults(func=command_devices)

    connect = subparsers.add_parser("connect", help="Connect to HOST:PORT.")
    connect.add_argument("endpoint")
    connect.set_defaults(func=command_connect)

    disconnect = subparsers.add_parser("disconnect", help="Disconnect a device or all network devices.")
    group = disconnect.add_mutually_exclusive_group()
    group.add_argument("--all", action="store_true", help="Disconnect all connected network devices.")
    group.add_argument("endpoint", nargs="?", help="HOST:PORT endpoint.")
    disconnect.set_defaults(func=command_disconnect)

    return parser


def main(argv: Sequence[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        return int(args.func(args))
    except (AdbError, ValueError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
