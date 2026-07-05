// Мок-данные по черновой модели состояния из дизайн-хэндоффа.

export const currentUser = { name: 'Мария Ковалёва', role: 'бухгалтер', initials: 'МК' }

// status: processing | review | ready | shipped
export const initialDocuments = [
  {
    id: 'd214',
    type: 'накладная',
    title: 'Накладная №214',
    counterparty: 'СтройБаза Юг',
    subtitle: 'СтройБаза Юг · реализация щебня',
    panelSubtitle: 'СтройБаза Юг · реализация · 14.06.2026 · сфотографировала Мария в 10:24',
    date: '14.06.2026',
    uploadedBy: 'Мария',
    uploadedAt: '10:24',
    status: 'review',
    photoLabel: 'фото: накладная №214',
    lines: [
      { id: 'l1', name: 'Щебень фр. 5–20', qty: '26,4 т', price: 850, sum: 22440, category: 'щебень 5–20' },
      { id: 'l2', name: 'Щебень фр. 20–40', qty: '18,0 т', price: 790, sum: 14220, category: 'щебень 20–40' },
      {
        id: 'l3', name: 'Отсев 0–5', qty: '12,2 т', qtyValue: 12.2,
        price: null, priceRaw: '4_0', sum: null, category: 'отсев 0–5',
        flag: 'price_unclear', candidates: [430, 480],
        photoRect: { left: '13%', right: '33%', top: '47%' },
      },
      { id: 'l4', name: 'Доставка самосвалом', qty: '2 рейса', price: 3200, sum: 6400, category: 'доставка' },
    ],
  },
  {
    id: 'dAkt31',
    type: 'акт',
    title: 'Акт БВР №31',
    counterparty: 'Взрывпром',
    subtitle: 'Взрывпром · буровзрывные работы',
    panelSubtitle: 'Взрывпром · буровзрывные работы · 12.06.2026 · сфотографировала Мария в 10:21',
    date: '12.06.2026',
    uploadedBy: 'Мария',
    uploadedAt: '10:21',
    status: 'ready',
    photoLabel: 'фото: акт БВР №31',
    lines: [
      { id: 'l1', name: 'Бурение скважин ⌀110', qty: '380 п.м', price: 310, sum: 117800, category: 'БВР (подрядчик)' },
      { id: 'l2', name: 'Граммонит 79/21', qty: '2,4 т', price: 88000, sum: 211200, category: 'БВР (подрядчик)' },
      { id: 'l3', name: 'Эмульсионное ВВ', qty: '1,1 т', price: 96000, sum: 105600, category: 'БВР (подрядчик)' },
      { id: 'l4', name: 'Средства инициирования', qty: '164 шт', price: 420, sum: 68880, category: 'БВР (подрядчик)' },
      { id: 'l5', name: 'Монтаж взрывной сети', qty: '1 усл.', price: 74000, sum: 74000, category: 'БВР (подрядчик)' },
      { id: 'l6', name: 'Работа взрывника', qty: '16 ч', price: 2600, sum: 41600, category: 'БВР (подрядчик)' },
      { id: 'l7', name: 'Маркшейдерская съёмка', qty: '1 усл.', price: 28000, sum: 28000, category: 'БВР (подрядчик)' },
    ],
  },
  {
    id: 'dChekAzs',
    type: 'чек',
    title: 'Чек АЗС',
    counterparty: 'АЗС «Лукойл»',
    subtitle: 'дизтопливо, 640 л',
    panelSubtitle: 'АЗС «Лукойл» · 11.06.2026 · сфотографировал Игорь в 09:58',
    date: '11.06.2026',
    uploadedBy: 'Игорь',
    uploadedAt: '09:58',
    status: 'ready',
    photoLabel: 'фото: чек АЗС',
    lines: [
      { id: 'l1', name: 'ДТ ЕВРО, сорт C', qty: '640 л', price: 65, sum: 41600, category: 'ГСМ и топливо' },
    ],
  },
  {
    id: 'dVed6',
    type: 'ведомость',
    title: 'Ведомость веса №6',
    counterparty: 'дробильный цех',
    subtitle: 'дробильный цех · июнь',
    panelSubtitle: 'дробильный цех · июнь · сфотографировал Игорь в 09:41',
    date: '11.06.2026',
    uploadedBy: 'Игорь',
    uploadedAt: '09:41',
    status: 'processing',
    photoLabel: 'фото: ведомость веса №6',
    lines: [],
  },
  {
    id: 'd209',
    type: 'накладная',
    title: 'Накладная №209',
    counterparty: 'СтройБаза Юг',
    subtitle: 'СтройБаза Юг · реализация щебня',
    panelSubtitle: 'СтройБаза Юг · реализация · 10.06.2026 · отгружено вчера',
    date: '10.06.2026',
    uploadedBy: 'Мария',
    uploadedAt: 'вчера',
    metaOverride: 'вчера · 9 строк',
    status: 'shipped',
    photoLabel: 'фото: накладная №209',
    lines: [
      { id: 'l1', name: 'Щебень фр. 5–20', qty: '31,2 т', price: 850, sum: 26520, category: 'щебень 5–20' },
      { id: 'l2', name: 'Щебень фр. 20–40', qty: '24,0 т', price: 790, sum: 18960, category: 'щебень 20–40' },
      { id: 'l3', name: 'Щебень фр. 40–70', qty: '12,5 т', price: 740, sum: 9250, category: 'щебень 20–40' },
      { id: 'l4', name: 'Отсев 0–5', qty: '9,8 т', price: 430, sum: 4214, category: 'отсев 0–5' },
      { id: 'l5', name: 'Песок карьерный', qty: '14,0 т', price: 380, sum: 5320, category: 'прочее' },
      { id: 'l6', name: 'Доставка самосвалом', qty: '3 рейса', price: 3200, sum: 9600, category: 'доставка' },
      { id: 'l7', name: 'Доставка (длинное плечо)', qty: '1 рейс', price: 5400, sum: 5400, category: 'доставка' },
      { id: 'l8', name: 'Погрузка фронтальная', qty: '2 ч', price: 1800, sum: 3600, category: 'прочее' },
      { id: 'l9', name: 'Взвешивание', qty: '4 шт', price: 200, sum: 800, category: 'прочее' },
    ],
  },
  {
    id: 'dEnergo',
    type: 'счёт',
    title: 'Счёт «Энергосбыт»',
    counterparty: 'Энергосбыт',
    subtitle: 'электроэнергия · май',
    panelSubtitle: 'Энергосбыт · электроэнергия за май · отгружено вчера',
    date: '09.06.2026',
    uploadedBy: 'Мария',
    uploadedAt: 'вчера',
    metaOverride: 'вчера · 1 строка',
    status: 'shipped',
    photoLabel: 'фото: счёт «Энергосбыт»',
    lines: [
      { id: 'l1', name: 'Электроэнергия, 48 620 кВт·ч', qty: '1 усл.', price: 410000, sum: 410000, category: 'электроэнергия' },
    ],
  },
]

export const initialCategories = [
  { id: 'crush520', kind: 'income', name: 'Щебень 5–20', account: '90.01', linesMonth: 46, sumMonth: 3640000, keywords: ['щебень 5-20', 'щебень фр. 5–20', 'фракция 5-20'], threshold: 90, matches: [{ text: '«Щебень фр. 5–20, 26,4 т»', doc: 'накладная №214', pct: 98 }, { text: '«щебень гранитный 5-20»', doc: 'накладная №209', pct: 97 }] },
  { id: 'crush2040', kind: 'income', name: 'Щебень 20–40', account: '90.01', linesMonth: 31, sumMonth: 2470000, keywords: ['щебень 20-40', 'фракция 20-40', 'щебень фр. 40–70'], threshold: 90, matches: [{ text: '«Щебень фр. 20–40, 18,0 т»', doc: 'накладная №214', pct: 98 }] },
  { id: 'siftings', kind: 'income', name: 'Отсев 0–5', account: '90.01', linesMonth: 18, sumMonth: 980000, keywords: ['отсев', 'отсев 0-5', 'отсев дробления'], threshold: 90, matches: [{ text: '«Отсев 0–5, 12,2 т»', doc: 'накладная №214', pct: 95 }] },
  { id: 'delivery', kind: 'income', name: 'Доставка', account: '90.01', linesMonth: 24, sumMonth: 1240000, keywords: ['доставка', 'самосвал', 'рейс', 'перевозка'], threshold: 90, matches: [{ text: '«Доставка самосвалом, 2 рейса»', doc: 'накладная №214', pct: 99 }] },
  {
    id: 'fuel', kind: 'expense', name: 'ГСМ и топливо', account: '10.03', linesMonth: 29, sumMonth: 1820000,
    keywords: ['дизтопливо', 'ДТ', 'солярка', 'АЗС', 'бензин', 'заправка'], threshold: 90,
    matches: [
      { text: '«ДТ ЕВРО, сорт C, 640 л»', doc: 'чек АЗС', pct: 98 },
      { text: '«солярка, налив, 12 т»', doc: 'накладная №198', pct: 96 },
      { text: '«топливо печное бытовое»', doc: 'чек АЗС', pct: 71, review: true },
    ],
  },
  { id: 'fot', kind: 'expense', name: 'ФОТ', account: '70', linesMonth: 12, sumMonth: 1640000, keywords: ['зарплата', 'аванс', 'оклад', 'ведомость'], threshold: 90, matches: [{ text: '«зарплата за июнь, 1-я часть»', doc: 'ведомость', pct: 99 }] },
  { id: 'bvr', kind: 'expense', name: 'БВР (подрядчик)', account: '60.01', linesMonth: 4, sumMonth: 940000, keywords: ['БВР', 'взрывные работы', 'бурение', 'Взрывпром'], threshold: 90, matches: [{ text: '«буровзрывные работы, блок 14»', doc: 'акт БВР №31', pct: 98 }] },
  { id: 'parts', kind: 'expense', name: 'Запчасти и ремонт', account: '10.05', linesMonth: 21, sumMonth: 720000, keywords: ['запчасть', 'ремонт', 'фильтр', 'гидравлика', 'подшипник'], threshold: 90, matches: [{ text: '«фильтр масляный CAT 320»', doc: 'чек', pct: 97 }, { text: '«рукав высокого давления»', doc: 'накладная', pct: 88, review: true }] },
  { id: 'taxes', kind: 'expense', name: 'НДПИ и налоги', account: '68', linesMonth: 6, sumMonth: 646000, keywords: ['НДПИ', 'налог', 'взносы', 'пени'], threshold: 90, matches: [{ text: '«НДПИ за май 2026»', doc: 'платёжка', pct: 99 }] },
  { id: 'power', kind: 'expense', name: 'Электроэнергия', account: '60.01', linesMonth: 3, sumMonth: 410000, keywords: ['электроэнергия', 'кВт', 'Энергосбыт'], threshold: 90, matches: [{ text: '«электроэнергия, 48 620 кВт·ч»', doc: 'счёт «Энергосбыт»', pct: 99 }] },
  { id: 'misc', kind: 'expense', name: 'Прочее', account: '91.02', linesMonth: 9, sumMonth: 310000, keywords: ['канцелярия', 'услуги', 'прочее'], threshold: 80, matches: [{ text: '«вода питьевая 19 л»', doc: 'чек', pct: 82 }] },
]

export const aiSuggestion = {
  name: 'Аренда техники',
  reason: '3 строки за июнь не подошли ни под одно правило',
  lines: [
    { text: '«аренда экскаватора Hitachi ZX330, 40 м/ч»', doc: 'акт №77', sum: 480000 },
    { text: '«аренда бульдозера Б10М, смена»', doc: 'акт №81', sum: 340000 },
    { text: '«услуги автокрана 25 т, 8 ч»', doc: 'счёт №19-А', sum: 180000 },
  ],
}

export const initialTemplates = [
  {
    id: 'main', name: 'шаблон_учёт.xlsx', badge: 'основной', meta: '7 колонок · для 1С:Бухгалтерии',
    description: 'каждая отгрузка формирует строки в этом формате',
    mapping: [
      ['A · Дата', 'дата документа'],
      ['B · Контрагент', 'контрагент по справочнику'],
      ['C · Номенклатура', 'категория строки'],
      ['D · Кол-во', 'количество из документа'],
      ['E · Цена', 'цена без НДС'],
      ['F · Сумма', 'кол-во × цена, считается автоматически'],
      ['G · Счёт учёта', 'счёт категории (настроен в категориях)'],
    ],
    example: '14.06.2026 → СтройБаза Юг → Щебень фр. 5–20 → 26,4 → 850 → 22 440 → 90.01',
    footer: 'последняя выгрузка по шаблону — сегодня в 10:24 · 132 строки за июнь',
  },
  {
    id: 'kassa', name: 'касса.csv', badge: null, meta: '4 колонки · для кассовой книги',
    description: 'наличные операции для кассовой книги',
    mapping: [
      ['A · Дата', 'дата документа'],
      ['B · Операция', 'приход или расход'],
      ['C · Сумма', 'сумма по документу'],
      ['D · Основание', 'название документа и контрагент'],
    ],
    example: '11.06.2026 → расход → 41 600 → чек АЗС «Лукойл»',
    footer: 'последняя выгрузка по шаблону — 28.05.2026 · 12 строк за май',
  },
  {
    id: 'legacy', name: 'старый_формат.xls', badge: 'архив', meta: 'не используется с марта', archived: true,
    description: 'архивный формат — оставлен для истории выгрузок',
    mapping: [
      ['A · Дата', 'дата документа'],
      ['B · Наименование', 'название строки как в документе'],
      ['C · Сумма', 'сумма строки'],
    ],
    example: '02.03.2026 → щебень фр. 5-20 → 22 440',
    footer: 'последняя выгрузка по шаблону — 04.03.2026',
  },
]

export const team = [
  { initials: 'МК', name: 'Мария Ковалёва', role: 'бухгалтер', rights: 'проверка, отгрузка, отчёты' },
  { initials: 'ИС', name: 'Игорь Санин', role: 'мастер участка', rights: 'только съёмка документов' },
  { initials: 'ПК', name: 'Пётр Ковалёв', role: 'директор', rights: 'только отчёты' },
]

export const initialNotifications = [
  { id: 'review', label: 'документ требует проверки', on: true },
  { id: 'report', label: 'отчёт за месяц готов', on: true },
  { id: 'shipped', label: 'документ отгружен в учёт', on: false },
]

// ---------- Отчёты ----------

const drilldownFuel = {
  docs: [
    { date: '03.06', name: 'Чек АЗС · 640 л ДТ', who: 'Игорь', sum: 41600, queueId: 'dChekAzs' },
    { date: '05.06', name: 'Накладная №198 · ДТ оптом, 12 т', who: 'Мария', sum: 612000 },
    { date: '09.06', name: 'Чек АЗС · 512 л ДТ', who: 'Игорь', sum: 33280 },
    { date: '14.06', name: 'Накладная №203 · ДТ оптом, 14 т', who: 'Мария', sum: 714000 },
    { date: '18.06', name: 'Ведомость заправок · дробильный цех', who: 'Игорь', sum: 248120 },
    { date: '21.06', name: 'Чек АЗС · 640 л ДТ', who: 'Игорь', sum: 41600 },
  ],
  hidden: [
    { date: '24.06', name: 'Чек АЗС · 512 л ДТ', who: 'Игорь', sum: 33280 },
    { date: '27.06', name: 'Чек АЗС · 640 л ДТ', who: 'Игорь', sum: 41600 },
    { date: '30.06', name: 'Ведомость заправок · карьер', who: 'Игорь', sum: 54520 },
  ],
}

export const reports = {
  '2026-06': {
    label: 'Июнь 2026',
    opu: {
      revenue: 8420000,
      revenueDelta: '+9% к маю',
      profit: 1934000,
      profitNote: 'маржа 23% · +2 п.п. к маю',
      revenueBars: [
        { m: 'янв', h: 61 }, { m: 'фев', h: 69 }, { m: 'мар', h: 76 },
        { m: 'апр', h: 82 }, { m: 'май', h: 91 }, { m: 'июн', h: 100, current: true, label: '8,42 млн' },
      ],
      expensesTotal: 6486000,
      expenses: [
        { id: 'fuel', name: 'ГСМ и топливо', sum: 1820000, pct: 28, color: 'var(--chart-1)', docsCount: 9, drill: drilldownFuel },
        { id: 'fot', name: 'ФОТ', sum: 1640000, pct: 25, color: 'var(--chart-2)', docsCount: 3, drill: { docs: [
          { date: '10.06', name: 'Ведомость · аванс за июнь', who: 'Мария', sum: 620000 },
          { date: '25.06', name: 'Ведомость · зарплата за май', who: 'Мария', sum: 890000 },
          { date: '25.06', name: 'Платёжка · НДФЛ удержанный', who: 'Мария', sum: 130000 },
        ] } },
        { id: 'bvr', name: 'БВР (подрядчик)', sum: 940000, pct: 15, color: 'var(--chart-3)', docsCount: 2, drill: { docs: [
          { date: '12.06', name: 'Акт БВР №31 · блок 14', who: 'Мария', sum: 647080, queueId: 'dAkt31' },
          { date: '26.06', name: 'Акт БВР №33 · блок 15', who: 'Мария', sum: 292920 },
        ] } },
        { id: 'parts', name: 'Запчасти и ремонт', sum: 720000, pct: 11, color: 'var(--chart-5)', docsCount: 8, drill: { docs: [
          { date: '04.06', name: 'Накладная · фильтры и масла CAT', who: 'Игорь', sum: 214000 },
          { date: '13.06', name: 'Чек · РВД и фитинги', who: 'Игорь', sum: 96000 },
          { date: '19.06', name: 'Накладная · футеровка дробилки', who: 'Мария', sum: 410000 },
        ] } },
        { id: 'taxes', name: 'НДПИ и налоги', sum: 646000, pct: 10, color: 'var(--chart-g1)', docsCount: 3, drill: { docs: [
          { date: '20.06', name: 'Платёжка · НДПИ за май', who: 'Мария', sum: 412000 },
          { date: '20.06', name: 'Платёжка · страховые взносы', who: 'Мария', sum: 234000 },
        ] } },
        { id: 'power', name: 'Электроэнергия', sum: 410000, pct: 6, color: 'var(--chart-g2)', docsCount: 1, drill: { docs: [
          { date: '09.06', name: 'Счёт «Энергосбыт» · май', who: 'Мария', sum: 410000, queueId: 'dEnergo' },
        ] } },
        { id: 'misc', name: 'Прочее', sum: 310000, pct: 5, color: 'var(--chart-g3)', docsCount: 6, drill: { docs: [
          { date: '06.06', name: 'Чек · вода, хозтовары', who: 'Игорь', sum: 34000 },
          { date: '16.06', name: 'Счёт · связь и интернет', who: 'Мария', sum: 48000 },
          { date: '23.06', name: 'Акт · обслуживание весов', who: 'Мария', sum: 228000 },
        ] } },
      ],
      footer: 'отчёт собран из 14 загрузок за июнь · последняя — сегодня в 10:24',
    },
    dds: {
      inflow: 9130000, inflowDelta: '+12% к маю',
      outflow: 7480000, outflowNote: '72 платежа',
      balance: 3615000, balanceDate: '30.06', balanceDelta: '+1 650 000 за месяц',
      receipts: [
        { name: 'Щебень 5–20', sum: 3640000, pct: 40, color: 'var(--chart-1)' },
        { name: 'Щебень 20–40', sum: 2470000, pct: 27, color: 'var(--chart-2)' },
        { name: 'Доставка', sum: 1240000, pct: 14, color: 'var(--chart-3)' },
        { name: 'Отсев 0–5', sum: 980000, pct: 11, color: 'var(--chart-5)' },
        { name: 'Авансы покупателей', sum: 800000, pct: 8, color: 'var(--chart-g3)' },
      ],
      payments: [
        { name: 'ГСМ и топливо', sum: 1820000, pct: 24, color: 'var(--chart-1)' },
        { name: 'ФОТ', sum: 1640000, pct: 22, color: 'var(--chart-2)' },
        { name: 'Аренда техники', sum: 1000000, pct: 13, color: 'var(--chart-3)' },
        { name: 'БВР (подрядчик)', sum: 940000, pct: 13, color: 'var(--chart-4)' },
        { name: 'Запчасти и ремонт', sum: 720000, pct: 10, color: 'var(--chart-5)' },
        { name: 'НДПИ и налоги', sum: 646000, pct: 9, color: 'var(--chart-g1)' },
        { name: 'Электроэнергия', sum: 410000, pct: 5, color: 'var(--chart-g2)' },
        { name: 'Прочее', sum: 304000, pct: 4, color: 'var(--chart-g3)' },
      ],
      accounts: [
        { name: 'Расчётный (Сбер)', sum: 2840000 },
        { name: 'Расчётный (Альфа)', sum: 660000 },
        { name: 'Касса', sum: 115000 },
      ],
      monthStart: 1965000,
    },
  },
  '2026-05': {
    label: 'Май 2026',
    opu: {
      revenue: 7730000,
      revenueDelta: '+11% к апрелю',
      profit: 1623000,
      profitNote: 'маржа 21% · +1 п.п. к апрелю',
      revenueBars: [
        { m: 'дек', h: 58 }, { m: 'янв', h: 67 }, { m: 'фев', h: 76 },
        { m: 'мар', h: 84 }, { m: 'апр', h: 90 }, { m: 'май', h: 100, current: true, label: '7,73 млн' },
      ],
      expensesTotal: 6107000,
      expenses: [
        { id: 'fuel', name: 'ГСМ и топливо', sum: 1746000, pct: 29, color: 'var(--chart-1)', docsCount: 8, drill: { docs: [
          { date: '07.05', name: 'Накладная №176 · ДТ оптом, 13 т', who: 'Мария', sum: 663000 },
          { date: '15.05', name: 'Накладная №184 · ДТ оптом, 14 т', who: 'Мария', sum: 714000 },
          { date: '22.05', name: 'Ведомость заправок · дробильный цех', who: 'Игорь', sum: 369000 },
        ] } },
        { id: 'fot', name: 'ФОТ', sum: 1596000, pct: 26, color: 'var(--chart-2)', docsCount: 3, drill: { docs: [
          { date: '10.05', name: 'Ведомость · аванс за май', who: 'Мария', sum: 600000 },
          { date: '25.05', name: 'Ведомость · зарплата за апрель', who: 'Мария', sum: 996000 },
        ] } },
        { id: 'bvr', name: 'БВР (подрядчик)', sum: 880000, pct: 14, color: 'var(--chart-3)', docsCount: 2, drill: { docs: [
          { date: '14.05', name: 'Акт БВР №28 · блок 12', who: 'Мария', sum: 880000 },
        ] } },
        { id: 'parts', name: 'Запчасти и ремонт', sum: 671000, pct: 11, color: 'var(--chart-5)', docsCount: 7, drill: { docs: [
          { date: '05.05', name: 'Накладная · конвейерная лента', who: 'Мария', sum: 388000 },
          { date: '19.05', name: 'Чек · метизы, сварочные', who: 'Игорь', sum: 283000 },
        ] } },
        { id: 'taxes', name: 'НДПИ и налоги', sum: 611000, pct: 10, color: 'var(--chart-g1)', docsCount: 3, drill: { docs: [
          { date: '20.05', name: 'Платёжка · НДПИ за апрель', who: 'Мария', sum: 611000 },
        ] } },
        { id: 'power', name: 'Электроэнергия', sum: 366000, pct: 6, color: 'var(--chart-g2)', docsCount: 1, drill: { docs: [
          { date: '08.05', name: 'Счёт «Энергосбыт» · апрель', who: 'Мария', sum: 366000 },
        ] } },
        { id: 'misc', name: 'Прочее', sum: 237000, pct: 4, color: 'var(--chart-g3)', docsCount: 5, drill: { docs: [
          { date: '12.05', name: 'Счёт · связь и интернет', who: 'Мария', sum: 48000 },
          { date: '27.05', name: 'Чек · спецодежда', who: 'Игорь', sum: 189000 },
        ] } },
      ],
      footer: 'отчёт собран из 12 загрузок за май · последняя — 31.05 в 18:02',
    },
    dds: {
      inflow: 8150000, inflowDelta: '+6% к апрелю',
      outflow: 7010000, outflowNote: '65 платежей',
      balance: 1965000, balanceDate: '31.05', balanceDelta: '+1 140 000 за месяц',
      receipts: [
        { name: 'Щебень 5–20', sum: 3230000, pct: 40, color: 'var(--chart-1)' },
        { name: 'Щебень 20–40', sum: 2200000, pct: 27, color: 'var(--chart-2)' },
        { name: 'Доставка', sum: 1130000, pct: 14, color: 'var(--chart-3)' },
        { name: 'Отсев 0–5', sum: 890000, pct: 11, color: 'var(--chart-5)' },
        { name: 'Авансы покупателей', sum: 700000, pct: 8, color: 'var(--chart-g3)' },
      ],
      payments: [
        { name: 'ГСМ и топливо', sum: 1746000, pct: 25, color: 'var(--chart-1)' },
        { name: 'ФОТ', sum: 1596000, pct: 23, color: 'var(--chart-2)' },
        { name: 'Аренда техники', sum: 860000, pct: 12, color: 'var(--chart-3)' },
        { name: 'БВР (подрядчик)', sum: 880000, pct: 13, color: 'var(--chart-4)' },
        { name: 'Запчасти и ремонт', sum: 671000, pct: 10, color: 'var(--chart-5)' },
        { name: 'НДПИ и налоги', sum: 611000, pct: 9, color: 'var(--chart-g1)' },
        { name: 'Электроэнергия', sum: 366000, pct: 5, color: 'var(--chart-g2)' },
        { name: 'Прочее', sum: 280000, pct: 3, color: 'var(--chart-g3)' },
      ],
      accounts: [
        { name: 'Расчётный (Сбер)', sum: 1420000 },
        { name: 'Расчётный (Альфа)', sum: 460000 },
        { name: 'Касса', sum: 85000 },
      ],
      monthStart: 825000,
    },
  },
}

export const monthOrder = ['2026-05', '2026-06']
