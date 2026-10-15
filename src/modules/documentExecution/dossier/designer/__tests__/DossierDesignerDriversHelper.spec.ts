import { describe, expect, it } from 'vitest'
import type { iDriver } from '@/modules/documentExecution/documentDetails/DocumentDetails'
import type { iDossierDriver } from '../DossierTemplate'
import { mergeDossierPlaceholderParameters, serializeDossierDriver, serializeInheritDriverForPersist } from '../DossierDesignerDriversHelper'

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

describe('serializeInheritDriverForPersist', () => {
    it('removes dossier-only fields and keeps the document driver payload expected by documentdetails drivers', () => {
        const serialized = serializeInheritDriverForPersist({
            id: 9,
            label: 'Family',
            parameterUrlName: 'Family',
            parID: 10,
            modifiable: 1,
            prog: 3,
            parameter: { id: 7, type: 'STRING' } as any,
            type: 'inherit',
            urlName: 'Family',
            dossierUrlName: 'DOSSIER_FAMILY',
            urlNameDescription: 'Family description',
            value: 'Food',
            inherit: true
        }, 12, 4)

        expect(serialized).toEqual({
            label: 'Family',
            parameterUrlName: 'Family',
            parID: 10,
            modifiable: 0,
            prog: 4,
            parameter: { id: 7, type: 'STRING' },
            biObjectID: 12
        })
    })
})
