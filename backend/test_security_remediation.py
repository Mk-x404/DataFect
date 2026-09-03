import unittest
import urllib.request
import urllib.error
import json
import uuid

BASE_URL = "http://127.0.0.1:8000"

def make_multipart_body(filename: str, file_bytes: bytes, field_name: str = "file") -> tuple:
    boundary = f"----WebKitFormBoundary{uuid.uuid4().hex}"
    body = bytearray()
    body.extend(f"--{boundary}\r\n".encode())
    body.extend(f'Content-Disposition: form-data; name="{field_name}"; filename="{filename}"\r\n'.encode())
    body.extend(b"Content-Type: text/csv\r\n\r\n")
    body.extend(file_bytes)
    body.extend(f"\r\n--{boundary}--\r\n".encode())
    content_type = f"multipart/form-data; boundary={boundary}"
    return bytes(body), content_type

class LiveSecurityTests(unittest.TestCase):
    def test_1_security_headers_present(self):
        """Verify standard security headers are set on all responses."""
        req = urllib.request.Request(f"{BASE_URL}/api/health")
        with urllib.request.urlopen(req) as res:
            self.assertEqual(res.status, 200)
            headers = dict(res.headers)
            self.assertEqual(headers.get("x-content-type-options"), "nosniff")
            self.assertEqual(headers.get("x-frame-options"), "DENY")
            self.assertEqual(headers.get("referrer-policy"), "strict-origin-when-cross-origin")
            self.assertEqual(headers.get("x-xss-protection"), "1; mode=block")

    def test_2_multi_tenant_session_isolation(self):
        """
        Verify tenant isolation:
        Tenant A uploads Dataset A -> gets session_id_a.
        Tenant B uploads Dataset B -> gets session_id_b.
        Verify session_id_a != session_id_b.
        """
        csv_a = b"user_id,salary_secret\nAlice,150000\nBob,175000\n"
        body_a, ct_a = make_multipart_body("tenant_a.csv", csv_a)
        req_a = urllib.request.Request(f"{BASE_URL}/api/upload", data=body_a, headers={"Content-Type": ct_a})
        with urllib.request.urlopen(req_a) as res_a:
            data_a = json.loads(res_a.read().decode())
            session_id_a = data_a.get("session_id")
            self.assertIsNotNone(session_id_a)

        csv_b = b"customer,order_secret\nCharlie,99\nDavid,149\n"
        body_b, ct_b = make_multipart_body("tenant_b.csv", csv_b)
        req_b = urllib.request.Request(f"{BASE_URL}/api/upload", data=body_b, headers={"Content-Type": ct_b})
        with urllib.request.urlopen(req_b) as res_b:
            data_b = json.loads(res_b.read().decode())
            session_id_b = data_b.get("session_id")
            self.assertIsNotNone(session_id_b)

        self.assertNotEqual(session_id_a, session_id_b)

        # Test querying with Tenant A's session
        chat_req_a = urllib.request.Request(
            f"{BASE_URL}/api/chat",
            data=json.dumps({
                "history": [],
                "message": "Tell me the column names",
                "analysis_summary": data_a,
                "session_id": session_id_a
            }).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(chat_req_a) as res_chat_a:
            self.assertEqual(res_chat_a.status, 200)

    def test_3_backward_compatible_session_fallback(self):
        """Verify chat works seamlessly without session_id (legacy fallback)."""
        chat_req = urllib.request.Request(
            f"{BASE_URL}/api/chat",
            data=json.dumps({
                "history": [],
                "message": "What is the row count?",
                "analysis_summary": {"row_count": 2, "column_count": 2, "columns": []}
            }).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(chat_req) as res_chat:
            self.assertEqual(res_chat.status, 200)
            res_json = json.loads(res_chat.read().decode())
            self.assertIn("response", res_json)

    def test_4_streaming_file_size_limit(self):
        """Verify uploads exceeding 50MB return HTTP 413 without crashing server."""
        # 51 MB dummy upload
        large_data = b"0" * (51 * 1024 * 1024)
        body, ct = make_multipart_body("oversized.csv", large_data)
        req = urllib.request.Request(f"{BASE_URL}/api/upload", data=body, headers={"Content-Type": ct})
        try:
            urllib.request.urlopen(req)
            self.fail("Expected HTTP 413 for oversized file")
        except urllib.error.HTTPError as e:
            self.assertEqual(e.code, 413)
            err_data = json.loads(e.read().decode())
            self.assertIn("exceeds maximum allowed limit", err_data["detail"])

    def test_5_sanitized_error_handling(self):
        """Verify 0-byte file returns clean 400 error without internal stack trace."""
        body, ct = make_multipart_body("empty.csv", b"")
        req = urllib.request.Request(f"{BASE_URL}/api/upload", data=body, headers={"Content-Type": ct})
        try:
            urllib.request.urlopen(req)
            self.fail("Expected HTTP 400 for empty file")
        except urllib.error.HTTPError as e:
            self.assertEqual(e.code, 400)
            err_data = json.loads(e.read().decode())
            self.assertIn("empty", err_data["detail"].lower())

if __name__ == "__main__":
    unittest.main()
