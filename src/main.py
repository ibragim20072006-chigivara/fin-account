"""Демо-выгрузка: накладная №214 из очереди -> output/выгрузка_накладная_214.xlsx."""
from pathlib import Path

from export_xlsx import export_documents

DOCUMENTS = [
    {
        "date": "14.06.2026",
        "counterparty": "СтройБаза Юг",
        "lines": [
            {"category": "Щебень фр. 5–20", "qty": 26.4, "price": 850, "account": "90.01"},
            {"category": "Щебень фр. 20–40", "qty": 18.0, "price": 790, "account": "90.01"},
            {"category": "Отсев 0–5", "qty": 12.2, "price": 430, "account": "90.01"},
            {"category": "Доставка самосвалом", "qty": 2, "price": 3200, "account": "90.01"},
        ],
    },
]


def main():
    out_dir = Path(__file__).resolve().parent.parent / "output"
    out_dir.mkdir(exist_ok=True)
    path = export_documents(DOCUMENTS, out_dir / "выгрузка_накладная_214.xlsx")
    print(f"Готово: {path}")


if __name__ == "__main__":
    main()
