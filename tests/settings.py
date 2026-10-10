from demo.settings import *  # noqa: F403

DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}}
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
if os.environ.get("POSTGRES_DB"):  # noqa: F405
    from demo.settings import DATABASES as DATABASES
