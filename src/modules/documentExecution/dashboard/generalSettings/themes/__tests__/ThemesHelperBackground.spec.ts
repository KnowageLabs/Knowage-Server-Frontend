import { describe, expect, it } from 'vitest'
import { applyThemeBackground, updateBackgroundFromTheme } from '../ThemesHelper'
import { getSheetBackgroundStyle } from '../../background/DashboardBackgroundHelper'
import { themeBackwardsCompatibility, themeHasBackground } from '@/modules/managers/dashboardThemeManagement/DashboardThemeHelper'

const themeBackground = { sheetsBackgroundColor: '#eef3f8', imageBackgroundUrl: 'https://example.com/bg.png', imageBackgroundSize: 'cover', sheetsBackgroundStyle: '' }
const ownBackground = () => ({ sheetsBackgroundColor: '#ffffff', imageBackgroundUrl: '', imageBackgroundSize: '', sheetsBackgroundStyle: 'linear-gradient(red, blue)', showGrid: false }) as any
const theme = (id: string, sheetBackground?: any) => ({ id, themeName: id, isDefault: false, config: { sheetBackground } }) as any

describe('themeHasBackground', () => {
    it('is false for a missing or empty background', () => {
        expect(themeHasBackground(undefined)).toBe(false)
        expect(themeHasBackground({ sheetsBackgroundColor: '', imageBackgroundUrl: '', imageBackgroundSize: '', sheetsBackgroundStyle: '' })).toBe(false)
    })

    it('is true when one field is set', () => {
        expect(themeHasBackground({ sheetsBackgroundStyle: 'red' })).toBe(true)
    })
})

describe('themeBackwardsCompatibility', () => {
    it('adds an empty sheet background to an old theme and fills missing fields', () => {
        const oldConfig = {} as any
        themeBackwardsCompatibility(oldConfig)
        expect(oldConfig.sheetBackground).toEqual({ sheetsBackgroundColor: '', imageBackgroundUrl: '', imageBackgroundSize: '', sheetsBackgroundStyle: '' })

        const partialConfig = { sheetBackground: { sheetsBackgroundColor: 'red' } } as any
        themeBackwardsCompatibility(partialConfig)
        expect(partialConfig.sheetBackground).toEqual({ sheetsBackgroundColor: 'red', imageBackgroundUrl: '', imageBackgroundSize: '', sheetsBackgroundStyle: '' })
    })
})

describe('applyThemeBackground', () => {
    it('copies the theme background, connects it and keeps showGrid', () => {
        const background = ownBackground()
        applyThemeBackground(background, theme('t1', themeBackground))
        expect(background).toEqual({ ...themeBackground, showGrid: false, themeId: 't1' })
    })

    it('does nothing for a theme without a background', () => {
        const oldTheme = ownBackground()
        applyThemeBackground(oldTheme, theme('t1'))
        expect(oldTheme).toEqual(ownBackground())

        const emptyTheme = ownBackground()
        applyThemeBackground(emptyTheme, theme('t1', { sheetsBackgroundColor: '', imageBackgroundUrl: '', imageBackgroundSize: '', sheetsBackgroundStyle: '' }))
        expect(emptyTheme).toEqual(ownBackground())
    })

    it('does nothing without a background or a theme', () => {
        expect(() => applyThemeBackground(undefined, theme('t1', themeBackground))).not.toThrow()
        const background = ownBackground()
        applyThemeBackground(background, undefined)
        expect(background).toEqual(ownBackground())
    })
})

describe('updateBackgroundFromTheme', () => {
    it('does nothing for a disconnected background', () => {
        const background = ownBackground()
        updateBackgroundFromTheme(background, [theme('t1', themeBackground)])
        expect(background).toEqual(ownBackground())
    })

    it('copies the current theme background into a connected background', () => {
        const background = { ...ownBackground(), themeId: 't1' }
        updateBackgroundFromTheme(background, [theme('t0', {}), theme('t1', themeBackground)])
        expect(background).toEqual({ ...themeBackground, showGrid: false, themeId: 't1' })
    })

    it('copies an emptied theme background too', () => {
        const background = { ...ownBackground(), themeId: 't1' }
        updateBackgroundFromTheme(background, [theme('t1', { sheetsBackgroundColor: '', imageBackgroundUrl: '', imageBackgroundSize: '', sheetsBackgroundStyle: '' })])
        expect(background).toEqual({ sheetsBackgroundColor: '', imageBackgroundUrl: '', imageBackgroundSize: '', sheetsBackgroundStyle: '', showGrid: false, themeId: 't1' })
    })

    it('keeps the saved values when the theme was deleted', () => {
        const background = { ...ownBackground(), themeId: 'deleted' }
        updateBackgroundFromTheme(background, [theme('t1', themeBackground)])
        expect(background).toEqual({ ...ownBackground(), themeId: 'deleted' })
    })

    it('handles a missing background', () => {
        expect(() => updateBackgroundFromTheme(undefined, [theme('t1', themeBackground)])).not.toThrow()
    })
})

describe('getSheetBackgroundStyle', () => {
    it('uses the CSS value when it is set', () => {
        expect(getSheetBackgroundStyle({ ...themeBackground, sheetsBackgroundStyle: 'red' })).toEqual({ background: 'red', 'min-height': '100%' })
    })

    it('uses the image and the color', () => {
        expect(getSheetBackgroundStyle(themeBackground)).toEqual({ 'background-size': 'cover', 'background-position': 'center', 'background-repeat': 'no-repeat', 'min-height': '100%', 'background-image': "url('https://example.com/bg.png')", 'background-color': '#eef3f8' })
    })

    it('defaults the image size to contain', () => {
        expect(getSheetBackgroundStyle(undefined)).toEqual({ 'background-size': 'contain', 'background-position': 'center', 'background-repeat': 'no-repeat', 'min-height': '100%' })
    })
})
