import { describe, expect, it } from 'vitest'
import { createI18n } from 'vue-i18n'
import deepcopy from 'deepcopy'
import messages from '@/i18n/en-US/messages.json'
import { iTrigger, iTriggerDocument, iTriggerDraft } from '../Scheduler'
import { applyUniqueMailChange, changeTriggerType, copyMailSettings, createNewTriggerDraft, describeChrono, describeDocumentOutputs, firstTriggerError, formatTrigger, getDocumentState, getOutputErrors, getTimingErrors, getTriggerSnapshot, initTriggerTiming, isTriggerActive, isTriggerValid, normalizeTriggerDocuments } from '../schedulerHelpers'

const i18n = createI18n({ legacy: false, locale: 'en-US', messages: { 'en-US': messages } })
const t = i18n.global.t as any
const LOCALE = 'en-GB'
const NOW = new Date(2026, 9, 26, 12, 0)

const snapshotInfoDocuments = () => [
    { labelId: '6__2', id: '6', label: 'SUMMARY_TEST', saveassnapshot: true, snapshotname: 'snap1', outputType: 'PDF' },
    { labelId: '2__1', id: '2', label: 'SourceDash', saveassnapshot: true, snapshotname: 'snap0', outputType: 'PDF' },
    { labelId: '2__3', id: '2', label: 'SourceDash', saveassnapshot: true, snapshotname: 'snap2', outputType: 'PDF' }
]
const withoutLabel = (documents: any[]) => documents.map(({ label, ...rest }) => rest)

const infoBase = { jobName: 'PLAN_BASELINE', jobGroup: 'BIObjectExecutions', startDate: '26/10/2026', startDateRFC3339: '2026-10-26', startTime: '12:23', zonedEndTime: null }

// getTriggerInfo responses and the saveTrigger bodies that the old dialog sent for them with no change (phase 0)
const fixtures = [
    {
        name: 'T_MINUTE',
        info: { ...infoBase, triggerName: 'T_MINUTE', triggerDescription: 'T_MINUTE', zonedStartTime: '2026-10-26T12:23:29.000Z', chrono: { type: 'minute', parameter: { numRepetition: '15' } }, documents: snapshotInfoDocuments() },
        body: {
            jobName: 'PLAN_BASELINE',
            jobGroup: 'BIObjectExecutions',
            triggerName: 'T_MINUTE',
            triggerDescription: 'T_MINUTE',
            zonedStartTime: '2026-10-26T12:23:29.000Z',
            chrono: { type: 'minute', parameter: { numRepetition: '15' } },
            documents: withoutLabel(snapshotInfoDocuments()),
            frequency: { cron: { type: 'minute', parameter: { type: 'minute', parameter: { numRepetition: '15' } } }, startDate: 1793017409000, startTime: '', endDate: null, endTime: '' },
            triggerGroup: '',
            zonedEndtime: null
        }
    },
    {
        name: 'T_MONTH_ADV',
        info: { ...infoBase, triggerName: 'T_MONTH_ADV', triggerDescription: 'T_MONTH_ADV', zonedStartTime: '2026-10-26T12:24:28.000Z', chrono: { type: 'month', parameter: { months: ['1', '7'], weeks: '1', days: ['2'] } }, documents: snapshotInfoDocuments() },
        body: {
            jobName: 'PLAN_BASELINE',
            jobGroup: 'BIObjectExecutions',
            triggerName: 'T_MONTH_ADV',
            triggerDescription: 'T_MONTH_ADV',
            zonedStartTime: '2026-10-26T12:24:28.000Z',
            chrono: { type: 'month', parameter: { months: ['1', '7'], weeks: '1', days: ['2'] } },
            documents: withoutLabel(snapshotInfoDocuments()),
            frequency: { cron: { type: 'month', parameter: { type: 'month', parameter: { months: ['1', '7'], weeks: '1', days: ['2'] } } }, startDate: 1793017468000, startTime: '', endDate: null, endTime: '' },
            triggerGroup: '',
            zonedEndtime: null
        }
    },
    {
        name: 'T_EVENT_DATASET',
        info: { ...infoBase, triggerName: 'T_EVENT_DATASET', triggerDescription: 'T_EVENT_DATASET', zonedStartTime: '2026-10-26T12:25:01.000Z', chrono: { type: 'event', parameter: { type: 'dataset', dataset: 4, frequency: '15' } }, documents: snapshotInfoDocuments() },
        body: {
            jobName: 'PLAN_BASELINE',
            jobGroup: 'BIObjectExecutions',
            triggerName: 'T_EVENT_DATASET',
            triggerDescription: 'T_EVENT_DATASET',
            zonedStartTime: '2026-10-26T12:25:01.000Z',
            chrono: { type: 'event', parameter: { type: 'dataset', dataset: 4, frequency: '15' } },
            documents: withoutLabel(snapshotInfoDocuments()),
            triggerGroup: ''
        }
    },
    {
        name: 'T_OUTPUTS',
        info: {
            ...infoBase,
            triggerName: 'T_OUTPUTS',
            triggerDescription: 'T_OUTPUTS',
            zonedStartTime: '2026-11-16T12:27:00.000Z',
            chrono: { type: 'single' },
            documents: [
                { labelId: '6__2', id: '6', label: 'SUMMARY_TEST', sendmail: true, useFixedRecipients: true, mailtos: 'unique@b.com', uniqueMail: true, outputType: 'PDF' },
                {
                    labelId: '2__1',
                    id: '2',
                    label: 'SourceDash',
                    saveassnapshot: true,
                    snapshotname: 'snapA',
                    snapshothistorylength: '5',
                    saveasfile: true,
                    destinationfolder: 'dest/folder',
                    isrelativetoresourcefolder: true,
                    isprocessmonitoringenabled: false,
                    zipFileDocument: true,
                    fileName: 'fileA',
                    zipFileName: 'zipA',
                    saveasdocument: true,
                    documentname: 'docA',
                    documentdescription: 'docA description',
                    useFixedFolder: true,
                    funct: [2],
                    sendmail: true,
                    useFixedRecipients: true,
                    mailtos: 'unique@b.com',
                    mailsubj: 'Subject A',
                    containedFileName: 'contained',
                    outputType: 'PDF'
                },
                { labelId: '2__3', id: '2', label: 'SourceDash', saveassnapshot: true, snapshotname: 'snapC', outputType: 'PDF' }
            ]
        },
        body: null as any
    }
]
fixtures[3].body = { jobName: 'PLAN_BASELINE', jobGroup: 'BIObjectExecutions', triggerName: 'T_OUTPUTS', triggerDescription: 'T_OUTPUTS', zonedStartTime: '2026-11-16T12:27:00.000Z', chrono: { type: 'single' }, documents: withoutLabel(fixtures[3].info.documents), triggerGroup: '' }

const toPayload = (trigger: iTriggerDraft) => {
    const formatted = JSON.parse(JSON.stringify(formatTrigger(trigger)))
    delete formatted._endTime
    return formatted
}

const jobDocuments = () => [
    { id: 2, label: 'SourceDash', name: 'SourceDash', description: '', engine: 'knowagedashboardengine', parameters: [] },
    { id: 6, label: 'SUMMARY_TEST', name: 'SUMMARY_TEST', description: '', engine: 'knowagedashboardengine', parameters: [] },
    { id: 2, label: 'SourceDash', name: 'SourceDash', description: '', engine: 'knowagedashboardengine', parameters: [] }
]

const draftWith = (chrono: any, extra: Partial<iTriggerDraft> = {}): iTriggerDraft => {
    const draft = { jobName: 'J', jobGroup: 'G', triggerName: 'N', zonedStartTime: new Date(2026, 10, 1, 8, 0).toISOString(), zonedEndTime: null, chrono, documents: [], ...extra } as iTriggerDraft
    return initTriggerTiming(draft)
}

describe('formatTrigger', () => {
    it.each(fixtures.map((fixture) => [fixture.name, fixture]))('sends the phase-0 body for %s opened and saved with no change', (_name, fixture: any) => {
        const draft = initTriggerTiming(deepcopy(fixture.info))
        expect(toPayload(draft)).toEqual(fixture.body)
    })

    it('sends the phase-0 body for a new single trigger', () => {
        const draft = initTriggerTiming(createNewTriggerDraft('PLAN_BASELINE', 'BIObjectExecutions', jobDocuments() as any))
        normalizeTriggerDocuments(draft)
        draft.triggerDescription = 'T_SINGLE'
        draft.triggerName = 'T_SINGLE'
        draft.startDateTiming = new Date(2026, 10, 15)
        draft.startTimeTiming = new Date(2026, 9, 26, 13, 27, 12)
        draft.zonedStartTime = draft.startDateTiming
        draft.zonedStartTime.setHours(13)
        draft.zonedStartTime.setMinutes(27)
        draft.documents.forEach((document: iTriggerDocument, index: number) => {
            document.saveassnapshot = true
            document.snapshotname = 'snap' + index
        })

        const expectedDocument = (id: number, label: string, labelId: string, snapshotname: string) => ({
            id,
            label,
            name: label,
            description: '',
            engine: 'knowagedashboardengine',
            parameters: [],
            outputType: 'PDF',
            saveassnapshot: true,
            saveasfile: false,
            saveasdocument: false,
            sendtojavaclass: false,
            sendmail: false,
            snapshotname,
            labelId
        })
        expect(toPayload(draft)).toEqual({
            jobName: 'PLAN_BASELINE',
            jobGroup: 'BIObjectExecutions',
            chrono: { type: 'single' },
            documents: [expectedDocument(2, 'SourceDash', '2__1', 'snap0'), expectedDocument(6, 'SUMMARY_TEST', '6__2', 'snap1'), expectedDocument(2, 'SourceDash', '2__3', 'snap2')],
            triggerDescription: 'T_SINGLE',
            zonedStartTime: new Date(2026, 10, 15, 13, 27).toISOString(),
            triggerName: 'T_SINGLE',
            triggerGroup: ''
        })
    })

    it('removes the invalid objects and does not change the draft', () => {
        const draft = initTriggerTiming(deepcopy(fixtures[0].info) as any)
        draft.documents[0].invalid = { invalidSnapshot: false }
        const before = JSON.stringify(draft)
        expect(toPayload(draft).documents[0].invalid).toBeUndefined()
        expect(JSON.stringify(draft)).toBe(before)
    })

    it('escapes the mail text', () => {
        const draft = initTriggerTiming(deepcopy(fixtures[3].info) as any)
        draft.documents[0].mailtxt = '<b>Hi</b>'
        expect(toPayload(draft).documents[0].mailtxt).toBe('&lt;b&gt;Hi&lt;/b&gt;')
    })

    it('adds the end date of a recurring trigger', () => {
        const draft = draftWith({ type: 'hour', parameter: { numRepetition: '6' } })
        draft.frequency!.endDate = new Date(2026, 10, 20).valueOf()
        const payload = toPayload(draft)
        expect(payload.zonedEndTime).toBe(new Date(2026, 10, 20).toISOString())
        expect(payload.frequency.endDate).toBe(new Date(2026, 10, 20).valueOf())
    })
})

describe('normalizeTriggerDocuments', () => {
    it('writes the defaults once, so the snapshot does not change after a second call', () => {
        const draft = initTriggerTiming(deepcopy(fixtures[3].info) as any)
        normalizeTriggerDocuments(draft)
        const snapshot = getTriggerSnapshot(draft)
        normalizeTriggerDocuments(draft)
        expect(getTriggerSnapshot(draft)).toBe(snapshot)
        const mail = draft.documents[0]
        expect(mail).toMatchObject({ uniqueMail: true, zipMailDocument: false, reportNameInSubject: false, mailtxt: '', saveasfile: false })
        expect(mail.useExpression).toBeUndefined()
        expect(draft.documents[2].zipFileDocument).toBeUndefined()
        expect(draft.documents[1].useFixedFolder).toBe(true)
    })
})

describe('describeChrono', () => {
    const start = new Date(2026, 10, 1, 8, 0)
    const end = new Date(2026, 11, 31, 18, 0)
    const describe1 = (chrono: any, withEnd = false, datasets: any[] = []) => describeChrono(draftWith(chrono, { zonedStartTime: start.toISOString(), zonedEndTime: withEnd ? end.toISOString() : null }), t, LOCALE, datasets)
    const until = ', until 31/12/2026 18:00'

    it('single', () => {
        expect(describeChrono(draftWith({ type: 'single', parameter: {} }, { zonedStartTime: end.toISOString() }), t, LOCALE)).toBe('Once on 31/12/2026 at 18:00')
    })
    it.each([
        ['minute', { type: 'minute', parameter: { numRepetition: '15' } }, 'Every 15 minutes, from 01/11/2026 08:00'],
        ['hour', { type: 'hour', parameter: { numRepetition: '1' } }, 'Every hour, from 01/11/2026 08:00'],
        ['day', { type: 'day', parameter: { numRepetition: '2' } }, 'Every 2 days at 08:00, from 01/11/2026'],
        ['week', { type: 'week', parameter: { days: ['4', '2'] } }, 'Every week on Monday and Wednesday at 08:00, from 01/11/2026'],
        ['month simple', { type: 'month', parameter: { numRepetition: '3', dayRepetition: '1' } }, 'Every 3 months on day 1 at 08:00'],
        ['month advanced', { type: 'month', parameter: { months: ['1', '7'], weeks: '1', days: ['2'] } }, 'In January and July on the first Monday at 08:00']
    ])('%s, with and without an end date', (_name, chrono, sentence) => {
        expect(describe1(chrono)).toBe(sentence)
        expect(describe1(chrono, true)).toBe(sentence + until)
    })
    it('events', () => {
        expect(describe1({ type: 'event', parameter: { type: 'rest' } })).toBe('When a REST event arrives')
        expect(describe1({ type: 'event', parameter: { type: 'contextbroker' } })).toBe('When a Context Broker event arrives')
        expect(describe1({ type: 'event', parameter: { type: 'dataset', dataset: 4, frequency: '15' } }, false, [{ label: 'Orders', id: { dsId: 4 } }])).toBe('When the dataset "Orders" changes (checked every 15 minutes)')
        expect(describe1({ type: 'event', parameter: { type: 'rest' } }, true)).toBe('When a REST event arrives' + until)
    })
    it('reads a getTriggerInfo response', () => {
        expect(describeChrono(fixtures[1].info, t, LOCALE)).toContain('In January and July on the first Monday at')
    })
})

describe('validation', () => {
    it('timing: name and start', () => {
        const draft = draftWith({ type: 'single', parameter: {} })
        expect(getTimingErrors(draft, NOW)).toEqual([])
        draft.triggerDescription = ' '
        expect(getTimingErrors(draft, NOW)).toEqual(['managers.scheduler.validation.name'])
    })
    it('timing: the end is after the start and not in the past', () => {
        const draft = draftWith({ type: 'event', parameter: { type: 'rest' } }, { zonedEndTime: new Date(2026, 10, 2).toISOString() })
        expect(getTimingErrors(draft, NOW)).toEqual([])
        draft.zonedEndTime = new Date(2026, 9, 31).toISOString()
        expect(getTimingErrors(draft, NOW)).toEqual(['managers.scheduler.validation.endBeforeStart'])
        draft.zonedEndTime = new Date(2026, 9, 1).toISOString()
        expect(getTimingErrors(draft, NOW)).toEqual(['managers.scheduler.validation.endInPast'])
    })
    it('timing: recurring', () => {
        expect(getTimingErrors(draftWith({ type: 'scheduler', parameter: { type: '' } }), NOW)).toEqual(['managers.scheduler.validation.repeat'])
        expect(getTimingErrors(draftWith({ type: 'week', parameter: { days: ['2'] } }), NOW)).toEqual([])
        expect(getTimingErrors(draftWith({ type: 'week', parameter: { days: [] } }), NOW)).toEqual(['managers.scheduler.validation.weekDays'])
        expect(getTimingErrors(draftWith({ type: 'month', parameter: { months: ['1'], dayRepetition: '1' } }), NOW)).toEqual([])
        expect(getTimingErrors(draftWith({ type: 'month', parameter: { months: [], dayRepetition: '1' } }), NOW)).toEqual(['managers.scheduler.validation.months'])
        expect(getTimingErrors(draftWith({ type: 'month', parameter: { numRepetition: '1', weeks: '2', days: ['3'] } }), NOW)).toEqual([])
        expect(getTimingErrors(draftWith({ type: 'month', parameter: { numRepetition: '1', weeks: null, days: [] } }), NOW)).toEqual(['managers.scheduler.validation.nthWeek', 'managers.scheduler.validation.weekDays'])
    })
    it('timing: dataset event', () => {
        expect(getTimingErrors(draftWith({ type: 'event', parameter: { type: 'dataset', dataset: 4, frequency: '15' } }), NOW)).toEqual([])
        expect(getTimingErrors(draftWith({ type: 'event', parameter: { type: 'dataset' } }), NOW)).toEqual(['managers.scheduler.validation.dataset', 'managers.scheduler.validation.frequency'])
        expect(getTimingErrors(draftWith({ type: 'event', parameter: { type: '' } }), NOW)).toEqual(['managers.scheduler.validation.eventType'])
    })
    it.each([
        ['snapshot', { snapshotname: 'a' }, {}, ['common.name']],
        ['file', { fileName: 'a' }, {}, ['common.fileName']],
        ['document', { documentname: 'a' }, { useFixedFolder: true, funct: [] }, ['common.name', 'managers.scheduler.fixedFolder']],
        ['mail', { useFixedRecipients: true, mailtos: 'a@b.com' }, { useFixedRecipients: true, mailtos: '' }, ['managers.scheduler.mailTo']]
    ])('outputs: %s', (kind: any, valid, invalid, missing) => {
        expect(getOutputErrors(valid as any, kind)).toEqual([])
        expect(getOutputErrors(invalid as any, kind)).toEqual(missing)
    })
    it('outputs: document folder from a dataset, and mail modes', () => {
        expect(getOutputErrors({ documentname: 'a', useFolderDataset: true } as any, 'document')).toEqual(['managers.scheduler.datasetVerification', 'common.driver'])
        expect(getOutputErrors({} as any, 'mail')).toEqual(['managers.scheduler.recipients'])
        expect(getOutputErrors({ useExpression: true } as any, 'mail')).toEqual(['managers.scheduler.expression'])
        expect(getOutputErrors({ useDataset: true } as any, 'mail')).toEqual(['managers.scheduler.datasetVerification'])
        expect(getOutputErrors({} as any, 'mail', { inheritedMail: true })).toEqual([])
    })
    it('documents: no output, Talend and the inherited mail', () => {
        const trigger = {
            documents: [
                { labelId: '1__1', id: 1, label: 'A', sendmail: true, uniqueMail: true, useFixedRecipients: true, mailtos: 'a@b.com' },
                { labelId: '1__2', id: 1, label: 'A', sendmail: true },
                { labelId: '3__3', id: 3, label: 'T' }
            ] as any[]
        }
        expect(getDocumentState(trigger.documents[0], trigger).valid).toBe(true)
        const inherited = getDocumentState(trigger.documents[1], trigger)
        expect(inherited.valid).toBe(true)
        expect(inherited.inheritedFrom?.labelId).toBe('1__1')
        expect(getDocumentState(trigger.documents[2], trigger)).toMatchObject({ valid: false, noOutput: true })
        const jobInfo = { documents: [{}, {}, { id: 3, label: 'T', engine: 'knowagetalendengine' }] } as any
        expect(getDocumentState(trigger.documents[2], trigger, { jobInfo })).toMatchObject({ valid: true, isTalend: true, noOutput: false })
    })
    it('trigger: first error and validity', () => {
        const draft = draftWith({ type: 'single', parameter: {} }, { documents: [{ labelId: '1__1', id: 1, label: 'A', saveasfile: true }] as any })
        expect(firstTriggerError(draft, {}, NOW)).toEqual({ key: 'managers.scheduler.validation.documentIncomplete', params: { document: 'A' } })
        draft.documents[0].fileName = 'f'
        expect(isTriggerValid(draft, {}, NOW)).toBe(true)
        draft.documents[0].saveasfile = false
        expect(firstTriggerError(draft, {}, NOW)).toEqual({ key: 'managers.scheduler.validation.noOutput', params: { document: 'A' } })
    })
})

describe('unique mail', () => {
    it('copies the settings on, and resets them off', () => {
        const draft = {
            documents: [
                { labelId: 'a', sendmail: true, uniqueMail: true, useFixedRecipients: true, mailtos: 'x@y.z', mailsubj: 'S' },
                { labelId: 'b', sendmail: true },
                { labelId: 'c', sendmail: false }
            ]
        } as any
        applyUniqueMailChange(draft, draft.documents[0])
        expect(draft.documents[1]).toMatchObject({ mailtos: 'x@y.z', mailsubj: 'S', useFixedRecipients: true })
        expect(draft.documents[2].mailtos).toBeUndefined()
        draft.documents[0].uniqueMail = false
        applyUniqueMailChange(draft, draft.documents[0])
        expect(draft.documents[1]).toMatchObject({ mailtos: '', mailsubj: '', useFixedRecipients: true })
    })
    it('copyMailSettings keeps the fields that the source does not have', () => {
        const to = { mailsubj: 'keep' } as any
        copyMailSettings({ mailtos: 'a' } as any, to)
        expect(to).toMatchObject({ mailtos: 'a', mailsubj: 'keep' })
    })
})

describe('other helpers', () => {
    const listTrigger = (extra: Partial<iTrigger>) => ({ triggerIsPaused: false, triggerChronType: 'Scheduler-day', triggerZonedStartTime: new Date(2026, 9, 1).toISOString(), triggerZonedEndTime: '', ...extra }) as iTrigger
    it('isTriggerActive', () => {
        expect(isTriggerActive(listTrigger({}), NOW)).toBe('active')
        expect(isTriggerActive(listTrigger({ triggerIsPaused: true }), NOW)).toBe('paused')
        expect(isTriggerActive(listTrigger({ triggerChronType: 'Single' }), NOW)).toBe('ended')
        expect(isTriggerActive(listTrigger({ triggerZonedEndTime: new Date(2026, 9, 2).toISOString() }), NOW)).toBe('ended')
    })
    it('changeTriggerType resets the chrono as formatFrequency did', () => {
        const draft = draftWith({ type: 'single', parameter: {} })
        changeTriggerType(draft, 'scheduler')
        expect(draft.chrono).toEqual({ type: 'scheduler', parameter: { type: '' } })
        expect(draft.frequency?.cron).toBe(draft.chrono)
    })
    it('describeDocumentOutputs', () => {
        const trigger = { documents: [{ labelId: 'a', saveasfile: true, fileName: 'sales.pdf', sendmail: true, useFixedRecipients: true, mailtos: 'a@b.com' }] } as any
        expect(describeDocumentOutputs(trigger.documents[0], trigger, t)).toBe('File sales.pdf, mail to a@b.com')
    })
})
