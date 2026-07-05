"""Выгрузка отгруженных документов в .xlsx по маппингу «шаблон_учёт.xlsx» (7 колонок, для 1С:Бухгалтерии)."""
from openpyxl import Workbook
from openpyxl.styles import Font

# Колонка шаблона -> откуда берётся (см. экран «Шаблоны» в веб-интерфейсе)
COLUMNS = ["Дата", "Контрагент", "Номенклатура", "Кол-во", "Цена", "Сумма", "Счёт учёта"]


def export_documents(documents, path):
    """documents: [{date, counterparty, lines: [{category, qty, price, account}]}]"""
    wb = Workbook()
    ws = wb.active
    ws.title = "Выгрузка"

    ws.append(COLUMNS)
    for cell in ws[1]:
        cell.font = Font(bold=True)

    row = 2
    for doc in documents:
        for line in doc["lines"]:
            ws.append([
                doc["date"],
                doc["counterparty"],
                line["category"],
                line["qty"],
                line["price"],
                f"=D{row}*E{row}",  # сумма считается автоматически
                line["account"],
            ])
            row += 1

    for col, width in zip("ABCDEFG", (12, 24, 26, 10, 10, 12, 12)):
        ws.column_dimensions[col].width = width

    wb.save(path)
    return path
