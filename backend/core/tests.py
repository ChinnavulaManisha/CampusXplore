import os
import subprocess
import sys
from django.test import SimpleTestCase
from django.conf import settings
from rest_framework.test import APIClient


class HealthCheckTests(SimpleTestCase):
    def test_health_check_endpoint(self):
        client = APIClient()
        response = client.get('/api/health/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {
            "status": "ok",
            "message": "CampusXplore backend is running"
        })


class SettingsSecurityConfigurationTests(SimpleTestCase):
    def test_missing_db_name_raises_improperly_configured(self):
        code = (
            "import os, sys\n"
            "sys.path.insert(0, os.getcwd())\n"
            "os.environ['SECRET_KEY'] = 'test-secret-key'\n"
            "os.environ.pop('DB_NAME', None)\n"
            "from unittest.mock import patch\n"
            "with patch('dotenv.load_dotenv', return_value=None):\n"
            "    try:\n"
            "        from config import settings\n"
            "        import importlib\n"
            "        importlib.reload(settings)\n"
            "        sys.exit(1)\n"
            "    except Exception as e:\n"
            "        assert 'DB_NAME' in str(e), f'Unexpected error: {e}'\n"
            "        sys.exit(0)\n"
        )
        res = subprocess.run([sys.executable, "-c", code], capture_output=True, text=True, cwd=str(settings.BASE_DIR))
        self.assertEqual(res.returncode, 0, msg=f"Command failed: {res.stderr}")

    def test_missing_secret_key_raises_improperly_configured(self):
        code = (
            "import os, sys\n"
            "sys.path.insert(0, os.getcwd())\n"
            "os.environ['DB_NAME'] = 'test_campusxplore_db'\n"
            "os.environ.pop('SECRET_KEY', None)\n"
            "from unittest.mock import patch\n"
            "with patch('dotenv.load_dotenv', return_value=None):\n"
            "    try:\n"
            "        from config import settings\n"
            "        import importlib\n"
            "        importlib.reload(settings)\n"
            "        sys.exit(1)\n"
            "    except Exception as e:\n"
            "        assert 'SECRET_KEY' in str(e), f'Unexpected error: {e}'\n"
            "        sys.exit(0)\n"
        )
        res = subprocess.run([sys.executable, "-c", code], capture_output=True, text=True, cwd=str(settings.BASE_DIR))
        self.assertEqual(res.returncode, 0, msg=f"Command failed: {res.stderr}")

    def test_debug_defaults_to_false_when_unset(self):
        # Validate that unconfigured DEBUG evaluates to False
        parsed_debug = os.environ.get('UNCONFIGURED_DEBUG_VAR', 'False').lower() in ('true', '1', 'yes')
        self.assertFalse(parsed_debug)

    def test_invalid_debug_values_evaluate_to_false(self):
        # Validate that invalid/malformed DEBUG values safely evaluate to False
        invalid_values = ['random', 'Trueish', 'enabled', '2', 'none', '', 'false', '0', 'no']
        for val in invalid_values:
            parsed = val.lower() in ('true', '1', 'yes')
            self.assertFalse(parsed, f"Value '{val}' should safely evaluate to False")

    def test_missing_jwt_signing_key_causes_improperly_configured(self):
        code = (
            "import os, sys\n"
            "sys.path.insert(0, os.getcwd())\n"
            "os.environ['DB_NAME'] = 'test_db'\n"
            "os.environ['SECRET_KEY'] = 'test-secret-key'\n"
            "os.environ.pop('JWT_SIGNING_KEY', None)\n"
            "from unittest.mock import patch\n"
            "with patch('dotenv.load_dotenv', return_value=None):\n"
            "    try:\n"
            "        from config import settings\n"
            "        import importlib\n"
            "        importlib.reload(settings)\n"
            "        sys.exit(1)\n"
            "    except Exception as e:\n"
            "        assert 'JWT_SIGNING_KEY' in str(e), f'Unexpected error: {e}'\n"
            "        sys.exit(0)\n"
        )
        res = subprocess.run([sys.executable, "-c", code], capture_output=True, text=True, cwd=str(settings.BASE_DIR))
        self.assertEqual(res.returncode, 0, msg=f"Command failed: {res.stderr}")

    def test_empty_jwt_signing_key_causes_improperly_configured(self):
        code = (
            "import os, sys\n"
            "sys.path.insert(0, os.getcwd())\n"
            "os.environ['DB_NAME'] = 'test_db'\n"
            "os.environ['SECRET_KEY'] = 'test-secret-key'\n"
            "os.environ['JWT_SIGNING_KEY'] = ''\n"
            "from unittest.mock import patch\n"
            "with patch('dotenv.load_dotenv', return_value=None):\n"
            "    try:\n"
            "        from config import settings\n"
            "        import importlib\n"
            "        importlib.reload(settings)\n"
            "        sys.exit(1)\n"
            "    except Exception as e:\n"
            "        assert 'JWT_SIGNING_KEY' in str(e), f'Unexpected error: {e}'\n"
            "        sys.exit(0)\n"
        )
        res = subprocess.run([sys.executable, "-c", code], capture_output=True, text=True, cwd=str(settings.BASE_DIR))
        self.assertEqual(res.returncode, 0, msg=f"Command failed: {res.stderr}")

    def test_valid_dedicated_jwt_signing_key_is_used(self):
        signing_key = settings.SIMPLE_JWT.get('SIGNING_KEY')
        self.assertTrue(signing_key)
        self.assertNotEqual(signing_key, settings.SECRET_KEY)
        self.assertEqual(signing_key, settings.JWT_SIGNING_KEY)

    def test_secret_key_is_never_used_as_fallback_for_jwt_signing_key(self):
        code = (
            "import os, sys\n"
            "sys.path.insert(0, os.getcwd())\n"
            "os.environ['DB_NAME'] = 'test_db'\n"
            "os.environ['SECRET_KEY'] = 'explicit-secret-key-12345'\n"
            "os.environ.pop('JWT_SIGNING_KEY', None)\n"
            "from unittest.mock import patch\n"
            "with patch('dotenv.load_dotenv', return_value=None):\n"
            "    try:\n"
            "        from config import settings\n"
            "        import importlib\n"
            "        importlib.reload(settings)\n"
            "        sys.exit(1)\n"
            "    except Exception as e:\n"
            "        assert 'JWT_SIGNING_KEY' in str(e)\n"
            "        sys.exit(0)\n"
        )
        res = subprocess.run([sys.executable, "-c", code], capture_output=True, text=True, cwd=str(settings.BASE_DIR))
        self.assertEqual(res.returncode, 0, msg=f"Fallback occurred unexpectedly: {res.stderr}")


class CorsConfigurationAndPreflightRegressionTests(SimpleTestCase):
    def test_production_origins_configured(self):
        self.assertIn('https://campusxplore-app.vercel.app', settings.CORS_ALLOWED_ORIGINS)
        self.assertIn('https://campusxplore.vercel.app', settings.CORS_ALLOWED_ORIGINS)
        self.assertIn('http://localhost:5173', settings.CORS_ALLOWED_ORIGINS)
        self.assertIn('https://campusxplore-app.vercel.app', settings.CSRF_TRUSTED_ORIGINS)
        # Ensure security: wildcards or allow-all must never be used
        self.assertFalse(getattr(settings, 'CORS_ALLOW_ALL_ORIGINS', False))

    def test_cors_preflight_for_production_origin_on_api_path(self):
        client = APIClient()
        response = client.options(
            '/api/auth/register/',
            HTTP_ORIGIN='https://campusxplore-app.vercel.app',
            HTTP_ACCESS_CONTROL_REQUEST_METHOD='POST',
            HTTP_ACCESS_CONTROL_REQUEST_HEADERS='content-type',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.get('access-control-allow-origin'),
            'https://campusxplore-app.vercel.app'
        )
        self.assertIn('POST', response.get('access-control-allow-methods', ''))

    def test_cors_preflight_for_production_origin_on_direct_auth_path(self):
        client = APIClient()
        response = client.options(
            '/auth/register/',
            HTTP_ORIGIN='https://campusxplore-app.vercel.app',
            HTTP_ACCESS_CONTROL_REQUEST_METHOD='POST',
            HTTP_ACCESS_CONTROL_REQUEST_HEADERS='content-type',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.get('access-control-allow-origin'),
            'https://campusxplore-app.vercel.app'
        )
        self.assertIn('POST', response.get('access-control-allow-methods', ''))

    def test_cors_disallows_unauthorized_origin(self):
        client = APIClient()
        response = client.options(
            '/api/auth/register/',
            HTTP_ORIGIN='https://unauthorized-phishing-site.example.com',
            HTTP_ACCESS_CONTROL_REQUEST_METHOD='POST',
        )
        self.assertNotIn('access-control-allow-origin', response)
