export const getFormatDate = (date: Date) => {
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
}

export const dayMills = 1000 * 60 * 60 * 24

export const getDaysDifference = (date0: Date, date1: Date) => {
  return Math.round(Math.abs(date0.getTime() - date1.getTime()) / dayMills)
}