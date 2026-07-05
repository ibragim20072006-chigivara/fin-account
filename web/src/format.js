const nf = new Intl.NumberFormat('ru-RU')

export const money = (n) => nf.format(n)
export const rub = (n) => `${nf.format(n)} ₽`
