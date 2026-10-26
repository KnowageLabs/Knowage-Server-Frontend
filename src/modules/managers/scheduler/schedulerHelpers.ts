import deepcopy from 'deepcopy'
import { CronUnit, iJobInfo, iTrigger, iTriggerDocument, iTriggerDraft, OutputKind } from './Scheduler'

export type Translate = (key: string, named?: Record<string, unknown>, plural?: number) => string

export interface iValidationContext {
    jobInfo?: iJobInfo | null
}

export interface iTriggerError {
    key: string
    params?: Record<string, unknown>
}

export interface iDocumentState {
    valid: boolean
    noOutput: boolean
    isTalend: boolean
    enabledKinds: OutputKind[]
    errors: Record<OutputKind, string[]>
    inheritedFrom: iTriggerDocument | null
}

export const OUTPUT_KINDS: OutputKind[] = ['snapshot', 'file', 'document', 'mail']
export const OUTPUT_FLAGS: Record<OutputKind, 'saveassnapshot' | 'saveasfile' | 'saveasdocument' | 'sendmail'> = { snapshot: 'saveassnapshot', file: 'saveasfile', document: 'saveasdocument', mail: 'sendmail' }
export const OUTPUT_ICONS: Record<OutputKind, string> = { snapshot: 'camera', file: 'edit_document', document: 'save_as', mail: 'mail' }
export const OUTPUT_LABELS: Record<OutputKind, string> = { snapshot: 'managers.scheduler.saveAsSnapshot', file: 'managers.scheduler.saveAsFile', document: 'managers.scheduler.saveAsDocument', mail: 'managers.scheduler.sendMail' }
export const CRON_UNITS: CronUnit[] = ['minute', 'hour', 'day', 'week', 'month']
export const TALEND_ENGINE = 'knowagetalendengine'

export function isCronUnit(type: string | undefined): type is CronUnit {
    return CRON_UNITS.includes(type as CronUnit)
}

export function isRecurring(trigger: { chrono?: { type: string } }): boolean {
    const type = trigger.chrono?.type
    return type === 'scheduler' || isCronUnit(type)
}

// Port of updateCondensedParameters of the old documents table
export function condensedParameters(parameters: any[]) {
    let condensed = ''
    for (let i = 0; i < parameters.length; i++) {
        if (parameters[i].type === 'fixed') {
            condensed += ' ' + parameters[i].name + ' = ' + (parameters[i].description || parameters[i].value)
            condensed += i === parameters.length - 1 ? ' ' : ' | '
        }
    }
    return condensed
}

export function createNewTriggerDraft(jobName: string, jobGroup: string, jobDocuments: iTriggerDocument[] | undefined): iTriggerDraft {
    return { jobName, jobGroup, chrono: { type: 'single', parameter: {} }, documents: deepcopy(jobDocuments ?? []) } as iTriggerDraft
}

// Port of the old timing tab loadTrigger, setTriggerDates and setCronFrequency, plus the KnCron load
export function initTriggerTiming(trigger: iTriggerDraft): iTriggerDraft {
    trigger.triggerDescription = trigger.triggerName
    setTriggerDates(trigger)
    if (isRecurring(trigger)) setCronFrequency(trigger)
    if (trigger.chrono.parameter?.dataset) trigger.chrono.parameter.dataset = +trigger.chrono.parameter.dataset
    return trigger
}

export function setTriggerDates(trigger: iTriggerDraft) {
    trigger.startDateTiming = trigger.zonedStartTime ? new Date(trigger.zonedStartTime) : new Date()
    trigger.startTimeTiming = trigger.zonedStartTime ? new Date(trigger.zonedStartTime) : new Date()
    trigger.startDateTiming.setHours(0)
    trigger.startDateTiming.setMinutes(0)
    trigger.startDateTiming.setSeconds(0)
    trigger.startDateTiming.setMilliseconds(0)

    if (!trigger.zonedStartTime) trigger.zonedStartTime = trigger.startTimeTiming

    trigger.endDateTiming = trigger.zonedEndTime ? new Date(trigger.zonedEndTime) : null
    trigger.endTimeTiming = trigger.zonedEndTime ? new Date(trigger.zonedEndTime) : null
    if (trigger.endTimeTiming && trigger.endDateTiming) {
        trigger.endDateTiming.setHours(0)
        trigger.endDateTiming.setMinutes(0)
    }

    if (!trigger.zonedEndTime) trigger.zonedEndTime = trigger.endTimeTiming
}

// KnCron clears startTime and endTime when it loads the frequency
export function setCronFrequency(trigger: iTriggerDraft) {
    const startDate = trigger.zonedStartTime ? new Date(trigger.zonedStartTime) : new Date()
    const endDate = trigger.zonedEndTime ? new Date(trigger.zonedEndTime) : null
    trigger.frequency = { cron: trigger.chrono, startDate: startDate.valueOf(), startTime: '', endDate: endDate ? endDate.valueOf() : null, endTime: '' }
}

// Port of formatFrequency of the old timing tab
export function changeTriggerType(trigger: iTriggerDraft, type: 'single' | 'scheduler' | 'event') {
    trigger.chrono = { type, parameter: { type: '' } }
    if (type === 'single') {
        delete trigger.endDateTiming
        delete trigger.endTimeTiming
    } else if (type === 'scheduler') {
        setCronFrequency(trigger)
    }
}

export function applyOutputDefaults(document: iTriggerDocument, kind: OutputKind) {
    switch (kind) {
        case 'file':
            if (typeof document.zipFileDocument === 'undefined') document.zipFileDocument = false
            break
        case 'document':
            if (typeof document.useFixedFolder === 'undefined') document.useFixedFolder = false
            break
        case 'mail':
            if (!document.useFixedRecipients && !document.useExpression && !document.useDataset) {
                document.useFixedRecipients = false
                document.useExpression = false
                document.useDataset = false
            }
            if (typeof document.uniqueMail === 'undefined') document.uniqueMail = false
            if (typeof document.zipMailDocument === 'undefined') document.zipMailDocument = false
            if (typeof document.reportNameInSubject === 'undefined') document.reportNameInSubject = false
            if (!document.mailtxt) document.mailtxt = ''
            document.mailtxt = document.mailtxt.replaceAll('&lt;', '<').replaceAll('&gt;', '>')
    }
}

// The defaults that the old document detail and the accordions wrote on mount
export function normalizeTriggerDocuments(trigger: iTriggerDraft) {
    trigger.documents?.forEach((document: iTriggerDocument, index: number) => {
        if (!document.labelId) document.labelId = document.id + '__' + (index + 1)
        if (!document.outputType) document.outputType = 'PDF'
        if (document.saveassnapshot == undefined) document.saveassnapshot = false
        if (document.saveasfile == undefined) document.saveasfile = false
        if (document.saveasdocument == undefined) document.saveasdocument = false
        if (document.sendtojavaclass == undefined) document.sendtojavaclass = false
        if (document.sendmail == undefined) document.sendmail = false
        delete document.invalid
        OUTPUT_KINDS.forEach((kind: OutputKind) => {
            if (document[OUTPUT_FLAGS[kind]]) applyOutputDefaults(document, kind)
        })
    })
}

function escapeHtml(text: string) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
}

// Port of formatTrigger of the old dialog; it works on a copy so the draft does not change
export function formatTrigger(trigger: iTriggerDraft): any {
    const source = deepcopy(trigger) as any
    const formattedTrigger = {
        ...source,
        documents: source.documents.map((el: any) => {
            return { ...el }
        })
    }

    formattedTrigger.documents.forEach((d: any) => {
        if (d.mailtxt) d.mailtxt = escapeHtml(d.mailtxt)
    })

    if (source.frequency) {
        formattedTrigger.frequency = { ...source.frequency, cron: { ...source.frequency.cron, parameter: { type: source.frequency.cron.type, parameter: { ...source.frequency.cron.parameter } } } }
    }

    if (!formattedTrigger.triggerGroup) formattedTrigger.triggerGroup = ''
    formattedTrigger._endTime = new Date().getHours() + ':' + new Date().getMinutes()

    if (formattedTrigger.chrono.type === 'single') {
        delete formattedTrigger.chrono.parameter
    } else if (formattedTrigger.chrono.type !== 'event') {
        formatCron(formattedTrigger, source)
    }

    if (!formattedTrigger.endDateTiming || !formattedTrigger.zonedEndTime) {
        delete formattedTrigger.zonedEndTime
    }

    deleteTriggerProps(formattedTrigger)
    formatTriggerDocuments(formattedTrigger)
    formattedTrigger.documents.forEach((d: any) => delete d.invalid)

    return formattedTrigger
}

function deleteTriggerProps(formattedTrigger: any) {
    const props = ['startDateTiming', 'startTimeTiming', 'endDateTiming', 'endTimeTiming', 'startDate', 'startTime', 'startDateRFC3339', 'endDate', 'endTime']
    props.forEach((property: string) => delete formattedTrigger[property])
}

function formatCron(formattedTrigger: any, source: any) {
    formattedTrigger.chrono = source.frequency.cron

    formattedTrigger.zonedStartTime = new Date(source.frequency.startDate)

    if (formattedTrigger.frequency.endDate) {
        formattedTrigger.zonedEndTime = new Date(source.frequency.endDate)
        formattedTrigger.endDateTiming = formattedTrigger.zonedEndTime
    } else {
        formattedTrigger.zonedEndtime = null
        formattedTrigger.endDateTiming = null
    }
}

function formatTriggerDocuments(formattedTrigger: any) {
    formattedTrigger.documents.forEach((el: any, index: number) => {
        el.label = el.name
        el.labelId = el.labelId ?? el.id + '__' + (index + 1)
    })
}

export function getTriggerSnapshot(trigger: iTriggerDraft): string {
    const formattedTrigger = formatTrigger(trigger)
    delete formattedTrigger._endTime
    return JSON.stringify(formattedTrigger)
}

export function getJobDocument(document: iTriggerDocument, jobInfo?: iJobInfo | null): iTriggerDocument | null {
    const jobDocuments = jobInfo?.documents ?? []
    const index = Number(String(document.labelId ?? '').split('__')[1])
    const byIndex = index ? jobDocuments[index - 1] : null
    if (byIndex && String(byIndex.id) === String(document.id)) return byIndex
    return jobDocuments.find((jobDocument: iTriggerDocument) => jobDocument.label === document.label) ?? null
}

export function isTalendDocument(document: iTriggerDocument, jobInfo?: iJobInfo | null): boolean {
    return (document.engine ?? getJobDocument(document, jobInfo)?.engine) === TALEND_ENGINE
}

export function getUniqueMailDocument(trigger: { documents?: iTriggerDocument[] | null }): iTriggerDocument | null {
    return trigger.documents?.find((document: iTriggerDocument) => document.sendmail && document.uniqueMail) ?? null
}

export function getMailSource(trigger: { documents?: iTriggerDocument[] | null }, document: iTriggerDocument): iTriggerDocument | null {
    const uniqueMailDocument = getUniqueMailDocument(trigger)
    return document.sendmail && uniqueMailDocument && uniqueMailDocument.labelId !== document.labelId ? uniqueMailDocument : null
}

// Port of setMailOptionsFromDocumentWithUniqueMail
export function copyMailSettings(from: iTriggerDocument, to: iTriggerDocument) {
    to.useFixedRecipients = from.useFixedRecipients
    to.mailtos = from.mailtos
    to.useDataset = from.useDataset
    if (from.datasetLabel !== undefined) to.datasetLabel = from.datasetLabel
    if (from.datasetParameter !== undefined) to.datasetParameter = from.datasetParameter
    if (from.useExpression !== undefined) to.useExpression = from.useExpression
    if (from.zipMailDocument !== undefined) to.zipMailDocument = from.zipMailDocument
    if (from.reportNameInSubject !== undefined) to.reportNameInSubject = from.reportNameInSubject
    if (from.mailsubj !== undefined) to.mailsubj = from.mailsubj
    if (from.containedFileName !== undefined) to.containedFileName = from.containedFileName
    if (from.mailtxt !== undefined) to.mailtxt = from.mailtxt
}

export function resetMailOptions(document: iTriggerDocument) {
    document.useFixedRecipients = true
    document.mailtos = ''
    if (document.useDataset) document.useDataset = false
    if (document.datasetLabel) document.datasetLabel = ''
    if (document.datasetParameter) document.datasetParameter = ''
    if (document.useExpression) document.useExpression = false
    if (document.uniqueMail) document.uniqueMail = false
    if (document.zipMailDocument) document.zipMailDocument = false
    if (document.reportNameInSubject) document.reportNameInSubject = false
    if (document.mailsubj) document.mailsubj = ''
    if (document.containedFileName) document.containedFileName = ''
    if (document.mailtxt) document.mailtxt = ''
}

// Port of onSendUniqueMailSelected: on copies the mail settings, off resets them
export function applyUniqueMailChange(trigger: iTriggerDraft, document: iTriggerDocument) {
    trigger.documents.forEach((other: iTriggerDocument) => {
        if (other.labelId === document.labelId || !other.sendmail) return
        if (document.uniqueMail) copyMailSettings(document, other)
        else resetMailOptions(other)
    })
}

export function getTriggerStart(trigger: any): Date | null {
    const value = isRecurring(trigger) && trigger.frequency ? trigger.frequency.startDate : trigger.zonedStartTime
    if (!value) return null
    const date = new Date(value)
    return isNaN(date.getTime()) ? null : date
}

export function getTriggerEnd(trigger: any): Date | null {
    if (trigger.chrono?.type === 'single') return null
    const value = isRecurring(trigger) && trigger.frequency ? trigger.frequency.endDate : trigger.zonedEndTime
    if (!value) return null
    const date = new Date(value)
    return isNaN(date.getTime()) ? null : date
}

const VALIDATION = 'managers.scheduler.validation.'

export function getTimingErrors(trigger: iTriggerDraft, now: Date = new Date()): string[] {
    const errors = [] as string[]
    if (!trigger.triggerDescription?.trim()) errors.push(VALIDATION + 'name')

    const start = getTriggerStart(trigger)
    const end = getTriggerEnd(trigger)
    if (!start) errors.push(VALIDATION + 'start')
    if (end && end.valueOf() < now.valueOf()) errors.push(VALIDATION + 'endInPast')
    else if (end && start && end.valueOf() < start.valueOf()) errors.push(VALIDATION + 'endBeforeStart')

    const parameter = trigger.chrono.parameter ?? {}
    if (isRecurring(trigger)) {
        const type = trigger.chrono.type
        if (!isCronUnit(type)) errors.push(VALIDATION + 'repeat')
        else if (type === 'week' && !parameter.days?.length) errors.push(VALIDATION + 'weekDays')
        else if (type === 'month') {
            if (parameter.months !== undefined && !parameter.months?.length) errors.push(VALIDATION + 'months')
            if (parameter.weeks !== undefined || parameter.days !== undefined) {
                if (!parameter.weeks) errors.push(VALIDATION + 'nthWeek')
                if (!parameter.days?.length) errors.push(VALIDATION + 'weekDays')
            }
        }
    } else if (trigger.chrono.type === 'event') {
        if (!parameter.type) errors.push(VALIDATION + 'eventType')
        else if (parameter.type === 'dataset') {
            if (!parameter.dataset) errors.push(VALIDATION + 'dataset')
            if (!parameter.frequency || Number(parameter.frequency) <= 0) errors.push(VALIDATION + 'frequency')
        }
    }
    return errors
}

// Returns the label keys of the missing fields
export function getOutputErrors(document: iTriggerDocument, kind: OutputKind, context: { inheritedMail?: boolean } = {}): string[] {
    const missing = [] as string[]
    switch (kind) {
        case 'snapshot':
            if (!document.snapshotname) missing.push('common.name')
            break
        case 'file':
            if (!document.fileName) missing.push('common.fileName')
            break
        case 'document':
            if (!document.documentname) missing.push('common.name')
            if (document.useFixedFolder && !document.funct?.length) missing.push('managers.scheduler.fixedFolder')
            if (document.useFolderDataset && !document.datasetFolderLabel) missing.push('managers.scheduler.datasetVerification')
            if (document.useFolderDataset && !document.datasetFolderParameter) missing.push('common.driver')
            break
        case 'mail':
            if (context.inheritedMail) break
            if (!document.useFixedRecipients && !document.useExpression && !document.useDataset) missing.push('managers.scheduler.recipients')
            if (document.useFixedRecipients && !document.mailtos) missing.push('managers.scheduler.mailTo')
            if (document.useExpression && !document.expression) missing.push('managers.scheduler.expression')
            if (document.useDataset && !document.datasetLabel) missing.push('managers.scheduler.datasetVerification')
    }
    return missing
}

export function getDocumentState(document: iTriggerDocument, trigger: { documents?: iTriggerDocument[] | null }, context: iValidationContext = {}): iDocumentState {
    const isTalend = isTalendDocument(document, context.jobInfo)
    const inheritedFrom = getMailSource(trigger, document)
    const enabledKinds = OUTPUT_KINDS.filter((kind: OutputKind) => !!document[OUTPUT_FLAGS[kind]])
    const errors = { snapshot: [], file: [], document: [], mail: [] } as Record<OutputKind, string[]>
    if (!isTalend) enabledKinds.forEach((kind: OutputKind) => (errors[kind] = getOutputErrors(document, kind, { inheritedMail: !!inheritedFrom })))
    const noOutput = !isTalend && enabledKinds.length === 0 && !document.sendtojavaclass
    const valid = isTalend || (!noOutput && enabledKinds.every((kind: OutputKind) => errors[kind].length === 0))
    return { valid, noOutput, isTalend, enabledKinds, errors, inheritedFrom }
}

export function isTriggerValid(trigger: iTriggerDraft, context: iValidationContext = {}, now?: Date): boolean {
    return firstTriggerError(trigger, context, now) === null
}

export function firstTriggerError(trigger: iTriggerDraft, context: iValidationContext = {}, now?: Date): iTriggerError | null {
    const timingErrors = getTimingErrors(trigger, now)
    if (timingErrors.length > 0) return { key: timingErrors[0] }
    for (const document of trigger.documents ?? []) {
        const state = getDocumentState(document, trigger, context)
        if (state.noOutput) return { key: VALIDATION + 'noOutput', params: { document: document.label } }
        if (!state.valid) return { key: VALIDATION + 'documentIncomplete', params: { document: document.label } }
    }
    return null
}

export function triggerQuery(trigger: { jobName: string; jobGroup: string; triggerName?: string; triggerGroup?: string }) {
    return `jobName=${encodeURIComponent(trigger.jobName)}&jobGroup=${encodeURIComponent(trigger.jobGroup)}&triggerName=${encodeURIComponent(String(trigger.triggerName))}&triggerGroup=${encodeURIComponent(String(trigger.triggerGroup))}`
}

export function isTriggerActive(trigger: iTrigger, now: Date = new Date()): 'active' | 'paused' | 'ended' {
    if (trigger.triggerIsPaused) return 'paused'
    const nowValue = now.getTime()
    const startDate = new Date(trigger.triggerZonedStartTime).getTime()
    const endDate = trigger.triggerZonedEndTime ? new Date(trigger.triggerZonedEndTime).getTime() : null

    if (trigger.triggerChronType === 'Single' && startDate < nowValue) return 'ended'
    if (endDate && (endDate < nowValue || startDate > nowValue)) return 'ended'
    return 'active'
}

const SCHEDULE = 'managers.scheduler.schedule.'

function pad(value: number) {
    return String(value).padStart(2, '0')
}

export function formatScheduleDate(date: Date, locale: string) {
    return new Intl.DateTimeFormat(locale, { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}

export function formatScheduleTime(date: Date) {
    return pad(date.getHours()) + ':' + pad(date.getMinutes())
}

// The typed date follows the field order and separators of the locale, e.g. dd/MM/yyyy
export function getDateInputPattern(locale: string) {
    const fields = [] as string[]
    const separators = [] as string[]
    new Intl.DateTimeFormat(locale, { year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(2026, 0, 1)).forEach((part) => {
        if (part.type === 'day') fields.push('dd')
        else if (part.type === 'month') fields.push('MM')
        else if (part.type === 'year') fields.push('yyyy')
        else if (part.type === 'literal' && fields.length > 0 && fields.length < 3) separators[fields.length - 1] = part.value.replace(/[^/.\- ]/g, '') || '/'
    })
    if (fields.length !== 3) return 'dd/MM/yyyy'
    return fields[0] + (separators[0] ?? '/') + fields[1] + (separators[1] ?? '/') + fields[2]
}

export function formatDateInput(value: string | null, pattern: string) {
    if (!value) return ''
    const [year, month, day] = value.split('-')
    return pattern.replace('yyyy', year.padStart(4, '0')).replace('MM', month).replace('dd', day)
}

// Returns YYYY-MM-DD, or null if the text is not a complete, existing date in the pattern
export function parseDateInput(text: string, pattern: string): string | null {
    if (text.length !== pattern.length) return null
    const values = { dd: 0, MM: 0, yyyy: 0 }
    for (const token of pattern.matchAll(/dd|MM|yyyy/g)) {
        const raw = text.substring(token.index as number, (token.index as number) + token[0].length)
        if (!/^\d+$/.test(raw)) return null
        values[token[0] as keyof typeof values] = Number(raw)
    }
    const { dd: day, MM: month, yyyy: year } = values
    const date = new Date(year, month - 1, day)
    if (year < 1000 || date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null
    return `${year}-${pad(month)}-${pad(day)}`
}

export function parseTimeInput(text: string): string | null {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(text) ? text : null
}

// '1' is Sunday, as in the KnCron descriptor; 4 January 2026 is a Sunday
export function getWeekdayName(day: string | number, locale: string) {
    return new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(new Date(2026, 0, 3 + Number(day)))
}

export function getMonthName(month: string | number, locale: string) {
    return new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(2026, Number(month) - 1, 1))
}

export function joinList(items: string[], t: Translate) {
    if (items.length <= 1) return items.join('')
    return items.slice(0, -1).join(', ') + ' ' + t(SCHEDULE + 'and') + ' ' + items[items.length - 1]
}

function sortedValues(values: string[] | undefined) {
    return [...(values ?? [])].sort((a: string, b: string) => Number(a) - Number(b))
}

export function describeChrono(trigger: any, t: Translate, locale: string, datasets: any[] = []): string {
    const chrono = trigger?.chrono
    if (!chrono) return ''
    const parameter = chrono.parameter ?? {}
    const start = getTriggerStart(trigger)
    const end = getTriggerEnd(trigger)
    const date = start ? formatScheduleDate(start, locale) : '-'
    const time = start ? formatScheduleTime(start) : '-'
    const n = Number(parameter.numRepetition ?? 1)
    let sentence = ''

    switch (chrono.type) {
        case 'single':
            return t(SCHEDULE + 'once', { date, time })
        case 'event':
            if (parameter.type === 'rest') sentence = t(SCHEDULE + 'restEvent')
            else if (parameter.type === 'contextbroker') sentence = t(SCHEDULE + 'contextBrokerEvent')
            else if (parameter.type === 'dataset') {
                const dataset = datasets.find((dataset: any) => String(dataset.id?.dsId) === String(parameter.dataset))?.label ?? parameter.dataset ?? '-'
                sentence = t(SCHEDULE + 'datasetEvent', { dataset, n: parameter.frequency ?? '-' })
            } else sentence = t(SCHEDULE + 'anyEvent')
            break
        case 'minute':
        case 'hour':
            sentence = t(SCHEDULE + (chrono.type === 'minute' ? 'everyMinutes' : 'everyHours'), { n }, n) + ', ' + t(SCHEDULE + 'fromDateTime', { date, time })
            break
        case 'day':
            sentence = t(SCHEDULE + 'everyDays', { n, time }, n) + ', ' + t(SCHEDULE + 'from', { date })
            break
        case 'week': {
            const days = joinList(
                sortedValues(parameter.days).map((day: string) => getWeekdayName(day, locale)),
                t
            )
            sentence = t(SCHEDULE + 'weekly', { days: days || '-', time }) + ', ' + t(SCHEDULE + 'from', { date })
            break
        }
        case 'month': {
            const monthPart =
                parameter.months !== undefined
                    ? t(SCHEDULE + 'inMonths', {
                          months:
                              joinList(
                                  sortedValues(parameter.months).map((month: string) => getMonthName(month, locale)),
                                  t
                              ) || '-'
                      })
                    : t(SCHEDULE + 'everyMonths', { n }, n)
            const nth = parameter.weeks ? t(SCHEDULE + 'nth.' + parameter.weeks) : '-'
            const days =
                joinList(
                    sortedValues(parameter.days).map((day: string) => getWeekdayName(day, locale)),
                    t
                ) || '-'
            const dayPart = parameter.weeks !== undefined || parameter.days !== undefined ? t(SCHEDULE + 'onNthWeekday', { nth, days }) : t(SCHEDULE + 'onDay', { day: parameter.dayRepetition ?? '-' })
            sentence = monthPart + ' ' + dayPart + ' ' + t(SCHEDULE + 'atTime', { time })
            break
        }
        default:
            sentence = t(SCHEDULE + 'noRepeat')
    }

    if (end) sentence += ', ' + t(SCHEDULE + 'until', { date: formatScheduleDate(end, locale), time: formatScheduleTime(end) })
    return sentence
}

const SUMMARY = 'managers.scheduler.summary.'

export function describeOutput(document: iTriggerDocument, kind: OutputKind, t: Translate, inheritedFrom?: iTriggerDocument | null): string {
    switch (kind) {
        case 'snapshot':
            return t(SUMMARY + 'snapshot', { name: document.snapshotname || '-' })
        case 'file':
            return t(SUMMARY + 'file', { name: document.fileName || '-' })
        case 'document':
            return t(SUMMARY + 'document', { name: document.documentname || '-' })
        case 'mail':
            if (inheritedFrom) return t(SUMMARY + 'mailInherited', { document: inheritedFrom.label })
            if (document.useExpression) return t(SUMMARY + 'mailExpression', { expression: document.expression || '-' })
            if (document.useDataset) return t(SUMMARY + 'mailDataset', { dataset: document.datasetLabel || '-' })
            return t(SUMMARY + 'mailTo', { to: document.mailtos || '-' })
    }
}

export function describeDocumentOutputs(document: iTriggerDocument, trigger: { documents?: iTriggerDocument[] | null }, t: Translate): string {
    const inheritedFrom = getMailSource(trigger, document)
    const text = OUTPUT_KINDS.filter((kind: OutputKind) => document[OUTPUT_FLAGS[kind]])
        .map((kind: OutputKind) => describeOutput(document, kind, t, inheritedFrom))
        .join(', ')
    return text.charAt(0).toUpperCase() + text.slice(1)
}
