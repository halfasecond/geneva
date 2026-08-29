import moment from 'moment'

const cooldowns = [
    'Fast', 'Swift', 'Swift', 'Snappy', 'Snappy', 'Brisk', 'Brisk',
    'Plodding', 'Plodding', 'Slow', 'Slow', 'Sluggish', 'Sluggish', 'Catatonic',
]

export const handleGetCoolDown = (num?: number) =>
    num === undefined ? '' : num > 13 ? 'Catatonic' : cooldowns[num]

export const handleGetBirthday = (date?: string) =>
    date ? moment.utc(date).format('Do MMMM YYYY') : ''

export const handleGetAbbrBirthday = (date?: string) =>
    date ? moment.utc(date).format('D.MM.YYYY') : ''
