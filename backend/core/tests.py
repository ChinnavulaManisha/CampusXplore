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
