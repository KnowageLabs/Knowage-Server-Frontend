import deepcopy from 'deepcopy'
import type { iDriver } from '@/modules/documentExecution/documentDetails/DocumentDetails'
import type { iDossierDriver, iDossierDriverLinkType, iDossierTemplate, iPlaceholder } from '@/modules/documentExecution/documentDetails/dialogs/dossierDesignerDialog/DossierTemplate'

export function getDossierDriverParameterUrlName(driver?: iDossierDriver | null): string | undefined {
    if (!driver) return undefined
    return driver.parameterUrlName ?? driver.urlName
}

export function getDossierDynamicDriverUrlName(driver?: iDossierDriver | null): string | undefined {
    if (!driver?.dossierUrlName) return undefined
    return typeof driver.dossierUrlName === 'string' ? driver.dossierUrlName : driver.dossierUrlName.parameterUrlName
}

export function getDossierDriverLinkType(driver?: iDossierDriver | null): iDossierDriverLinkType | undefined {
    if (!driver?.type) return undefined
    return typeof driver.type === 'string' ? driver.type : driver.type.code
}

export function normalizeDossierDriver(driver: iDossierDriver): iDossierDriver {
    const normalizedDriver = deepcopy(driver ?? {}) as iDossierDriver
    const parameterUrlName = getDossierDriverParameterUrlName(normalizedDriver)
    const dossierUrlName = getDossierDynamicDriverUrlName(normalizedDriver)

    if (parameterUrlName) {
        normalizedDriver.parameterUrlName = parameterUrlName
        normalizedDriver.urlName = parameterUrlName
    }

    if (dossierUrlName) {
        normalizedDriver.dossierUrlName = dossierUrlName
    }

    return normalizedDriver
}

export function serializeDossierDriver(driver: iDossierDriver): iDossierDriver | null {
    const parameterUrlName = getDossierDriverParameterUrlName(driver)
    const driverType = getDossierDriverLinkType(driver)
    if (!parameterUrlName || !driverType || driverType === 'inherit') return null

    if (driverType === 'static') {
        return {
            urlName: parameterUrlName,
            type: 'static',
            value: driver.value
        }
    }

    return {
        urlName: parameterUrlName,
        type: 'dynamic',
        dossierUrlName: getDossierDynamicDriverUrlName(driver)
    }
}

export function mergeDossierPlaceholderParameters(existingParameters: iDossierDriver[] = [], availableDrivers: iDriver[] = []): iDossierDriver[] {
    const normalizedExistingParameters = existingParameters.map((driver) => normalizeDossierDriver(driver))
    const mergedParameters = normalizedExistingParameters.map((driver) => {
        const parameterUrlName = getDossierDriverParameterUrlName(driver)
        const matchingDriver = availableDrivers.find((candidate) => candidate.parameterUrlName === parameterUrlName)

        if (!matchingDriver || !parameterUrlName) return driver

        return {
            ...normalizeDossierDriver(matchingDriver as iDossierDriver),
            ...driver,
            parameterUrlName,
            urlName: parameterUrlName,
            dossierUrlName: getDossierDynamicDriverUrlName(driver) ?? getDossierDynamicDriverUrlName(matchingDriver as iDossierDriver)
        }
    })

    const existingKeys = new Set(mergedParameters.map((driver) => getDossierDriverParameterUrlName(driver)).filter((parameterUrlName): parameterUrlName is string => Boolean(parameterUrlName)))
    const missingParameters = availableDrivers.filter((driver) => driver.parameterUrlName && !existingKeys.has(driver.parameterUrlName)).map((driver) => normalizeDossierDriver(driver as iDossierDriver))

    return [...mergedParameters, ...missingParameters]
}

export function normalizeDossierPlaceholder(placeholder: iPlaceholder): iPlaceholder {
    const normalizedPlaceholder = deepcopy(placeholder) as iPlaceholder
    normalizedPlaceholder.parameters = (normalizedPlaceholder.parameters ?? []).map((driver) => normalizeDossierDriver(driver))
    return normalizedPlaceholder
}

export function normalizeDossierTemplate(template: iDossierTemplate): iDossierTemplate {
    const normalizedTemplate = deepcopy(template) as iDossierTemplate
    normalizedTemplate.placeholders = (normalizedTemplate.placeholders ?? []).map((placeholder) => normalizeDossierPlaceholder(placeholder))
    return normalizedTemplate
}
