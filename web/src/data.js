// Стартовое состояние приложения. Демо-данных нет — очередь, отчёты и категории
// наполняются по мере работы (реальные данные приходят от съёмки/распознавания).

export const initialDocuments = []

export const initialCategories = []

export const aiSuggestion = null

// Фиксированный формат CSV-отчёта — столбцы строятся из введённых данных, без настройки.
export const EXPORT_COLUMNS = [
  { key: 'date', label: 'Дата' },
  { key: 'counterparty', label: 'Контрагент' },
  { key: 'category', label: 'Категория' },
  { key: 'kind', label: 'Тип' },
  { key: 'qty', label: 'Кол-во' },
  { key: 'price', label: 'Цена' },
  { key: 'sum', label: 'Сумма' },
]

// Роли пользователей. canEdit — правка данных; isAdmin — управление пользователями/настройками.
export const ROLES = {
  viewer: { id: 'viewer', label: 'Наблюдатель', hint: 'только просмотр', canEdit: false, isAdmin: false },
  editor: { id: 'editor', label: 'Редактор', hint: 'просмотр и редактирование', canEdit: true, isAdmin: false },
  admin: { id: 'admin', label: 'Администратор', hint: 'полный доступ и управление пользователями', canEdit: true, isAdmin: true },
}

export const ROLE_ORDER = ['viewer', 'editor', 'admin']
