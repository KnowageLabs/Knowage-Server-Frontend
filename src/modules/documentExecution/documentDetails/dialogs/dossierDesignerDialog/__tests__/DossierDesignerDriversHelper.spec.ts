import { describe, expect, it } from 'vitest'
import type { iDriver } from '@/modules/documentExecution/documentDetails/DocumentDetails'
import type { iDossierDriver } from '../DossierTemplate'
import { mergeDossierPlaceholderParameters, serializeDossierDriver } from '../DossierDesignerDriversHelper'

describe('mergeDossierPlaceholderParameters', () => {
    it('preserves saved static values while backfilling parameterUrlName from driver metadata', () => {
        const existingParameters: iDossierDriver[] = [{ urlName: 'Family', type: 'static', value: 'Food' }]
        const availableDrivers = [{ label: 'Family label', parameterUrlName: 'Family' }] as iDriver[]

        const merged = mergeDossierPlaceholderParameters(existingParameters, availableDrivers)

        expect(merged).toEqual([
            expect.objectContaining({
                label: 'Family label',
                parameterUrlName: 'Family',
                urlName: 'Family',
                type: 'static',
                value: 'Food'
            })
        ])
    })
})

describe('serializeDossierDriver', () => {
    it('keeps urlName when a reopened static parameter only has the backend-saved shape', () => {
        const serialized = serializeDossierDriver({ urlName: 'Family', type: 'static', value: 'Food' })

        expect(serialized).toEqual({
            urlName: 'Family',
            type: 'static',
            value: 'Food'
        })
    })

    it('keeps dynamic dossierUrlName when the mapping is already stored as a string', () => {
        const serialized = serializeDossierDriver({ urlName: 'Family', type: 'dynamic', dossierUrlName: 'DOSSIER_FAMILY' })

        expect(serialized).toEqual({
            urlName: 'Family',
            type: 'dynamic',
            dossierUrlName: 'DOSSIER_FAMILY'
        })
    })
})
