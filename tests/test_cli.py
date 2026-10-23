import subprocess
from types import SimpleNamespace

from adb_qr import app


def test_services_parses_adb_mdns(monkeypatch):
    monkeypatch.setattr(
        app,
        "run_adb",
        lambda *args, **kwargs: SimpleNamespace(
            stdout="List of discovered mdns services\nadb-xyz _adb-tls-pairing._tcp 192.168.1.4:37000\nadb-xyz _adb-tls-connect._tcp 192.168.1.4:42000",
            stderr="",
        ),
    )
    assert app.services() == [
        ("adb-xyz", "_adb-tls-pairing._tcp", "192.168.1.4:37000"),
        ("adb-xyz", "_adb-tls-connect._tcp", "192.168.1.4:42000"),
    ]


def test_help_does_not_open_camera(capsys):
    assert app.main(["--help"]) == 0
    output = capsys.readouterr().out
    assert "adb-qr save" in output
    assert "webcam" not in output.lower()


def test_save_qr_timeout_removes_expired_image(monkeypatch, tmp_path):
    monkeypatch.setattr(app, "wait_for_service", lambda *args, **kwargs: None)
    result = app.save_qr(str(tmp_path))
    assert result == 1
    assert not (tmp_path / "adb-qr.png").exists()


def test_qr_png_is_created_before_wait(monkeypatch, tmp_path):
    original = app.wait_for_service
    def check_file(*args, **kwargs):
        assert (tmp_path / "adb-qr.png").is_file()
        return None
    monkeypatch.setattr(app, "wait_for_service", check_file)
    assert app.save_qr(str(tmp_path)) == 1


def test_app_has_no_webcam_dependency():
    import pathlib
    source = pathlib.Path(app.__file__).read_text(encoding="utf-8")
    assert "cv2" not in source
    assert "VideoCapture" not in source
