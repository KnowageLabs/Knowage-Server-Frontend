import { describe, it, expect } from 'vitest'
import { hexToRgb, hexToRgba, convertColorFromHSLtoRGB } from '../FormattingHelpers'

describe('hexToRgb', () => {
    it('converte un hex valido a 6 cifre in rgb', () => {
        expect(hexToRgb('#ff0000')).toBe('rgb(255, 0, 0)')
        expect(hexToRgb('#00ff00')).toBe('rgb(0, 255, 0)')
        expect(hexToRgb('#0000ff')).toBe('rgb(0, 0, 255)')
        expect(hexToRgb('#ffffff')).toBe('rgb(255, 255, 255)')
        expect(hexToRgb('#000000')).toBe('rgb(0, 0, 0)')
    })

    it('converte hex maiuscolo in rgb', () => {
        expect(hexToRgb('#FF0000')).toBe('rgb(255, 0, 0)')
        expect(hexToRgb('#AABBCC')).toBe('rgb(170, 187, 204)')
    })

    it('restituisce rgb(0, 0, 0) se il valore non inizia con #', () => {
        expect(hexToRgb('ff0000')).toBe('rgb(0, 0, 0)')
        expect(hexToRgb('')).toBe('rgb(0, 0, 0)')
        expect(hexToRgb('red')).toBe('rgb(0, 0, 0)')
    })

    it('restituisce stringa vuota se il formato hex è invalido ma inizia con #', () => {
        expect(hexToRgb('#xyz')).toBe('')
    })
})

describe('hexToRgba', () => {
    it('converte hex in rgba con alpha di default a 1', () => {
        expect(hexToRgba('#ff0000')).toBe('rgba(255,0,0,1)')
        expect(hexToRgba('#000000')).toBe('rgba(0,0,0,1)')
        expect(hexToRgba('#ffffff')).toBe('rgba(255,255,255,1)')
    })

    it('converte hex in rgba con alpha personalizzato', () => {
        expect(hexToRgba('#ff0000', 0.5)).toBe('rgba(255,0,0,0.5)')
        expect(hexToRgba('#0000ff', 0)).toBe('rgba(0,0,255,0)')
        expect(hexToRgba('#00ff00', 0.75)).toBe('rgba(0,255,0,0.75)')
    })

    it('converte hex maiuscolo correttamente', () => {
        expect(hexToRgba('#FF0000', 1)).toBe('rgba(255,0,0,1)')
    })
})

describe('convertColorFromHSLtoRGB', () => {
    it('restituisce rgb(0, 0, 0) se il valore è null', () => {
        expect(convertColorFromHSLtoRGB(null)).toBe('rgb(0, 0, 0)')
    })

    it('converte rosso puro hsl in rgb', () => {
        // hsl(0, 100%, 50%) = rgb(255, 0, 0)
        expect(convertColorFromHSLtoRGB('hsl(0, 100%, 50%)')).toBe('rgb(255, 0, 0)')
    })

    it('converte verde puro hsl in rgb', () => {
        // hsl(120, 100%, 50%) = rgb(0, 255, 0)
        expect(convertColorFromHSLtoRGB('hsl(120, 100%, 50%)')).toBe('rgb(0, 255, 0)')
    })

    it('converte blu puro hsl in rgb', () => {
        // hsl(240, 100%, 50%) = rgb(0, 0, 255)
        expect(convertColorFromHSLtoRGB('hsl(240, 100%, 50%)')).toBe('rgb(0, 0, 255)')
    })

    it('converte bianco hsl in rgb', () => {
        // hsl(0, 0%, 100%) = rgb(255, 255, 255)
        expect(convertColorFromHSLtoRGB('hsl(0, 0%, 100%)')).toBe('rgb(255, 255, 255)')
    })

    it('converte nero hsl in rgb', () => {
        // hsl(0, 0%, 0%) = rgb(0, 0, 0)
        expect(convertColorFromHSLtoRGB('hsl(0, 0%, 0%)')).toBe('rgb(0, 0, 0)')
    })

    it('restituisce rgb(0, 0, 0) per stringa vuota', () => {
        expect(convertColorFromHSLtoRGB('')).toBe('rgb(0, 0, 0)')
    })
})
