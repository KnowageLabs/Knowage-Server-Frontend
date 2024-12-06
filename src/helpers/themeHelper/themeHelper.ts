import ThemeHelperDescriptor from '@/helpers/themeHelper/themeHelperDescriptor.json'

export default class themeHelper {
    descriptor = {}

    constructor() {
        this.descriptor = ThemeHelperDescriptor
    }

    setTheme(variables) {
        for (let key in variables) {
            document.documentElement.style.setProperty(key, variables[key])
        }
        if (variables['--kn-button-primary-background-color']) this.setQuasarPreset(variables)
    }

    getDefaultKnowageTheme(): any {
        let defaultTheme = {}

        for (let k in this.descriptor) {
            for (let property of this.descriptor[k].properties) {
                defaultTheme[property.key] = getComputedStyle(document.documentElement).getPropertyValue(property.key).trim()
            }
        }
        this.setQuasarPreset(defaultTheme)

        return defaultTheme
    }

    setQuasarPreset(variables): void {
        document.documentElement.style.setProperty('--q-primary', variables['--kn-button-primary-background-color'])
        document.documentElement.style.setProperty('--q-secondary', variables['--kn-button-secondary-background-color'])
        
    }
}
