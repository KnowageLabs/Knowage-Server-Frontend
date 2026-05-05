import { describe, expect, it } from 'vitest'
import { getInvalidQbeAggregationNamesFromFormula } from '@/components/UI/KnBlockly/validation/qbeFunctionSemantics'

describe('qbeFunctionSemantics', () => {
    it('flags SQL aggregate functions with more than one argument', () => {
        expect(getInvalidQbeAggregationNamesFromFormula('sum($F{customer_region_id}, $F{num_children_at_home})')).toEqual(['sum'])
        expect(getInvalidQbeAggregationNamesFromFormula('AVG(sum($F{a}, $F{b}), $F{c})')).toEqual(['avg', 'sum'])
    })

    it('allows single-argument aggregate functions and multi-argument non-aggregates', () => {
        expect(getInvalidQbeAggregationNamesFromFormula('sum($F{customer_region_id})')).toEqual([])
        expect(getInvalidQbeAggregationNamesFromFormula('concat($F{lname}, \' - \', $F{fname})')).toEqual([])
    })
})
