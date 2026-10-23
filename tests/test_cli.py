from adb_qr.cli import (
    CONNECT_SERVICE,
    PAIR_SERVICE,
    build_parser,
    make_pairing_payload,
    parse_mdns_services,
)


def test_make_pairing_payload():
    assert make_pairing_payload("192.168.1.20:37099", "123456") == (
        "WIFI:T:ADB;S:192.168.1.20:37099;P:123456;;"
    )


def test_payload_rejects_delimiters():
    import pytest

    with pytest.raises(ValueError):
        make_pairing_payload("service;P:evil", "123")


def test_parse_mdns_services():
    output = """
List of discovered mdns services
adb-123._adb-tls-pairing._tcp. 192.168.1.20:37099
adb-123._adb-tls-connect._tcp. 192.168.1.20:39871
"""
    parsed = parse_mdns_services(output)
    assert (PAIR_SERVICE, "192.168.1.20:37099") in parsed
    assert (CONNECT_SERVICE, "192.168.1.20:39871") in parsed


def test_parser_has_subcommands():
    parser = build_parser()
    args = parser.parse_args(["devices"])
    assert args.command == "devices"
