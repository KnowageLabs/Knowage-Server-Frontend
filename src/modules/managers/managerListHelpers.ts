import { extendedAlphanumeric } from '@/helpers/commons/regexHelper'

// Shared by the Configuration and Domains pages (spec config-domains-redesign).

export const normalize = (text: string | null | undefined): string =>
    (text ?? '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()

// true, or the i18n key of the message and its parameters
export type ValidationResult = true | { key: string; params?: Record<string, unknown> }

export function checkText(value: string | null | undefined, options: { required?: boolean; max: number; pattern?: boolean }): ValidationResult {
    const text = (value ?? '').trim()
    if (options.required && !text) return { key: 'common.validation.required' }
    if (text.length > options.max) return { key: 'common.validation.maximumCharacters', params: { max: options.max } }
    if (options.pattern && text && !extendedAlphanumeric.test(text)) return { key: 'common.validation.regex' }
    return true
}

// A rule for a Quasar field: the message, translated with the field name.
export const toRuleMessage = (result: ValidationResult, t: (key: string, params?: Record<string, unknown>) => string, fieldKey: string): true | string => (result === true ? true : t(result.key, { fieldName: t(fieldKey), ...result.params }))
