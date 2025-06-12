import { DateTime } from 'luxon'
import CronExpressionParser from 'cron-parser'

export function generateCron(schedulation) {
    if (schedulation.refreshRate === 'custom') return schedulation.custom
    else {
        const minutes = schedulation.refreshTime.split(':')[1] ? schedulation.refreshTime.split(':')[1] : 0
        const hours = schedulation.refreshTime.split(':')[0] ? schedulation.refreshTime.split(':')[0] : 0
        const dayOfMonth = schedulation.refreshDay || '*'
        const month = schedulation.refreshMonth || '*'
        const dayOfWeek = schedulation.refreshDays.length > 0 ? schedulation.refreshDays.join(',') : '*'

        return `0 ${minutes} ${hours} ${dayOfMonth} ${month} ${dayOfWeek}`
    }
}

export function cronToI18nString(cronString) {
    try {
        const interval = CronExpressionParser.parse(cronString)
        const nextDate = DateTime.fromJSDate(interval.next().toDate()).setLocale(localStorage.getItem('locale')?.replace('_', '-') || 'en')

        return nextDate.toLocaleString(DateTime.DATETIME_FULL)
    } catch (err) {
        console.error('Errore nel parsing:', err)
        return null
    }
}

export function cronToNumber(cronString, property) {
    try {
        if (!cronString) return null
        const interval = CronExpressionParser.parse(cronString)
        const date = interval.next()

        if (property === 'time') return String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0')
        if (property === 'days') {
            const fields = cronString.split(' ')
            const weekDaysField = fields[4]
            if (!weekDaysField || weekDaysField === '*') return []
            const weekDaysMap = {
                '0': 'sun',
                '1': 'mon',
                '2': 'tue',
                '3': 'wed',
                '4': 'thu',
                '5': 'fri',
                '6': 'sat'
            }

            return weekDaysField.split(',').map((day) => weekDaysMap[day] || `Sconosciuto (${day})`)
        }
        if (property === 'day') return date.getDay()
        if (property === 'month') return date.getMonth() + 1
        return null
    } catch (err) {
        console.error("Errore nell'analisi della stringa cron:", err)
        return null
    }
}
