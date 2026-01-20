import moment from 'moment'
import { DateTime } from 'luxon'
import store from '@/App.store.js'

import formats from '@/helpers/commons/localeDateFormats.json'
import timezones from '@/helpers/commons/localeTimeZones.json'

export let fallbackLocale = 'en_US'

export function getLocale(js?: boolean): string {
    let locale = ''
    if (localStorage.getItem('locale')) locale = localStorage.getItem('locale') || ''
    else locale = store.locale ? store.local : fallbackLocale
    return js ? locale.replace('_', '-') : locale
}

export function formatDate(dateString?: string, format?: string, incomingFormat?: string) {
    let tmp = moment(dateString || new Date(), incomingFormat).locale(getLocale())

    if (format === 'toISOString') return tmp.toISOString()
    else return tmp.format(format || 'L')
}

export function formatDateLuxon(dateString: string, format: string, incomingFormat: string) {
    const baseLocale = getLocale()?.split('_')[0] ?? fallbackLocale
    const dt = DateTime.fromFormat(dateString, incomingFormat, { locale: baseLocale })

    if (!dt.isValid) {
        return null
    }

    return getFormattedDateTimeUsingToLocaleString(format, dt)
}

export const getFormattedDateTimeUsingToLocaleString = (format: string, dt: DateTime) => {
    switch (format) {
        case 'LT':
            return dt.toLocaleString(DateTime.TIME_SIMPLE)
        case 'LTS':
            return dt.toLocaleString(DateTime.TIME_WITH_SECONDS)
        case 'L':
            return dt.toLocaleString(DateTime.DATE_SHORT)
        case 'l':
            return dt.toLocaleString(DateTime.DATE_SHORT).replace(/^0+/, '')
        case 'LL':
            return dt.toLocaleString(DateTime.DATE_MED)
        case 'll':
            return dt.toLocaleString(DateTime.DATE_MED).replace(/(\w{3})/, (match) => match.toUpperCase())
        case 'LLL':
            return dt.toLocaleString(DateTime.DATETIME_MED)
        case 'lll':
            return dt.toLocaleString(DateTime.DATETIME_MED)
        case 'LLLL':
            return dt.toLocaleString(DateTime.DATETIME_FULL)
        case 'llll':
            return dt.toLocaleString(DateTime.DATETIME_FULL)
        default:
            return dt.toLocaleString(DateTime.DATE_SHORT)
    }
}

export function formatDateWithLocale(dateString?: string | number, format?: any, keepNull?: boolean): string {
    if (keepNull && !dateString) return ''
    let dateToFormat = new Date()
    if (dateString) {
        if (typeof dateString == 'string') {
            for (var key in timezones) dateString = dateString.replace(key, timezones[key])
        }
        dateToFormat = new Date(dateString)
    }

    return Intl.DateTimeFormat(getLocale(true), format).format(dateToFormat)
}

export function formatNumberWithLocale(number: number, precision?: number, format?: any) {
    const options: any = { useGrouping: true, ...format }
    if (precision != null) {
        options.minimumFractionDigits = precision
        options.maximumFractionDigits = precision
    }
    return Intl.NumberFormat(getLocale(true), options).format(number)
}

export function luxonFormatDate(dateString: any | Date, inputFormat?: string, outputFormat?: string) {
    let tempDate = inputFormat ? DateTime.fromFormat(dateString, inputFormat).setLocale(getLocale(true)) : DateTime.fromJSDate(dateString).setLocale(getLocale(true))
    if (!tempDate.isValid) tempDate = DateTime.fromFormat(dateString, 'dd/MM/yyyy')
    if (outputFormat) return tempDate.toFormat(outputFormat)
    else return tempDate.toLocaleString({ year: 'numeric', month: '2-digit', day: '2-digit' })
}

export function localeDate(locale?: any): String {
    let loc = locale
    if (!loc) loc = getLocale(true)
    return formats[loc].replaceAll('m', 'M')
}

export function primeVueDate(locale?: any): String {
    let loc = locale
    if (!loc) loc = getLocale(true)
    return convertToPrimeVueFormat(formats[loc])
}

export function convertToPrimeVueFormat(format: String) {
    return format.replaceAll('yy', 'y').replaceAll('M', 'm')
}

export function getJSDateFromDateString(dateString: string, inputFormat: string) {
    if (!dateString) return
    return DateTime.fromFormat(dateString, inputFormat).toJSDate()
}

export function getDateStringFromJSDate(date: Date, outputFormat: string) {
    if (!date) return
    return DateTime.fromJSDate(date).toFormat(outputFormat)
}

export function formatWithIntl(momentFormat, locale, date = new Date()) {
    const preformats = {
        L: { year: 'numeric', month: '2-digit', day: '2-digit' },
        LL: { year: 'numeric', month: 'long', day: 'numeric' },
        LLL: { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' },
        LLLL: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    }
    const tokenMap = {
        YYYY: () => date.getFullYear(),
        MMMM: () => new Intl.DateTimeFormat(locale, { month: 'long' }).format(date),
        MMM: () => new Intl.DateTimeFormat(locale, { month: 'short' }).format(date),
        MM: () => String(date.getMonth() + 1).padStart(2, '0'),
        dddd: () => new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(date),
        ddd: () => new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date),
        DD: () => String(date.getDate()).padStart(2, '0'),
        D: () => String(date.getDate()),
        HH: () => String(date.getHours()).padStart(2, '0'),
        hh: () => String(date.getHours() % 12 || 12).padStart(2, '0'),
        h: () => date.getHours() % 12 || 12,
        mm: () => String(date.getMinutes()).padStart(2, '0'),
        ss: () => String(date.getSeconds()).padStart(2, '0'),
        A: () => (date.getHours() >= 12 ? 'PM' : 'AM'),
        a: () => (date.getHours() >= 12 ? 'pm' : 'am')
    }
    if (preformats[momentFormat]) {
        return new Intl.DateTimeFormat(locale, preformats[momentFormat]).format(date)
    }
    const tokenRegex = new RegExp(Object.keys(tokenMap).join('|'), 'g')
    return momentFormat.replace(tokenRegex, (match) => {
        const formatter = tokenMap[match]
        return formatter ? formatter() : match
    })
}
