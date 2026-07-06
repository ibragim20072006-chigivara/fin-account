"""Выгрузка отгруженных документов в .xlsx: читает вход из DATA_DIR/documents.json."""
import json
import os
from pathlib import Path

from export_xlsx import export_documents

ROOT = Path(__file__).resolve().parent.parent


def load_env(root):
    env_path = root / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


def main():
    load_env(ROOT)
    data_dir = ROOT / os.environ.get("DATA_DIR", "data")
    out_dir = ROOT / os.environ.get("OUTPUT_DIR", "output")
    source = data_dir / "documents.json"

    if not source.exists():
        print(f"Нет входных данных: {source}")
        print('Ожидается JSON вида: [{"date","counterparty","lines":[{"category","qty","price","account"}]}]')
        return

    documents = json.loads(source.read_text(encoding="utf-8"))
    out_dir.mkdir(parents=True, exist_ok=True)
    path = export_documents(documents, out_dir / "выгрузка.xlsx")
    print(f"Готово: {path}")


if __name__ == "__main__":
    main()
