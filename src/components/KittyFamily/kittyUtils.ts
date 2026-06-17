import moment from 'moment'

export const COOLDOWNS = [
    'Fast', 'Swift', 'Swift', 'Snappy', 'Snappy', 'Brisk', 'Brisk',
    'Plodding', 'Plodding', 'Slow', 'Slow', 'Sluggish', 'Sluggish', 'Catatonic',
] as const

export const getCooldown = (index = 0) => COOLDOWNS[index] ?? COOLDOWNS[0]

export const getBirthday = (date?: string) =>
    date ? moment.utc(date).format('Do MMMM YYYY') : ''

export const getAbbrBirthday = (date?: string) =>
    date ? moment.utc(date).format('D.MM.YYYY') : ''

export const isTinyBoxCattribute = (kitty: { g36?: number }) => kitty.g36 === 19