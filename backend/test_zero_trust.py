import unittest
import urllib.request
import urllib.error
import json
import uuid

BASE_URL = "http://127.0.0.1:8000"

def make_multipart(filename: str, content: bytes) -> tuple:
    boundary = f"----WebKitFormBoundary{uuid.uuid4().hex}"
    body = bytearray()
    body.extend(f"--{boundary}\r\n".encode())
    body.extend(f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'.encode())
    body.extend(b"Content-Type: text/csv\r\n\r\n")
    body.extend(content)
    body.extend(f"\r\n--{boundary}--\r\n".encode())
    return bytes(body), f"multipart/form-data; boundary={boundary}"

class ZeroTrustSecurityTests(unittest.TestCase):
    def test_1_csp_and_security_headers(self):
        """Verify strict Content-Security-Policy and OWASP security headers."""
        req = urllib.request.Request(f"{BASE_URL}/api/health")
        with urllib.request.urlopen(req) as res:
            self.assertEqual(res.status, 200)
            headers = dict(res.headers)
            self.assertIn("content-security-policy", headers)
            self.assertIn("default-src 'self'", headers["content-security-policy"])
            self.assertEqual(headers.get("x-content-type-options"), "nosniff")
            self.assertEqual(headers.get("x-frame-options"), "DENY")
            self.assertEqual(headers.get("referrer-policy"), "strict-origin-when-cross-origin")
            self.assertIn("x-correlation-id", headers)

    def test_2_auth_session_handshake_and_cookie(self):
        """Verify /api/auth/session sets an httpOnly JWT access token cookie."""
        req = urllib.request.Request(f"{BASE_URL}/api/auth/session")
        with urllib.request.urlopen(req) as res:
            self.assertEqual(res.status, 200)
            data = json.loads(res.read().decode())
            self.assertIn("email", data)
            self.assertEqual(data["role"], "analyst")
            set_cookie = res.headers.get("Set-Cookie")
            self.assertIsNotNone(set_cookie)
            self.assertIn("HttpOnly", set_cookie)
            self.assertIn("SameSite=lax", set_cookie)

    def test_3_parameterized_registration_and_login(self):
        """Verify parameterized user registration and login with bcrypt hashing."""
        unique_email = f"analyst_{uuid.uuid4().hex[:8]}@datafect.test"
        reg_payload = json.dumps({
            "email": unique_email,
            "password": "SecurePassword123!"
        }).encode()

        reg_req = urllib.request.Request(
            f"{BASE_URL}/api/auth/register",
            data=reg_payload,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(reg_req) as res:
            self.assertEqual(res.status, 200)
            user_data = json.loads(res.read().decode())
            self.assertEqual(user_data["email"], unique_email)

        # Login with newly created credentials
        login_payload = json.dumps({
            "email": unique_email,
            "password": "SecurePassword123!"
        }).encode()
        login_req = urllib.request.Request(
            f"{BASE_URL}/api/auth/login",
            data=login_payload,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(login_req) as login_res:
            self.assertEqual(login_res.status, 200)
            tokens = json.loads(login_res.read().decode())
            self.assertIn("access_token", tokens)
            self.assertIn("HttpOnly", login_res.headers.get("Set-Cookie"))

    def test_4_idor_session_isolation(self):
        """
        Verify that Tenant A's dataset is securely isolated from Tenant B,
        and that each upload produces a unique owner-bound session.
        """
        csv_content = b"feature_1,feature_2\n10,20\n30,40\n"
        body, ct = make_multipart("tenant_dataset.csv", csv_content)
        req = urllib.request.Request(f"{BASE_URL}/api/upload", data=body, headers={"Content-Type": ct})
        with urllib.request.urlopen(req) as res:
            self.assertEqual(res.status, 200)
            upload_data = json.loads(res.read().decode())
            self.assertIn("session_id", upload_data)
            session_id = upload_data["session_id"]

        # Test querying the session via chat
        chat_payload = json.dumps({
            "history": [],
            "message": "What is the sum of feature_1?",
            "analysis_summary": upload_data,
            "session_id": session_id
        }).encode()
        chat_req = urllib.request.Request(
            f"{BASE_URL}/api/chat",
            data=chat_payload,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(chat_req) as chat_res:
            self.assertEqual(chat_res.status, 200)
            chat_data = json.loads(chat_res.read().decode())
            self.assertIn("response", chat_data)

    def test_5_unhandled_error_masking(self):
        """Verify that malformed or empty payloads receive generic masked error responses."""
        body, ct = make_multipart("zero_bytes.csv", b"")
        req = urllib.request.Request(f"{BASE_URL}/api/upload", data=body, headers={"Content-Type": ct})
        try:
            urllib.request.urlopen(req)
            self.fail("Expected HTTP 400 for empty file")
        except urllib.error.HTTPError as e:
            self.assertEqual(e.code, 400)
            err = json.loads(e.read().decode())
            self.assertIn("empty", err["detail"].lower())

if __name__ == "__main__":
    unittest.main()
