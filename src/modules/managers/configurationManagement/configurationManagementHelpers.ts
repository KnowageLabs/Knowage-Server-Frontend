import { normalize } from '../managerListHelpers'
import { ConfigurationValueKind, iConfiguration, iConfigurationQuery } from './ConfigurationManagement'

// The password policy owns these settings (spec 7.5).
export const BANNED_LABELS = ['changepwdmodule.len_min', 'changepwdmodule.special_char', 'changepwdmodule.upper_char', 'changepwdmodule.lower_char', 'changepwdmodule.number', 'changepwdmodule.alphabetical']

// The group of a setting without a category, in the URL and in the group button.
export const UNCATEGORIZED = '__none'

export const LIMITS = { label: 100, name: 100, description: 500, category: 50, value: 1000 }

const CATEGORY_ICONS: Record<string, string> = {
    SECURITY: 'sym_o_shield',
    GENERIC_CONFIGURATION: 'sym_o_tune',
    'DATE-FORMAT': 'sym_o_calendar_month',
    'ORGANIZATIONAL-UNIT': 'sym_o_account_tree',
    THEMES: 'sym_o_palette',
    LANGUAGE_SUPPORTED: 'sym_o_translate',
    SCRIPT_LANGUAGE: 'sym_o_code',
    MAIL: 'sym_o_mail',
    SOCIAL_CONFIGURATION: 'sym_o_share',
    IMAGE_GALLERY: 'sym_o_image',
    PYTHON_CONFIGURATION: 'sym_o_terminal',
    R_CONFIGURATION: 'sym_o_terminal',
    SOLR_CONFIGURATION: 'sym_o_search',
    REST_CONFIGURATION: 'sym_o_api',
    DATA_PREPARATION: 'sym_o_cleaning_services',
    EXPORTER_CONFIGURATION: 'sym_o_ios_share'
}

export const categoryIcon = (category: string | null | undefined): string => CATEGORY_ICONS[category ?? ''] ?? 'sym_o_tune'

export const groupOf = (row: iConfiguration): string => row.category || UNCATEGORIZED

// GENERIC_CONFIGURATION -> "Generic configuration"
export function categoryLabel(category: string, uncategorizedLabel: string): string {
    if (!category || category === UNCATEGORIZED) return uncategorizedLabel
    const words = category.replace(/[_-]+/g, ' ').trim().toLowerCase()
    return words.charAt(0).toUpperCase() + words.slice(1)
}

export const isPasswordLabel = (label: string | null | undefined): boolean => !!label && label.toLowerCase().endsWith('.password')
export const isBooleanValue = (value: string | null | undefined): boolean => /^(true|false)$/i.test((value ?? '').trim())

// The field the dialog shows for the value (spec 7.4). A new setting always gets the text field.
export function valueKind(row: Pick<iConfiguration, 'label' | 'valueCheck'>, isNew: boolean): ConfigurationValueKind {
    if (isPasswordLabel(row.label)) return 'password'
    if (isNew) return 'text'
    const value = row.valueCheck ?? ''
    if (isBooleanValue(value)) return 'boolean'
    if (value.length > 60 || value.includes('\n')) return 'long'
    return 'text'
}

// A switch writes true / false in the case of the saved value.
export function booleanText(on: boolean, saved: string | null | undefined): string {
    const text = on ? 'true' : 'false'
    return saved && saved === saved.toUpperCase() && saved !== saved.toLowerCase() ? text.toUpperCase() : text
}

export const visibleSettings = (rows: iConfiguration[]): iConfiguration[] => rows.filter((row) => !BANNED_LABELS.includes(row.label))

const STATUS_TESTS: Record<string, (row: iConfiguration) => boolean> = { on: (row) => !!row.active, off: (row) => !row.active }
const VALUE_TESTS: Record<string, (row: iConfiguration) => boolean> = { set: (row) => !!row.valueCheck, empty: (row) => !row.valueCheck }

const passes = (selected: string[], tests: Record<string, (row: iConfiguration) => boolean>, row: iConfiguration) => !selected.length || selected.some((key) => tests[key]?.(row))

export const inCategory = (row: iConfiguration, category: string): boolean => !category || groupOf(row) === category

// Search: name, label and value (spec D5). A password value is never searched.
export function matchesSearch(row: iConfiguration, q: string): boolean {
    const term = normalize(q.trim())
    if (!term) return true
    const value = isPasswordLabel(row.label) ? '' : row.valueCheck
    return normalize(`${row.name} ${row.label} ${value}`).includes(term)
}

export function filterSettings(rows: iConfiguration[], query: iConfigurationQuery): iConfiguration[] {
    return rows.filter((row) => inCategory(row, query.category) && passes(query.status, STATUS_TESTS, row) && passes(query.value, VALUE_TESTS, row) && matchesSearch(row, query.q))
}

export const countBy = (rows: iConfiguration[], test: (row: iConfiguration) => boolean): number => rows.filter(test).length
export const statusTest = (key: string) => STATUS_TESTS[key]
export const valueTest = (key: string) => VALUE_TESTS[key]

export const sortByName = (rows: iConfiguration[]): iConfiguration[] => [...rows].sort((a, b) => (a.name || a.label).localeCompare(b.name || b.label, undefined, { sensitivity: 'base', numeric: true }))

