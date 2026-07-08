// Стартовое состояние приложения. Демо-данных нет — очередь, отчёты и категории
// наполняются по мере работы (реальные данные приходят от съёмки/распознавания).

export const initialDocuments = []

export const initialCategories = []

export const aiSuggestion = null

// Колонки выгрузки — схема CSV и маппинг шаблона «шаблон_учёт».
export const EXPORT_COLUMNS = [
  { key: 'date', label: 'Дата', source: 'дата документа' },
  { key: 'counterparty', label: 'Контрагент', source: 'контрагент по справочнику' },
  { key: 'category', label: 'Номенклатура', source: 'категория строки' },
  { key: 'kind', label: 'Тип', source: 'приход/расход категории' },
  { key: 'qty', label: 'Кол-во', source: 'количество из документа' },
  { key: 'price', label: 'Цена', source: 'цена за единицу' },
  { key: 'sum', label: 'Сумма', source: 'кол-во × цена' },
]

export const initialTemplates = [
  {
    id: 'main',
    name: 'шаблон_учёт',
    isDefault: true,
    columns: EXPORT_COLUMNS.map((c) => ({ key: c.key, label: c.label })),
  },
]

// Роли пользователей. canEdit — правка данных; isAdmin — управление пользователями/настройками.
export const ROLES = {
  viewer: { id: 'viewer', label: 'Наблюдатель', hint: 'только просмотр', canEdit: false, isAdmin: false },
  editor: { id: 'editor', label: 'Редактор', hint: 'просмотр и редактирование', canEdit: true, isAdmin: false },
  admin: { id: 'admin', label: 'Администратор', hint: 'полный доступ и управление пользователями', canEdit: true, isAdmin: true },
}

export const ROLE_ORDER = ['viewer', 'editor', 'admin']
