export interface iPackage {
    jobName: string
    jobGroup: string
    jobDescription: string
    jobClass: string
    jobDurability: boolean
    jobRequestRecovery: boolean
    jobMergeAllSnapshots: boolean
    jobCollateSnapshots: boolean
    useVolatility: boolean
    jobParameters: { name: string; value: string }[]
    documents: any[]
    triggers: iTrigger[]
    edit?: boolean
    role?: string
    numberOfDocuments?: number
}

export type CronUnit = 'minute' | 'hour' | 'day' | 'week' | 'month'
export type ChronoType = 'single' | 'scheduler' | 'event' | CronUnit
export type EventType = '' | 'rest' | 'contextbroker' | 'dataset'
export type OutputKind = 'snapshot' | 'file' | 'document' | 'mail'

// Values are strings ('1'), as KnCron writes them. days: '1' Sunday to '7' Saturday. weeks: '1' to '5' (5 = last).
export interface iChronoParameter {
    type?: EventType | string
    numRepetition?: string
    dayRepetition?: string
    days?: string[]
    months?: string[]
    weeks?: string | null
    dataset?: number | string
    frequency?: string
}

export interface iChrono {
    type: ChronoType
    parameter?: iChronoParameter
}

export interface iFrequency {
    cron: iChrono
    startDate: number
    startTime: string
    endDate: number | null
    endTime: string
}

// Trigger row of listAllJobs
export interface iTrigger {
    jobName: string
    jobGroup: string
    triggerName: string
    triggerGroup: string
    triggerDescription: string
    triggerCalendarName?: string
    triggerStartDate: string
    triggerStartTime: string
    triggerEndDate: string
    triggerEndTime: string
    triggerZonedStartTime: string
    triggerZonedEndTime: string
    triggerChronString: string
    triggerChronType: string
    triggerIsPaused: boolean
    jobParameters?: { name: string; value: string }[]
}

export interface iTriggerDocument {
    id: number | string
    label: string
    labelId?: string
    name?: string
    description?: string
    engine?: string
    parameters?: any[]
    outputType?: 'PDF' | 'XLS'
    saveassnapshot?: boolean
    snapshotname?: string
    snapshothistorylength?: string | number
    saveasfile?: boolean
    fileName?: string
    destinationfolder?: string
    isrelativetoresourcefolder?: boolean
    isprocessmonitoringenabled?: boolean
    zipFileDocument?: boolean
    zipFileName?: string
    saveasdocument?: boolean
    documentname?: string
    documentdescription?: string
    useFixedFolder?: boolean
    funct?: number[]
    useFolderDataset?: boolean
    datasetFolderLabel?: string
    datasetFolderParameter?: string
    sendtojavaclass?: boolean
    sendmail?: boolean
    useFixedRecipients?: boolean
    mailtos?: string
    useExpression?: boolean
    expression?: string
    useDataset?: boolean
    datasetLabel?: string
    datasetParameter?: string
    uniqueMail?: boolean
    zipMailDocument?: boolean
    zipMailName?: string
    reportNameInSubject?: boolean
    mailsubj?: string
    containedFileName?: string
    mailtxt?: string
    invalid?: Record<string, boolean>
}

// getTriggerInfo response, and the editor draft built from it (same shape as the old dialog trigger)
export interface iTriggerDraft {
    jobName: string
    jobGroup: string
    triggerName?: string
    triggerGroup?: string
    triggerDescription?: string
    startDate?: string
    startDateRFC3339?: string
    startTime?: string
    zonedStartTime?: string | Date | null
    zonedEndTime?: string | Date | null
    chrono: iChrono
    documents: iTriggerDocument[]
    startDateTiming?: Date
    startTimeTiming?: Date
    endDateTiming?: Date | null
    endTimeTiming?: Date | null
    frequency?: iFrequency
}

export interface iJobInfo {
    jobName: string
    jobDescription: string
    jobGroupName: string
    documents: iTriggerDocument[]
}

export interface iFunctionality {
    id: number
    path: string
    name: string
    description: string | null
    childs?: iFunctionality[]
}

export interface iFile {
    id: number
    name: string
    parentId?: number
    biObjects?: Array
    exportable?: boolean
}

export interface iNode {
    key: number | string
    icon: string
    id: number
    parentId?: number
    label: string
    children?: iNode[]
    selectable?: Boolean
    data: string | any
    customIcon?: string
}
