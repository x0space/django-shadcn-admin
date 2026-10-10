"""Compile the project's small translation catalog without a gettext binary."""

import json
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def compile_catalog(messages, output):
    pairs = sorted(messages.items())
    ids = [key.encode("utf-8") for key, value in pairs]
    strings = [value.encode("utf-8") for key, value in pairs]
    count = len(pairs)
    offset = 28 + 16 * count
    id_table, string_table = [], []
    for value in ids:
        id_table.append((len(value), offset))
        offset += len(value) + 1
    for value in strings:
        string_table.append((len(value), offset))
        offset += len(value) + 1
    header = struct.pack("<7I", 0x950412DE, 0, count, 28, 28 + count * 8, 0, 0)
    tables = b"".join(struct.pack("<2I", *entry) for entry in id_table + string_table)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(header + tables + b"\0".join(ids) + b"\0" + b"\0".join(strings) + b"\0")


if __name__ == "__main__":
    translations = json.loads((ROOT / "demo/locale/translations.json").read_text(encoding="utf-8"))
    for language, messages in translations.items():
        messages = {
            "": f"Content-Type: text/plain; charset=UTF-8\nLanguage: {language}\nPlural-Forms: nplurals=2; plural=(n != 1);\n",
            **messages,
        }
        path = ROOT / "demo/locale" / language / "LC_MESSAGES/django.mo"
        compile_catalog(messages, path)
        po = "\n\n".join(
            f"msgid {json.dumps(key, ensure_ascii=False)}\nmsgstr {json.dumps(value, ensure_ascii=False)}"
            for key, value in sorted(messages.items())
        )
        path.with_suffix(".po").write_text(po + "\n", encoding="utf-8")
    print("Compiled Persian and Arabic demo catalogs.")
