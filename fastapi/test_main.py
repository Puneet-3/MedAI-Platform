"""Regression checks using the ASGI app directly; no database or HTTP test dependency needed."""
import json
import os
import unittest
from unittest.mock import patch
import main


async def request(path, body=None, secret="test-secret"):
    encoded = json.dumps(body).encode() if body is not None else b""
    headers = [(b"content-type", b"application/json")]
    if secret is not None:
        headers.append((b"x-fastapi-secret", secret.encode()))
    scope = {"type": "http", "asgi": {"version": "3.0"}, "http_version": "1.1", "method": "POST" if body is not None else "GET", "scheme": "http", "path": path, "raw_path": path.encode(), "query_string": b"", "root_path": "", "headers": headers, "client": ("127.0.0.1", 1), "server": ("test", 80)}
    sent = []
    received = False
    async def receive():
        nonlocal received
        if received:
            return {"type": "http.disconnect"}
        received = True
        return {"type": "http.request", "body": encoded, "more_body": False}
    async def send(message):
        sent.append(message)
    await main.app(scope, receive, send)
    status = next(item["status"] for item in sent if item["type"] == "http.response.start")
    data = b"".join(item.get("body", b"") for item in sent if item["type"] == "http.response.body")
    return status, json.loads(data)


class InferenceTests(unittest.IsolatedAsyncioTestCase):
    @classmethod
    def setUpClass(cls):
        main.load_ml_resources()

    def setUp(self):
        self.environment = patch.dict(os.environ, {"FASTAPI_SECRET": "test-secret"})
        self.environment.start()
        self.addCleanup(self.environment.stop)

    async def test_health_reports_actual_capabilities(self):
        status, data = await request("/health", secret=None)
        self.assertEqual(status, 200)
        self.assertEqual(data["models_loaded"]["xray_analyzer"], main.xray_model is not None)

    async def test_inference_requires_secret(self):
        status, _ = await request("/predict", {"symptoms": ["cough"]}, secret=None)
        self.assertEqual(status, 401)

    async def test_unconfigured_secret_disables_inference(self):
        with patch.dict(os.environ, {"FASTAPI_SECRET": ""}):
            status, _ = await request("/chat", {"message": "hello"})
        self.assertEqual(status, 503)

    async def test_empty_symptoms_are_rejected(self):
        status, _ = await request("/predict", {"symptoms": []})
        self.assertEqual(status, 422)

    async def test_non_string_symptom_is_rejected(self):
        status, _ = await request("/predict", {"symptoms": [123]})
        self.assertEqual(status, 422)

    async def test_unknown_symptoms_are_not_silently_ignored(self):
        status, _ = await request("/predict", {"symptoms": ["cough", "invented_symptom"]})
        self.assertEqual(status, 400)

    async def test_real_predictor_outputs_valid_matches(self):
        self.assertIsNotNone(main.model, "Train the symptom predictor before running integration checks")
        status, data = await request("/predict", {"symptoms": ["cough", "high fever"]})
        self.assertEqual(status, 200)
        self.assertTrue(1 <= len(data["results"]) <= 3)
        self.assertTrue(all(0 < item["confidence"] <= 1 for item in data["results"]))
        self.assertTrue(all(item["disease"] in main.label_encoder.classes_ for item in data["results"]))
        self.assertNotIn("Blood Panel", data.get("recommended_test") or "")

    async def test_whitespace_message_is_rejected(self):
        status, _ = await request("/chat", {"message": "   "})
        self.assertEqual(status, 422)

    async def test_unseen_words_trigger_fallback(self):
        status, data = await request("/chat", {"message": "qzxvbnmasdfghjkl"})
        self.assertEqual(status, 200)
        self.assertEqual(data["intent"], "fallback")
        self.assertEqual(data["confidence"], 0)

    async def test_missing_predictor_returns_unavailable(self):
        with patch.object(main, "model", None):
            status, _ = await request("/predict", {"symptoms": ["cough"]})
        self.assertEqual(status, 503)

    def test_untrained_xray_cannot_return_a_prediction(self):
        with patch.object(main, "xray_model", None):
            with self.assertRaises(main.HTTPException) as raised:
                main.analyze_xray(None)
        self.assertEqual(raised.exception.status_code, 503)

    async def test_duplicate_intent_tags_are_rejected(self):
        topic = {"tag": "hello", "patterns": ["hello"], "responses": ["Hello"]}
        status, _ = await request("/intents", {"intents": [topic, topic]})
        self.assertEqual(status, 422)


class CloudConfigurationTests(unittest.IsolatedAsyncioTestCase):
    async def test_cloud_intent_editing_does_not_write_ephemeral_files(self):
        topic = {"tag": "hello", "patterns": ["hello"], "responses": ["Hello"]}
        with patch.dict(os.environ, {"FASTAPI_SECRET": "test-secret", "VERCEL": "1"}):
            status, _ = await request("/intents", {"intents": [topic]})
        self.assertEqual(status, 501)

    async def test_cloud_retraining_is_explicitly_unavailable(self):
        with patch.dict(os.environ, {"FASTAPI_SECRET": "test-secret", "VERCEL": "1"}):
            status, _ = await request("/retrain", {})
        self.assertEqual(status, 501)


if __name__ == "__main__":
    unittest.main()
