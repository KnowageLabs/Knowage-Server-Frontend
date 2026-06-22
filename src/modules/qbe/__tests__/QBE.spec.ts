import { describe, expect, it } from 'vitest'

import qbeSource from '../QBE.vue?raw'

describe('QBE Blockly calculated field dialog', () => {
    it('keeps the slotted PrimeVue dropdown overlays inside the local dialog tree', () => {
        expect(qbeSource).toMatch(/<Dropdown id="type"[\s\S]*?:options="qbeDescriptor\.types"[\s\S]*?append-to="self"/)
        expect(qbeSource).toMatch(/<Dropdown id="type"[\s\S]*?:options="qbeDescriptor\.admissibleDateFormats"[\s\S]*?append-to="self"/)
        expect(qbeSource).toMatch(/<Dropdown id="columnType"[\s\S]*?:options="qbeDescriptor\.columnTypes"[\s\S]*?append-to="self"/)
    })
})
