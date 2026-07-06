import time
import auth


def test_check_password_matches_expected():
    assert auth.check_password("hunter2", expected="hunter2") is True
    assert auth.check_password("wrong", expected="hunter2") is False


def test_check_password_rejects_when_no_expected_configured():
    assert auth.check_password("anything", expected="") is False
    assert auth.check_password("anything", expected=None) is False


def test_session_token_round_trip():
    token = auth.create_session_token(secret="test-secret")
    assert auth.verify_session_token(token, secret="test-secret") is True


def test_session_token_rejects_wrong_secret():
    token = auth.create_session_token(secret="test-secret")
    assert auth.verify_session_token(token, secret="different-secret") is False


def test_session_token_rejects_missing_or_garbage():
    assert auth.verify_session_token(None, secret="test-secret") is False
    assert auth.verify_session_token("not-a-real-token", secret="test-secret") is False


def test_session_token_expires(monkeypatch):
    token = auth.create_session_token(secret="test-secret")
    assert auth.verify_session_token(token, secret="test-secret", max_age=0) is False
    time.sleep(1.1)
    assert auth.verify_session_token(token, secret="test-secret", max_age=1) is False
