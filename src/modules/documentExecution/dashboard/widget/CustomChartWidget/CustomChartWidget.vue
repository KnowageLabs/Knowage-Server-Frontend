<template>
    <div :id="'wrapper-' + id" class="wrapper"></div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IDataset, ISelection, IVariable } from '../../Dashboard'
import { mapActions } from 'pinia'
import { IWidget } from '../../Dashboard'
import { updateStoreSelections, executeChartCrossNavigation } from '../interactionsHelpers/InteractionHelper'
import { CustomChartDatastore } from '../WidgetEditor/WidgetEditorSettingsTab/CustomChartWidget/datastore/CustomChartWidgetDatastore'
import { formatForCrossNavigation } from './CustomChartWidgetHelpers'
import store from '../../Dashboard.store'
import appStore from '../../../../../App.store'
import { startHTMLAndCustomChartIFrameInteractions } from '../interactionsHelpers/IFrameInteractionHelper'

export default defineComponent({
    name: 'custom-chart-widget',
    components: {},
    props: {
        propWidget: { type: Object as PropType<IWidget>, required: true },
        widgetData: { type: Object as any, required: true },
        dashboardId: { type: String, required: true },
        propActiveSelections: { type: Array as PropType<ISelection[]>, required: true },
        variables: { type: Array as PropType<IVariable[]>, required: true },
        editorMode: { type: Boolean }
    },
    emits: ['loading', 'datasetInteractionPreview'],
    data() {
        return {
            id: crypto.randomUUID(),
            dataToShow: {} as any,
            activeSelections: [] as ISelection[],
            htmlContent: '' as string,
            webComponentCss: '' as string,
            webComponentJs: '' as string,
            datastore: new CustomChartDatastore(null),
            userScriptsURLs: [] as string[],
            iframeDocument: null as any,
            loadedScriptsCount: 0,
            loading: false
        }
    },
    watch: {
        widgetData() {
            this.loadDataToShow()
        },
        propActiveSelections() {
            this.loadActiveSelections()
        },
        editorMode() {
            this.renderCustomWidget()
        }
    },
    mounted() {
        this.setEventListeners()
        this.loadActiveSelections()
        this.loadWidgetState()
        this.loadDataToShow()
        this.loadProfileAttributesToDatastore()
        this.loadVariablesToDatastore()
    },
    unmounted() {
        this.removeEventListeners()
        this.userScriptsURLs = []
        this.iframeDocument = null
        this.loadedScriptsCount = 0
    },

    methods: {
        ...mapActions(store, ['getInternationalization', 'setSelections', 'getAllDatasets', 'getDashboardDrivers', 'getProfileAttributes', 'getCurrentDashboardView']),
        ...mapActions(appStore, ['setError']),
        setEventListeners() {
            window.addEventListener('message', this.iframeEventsListener)
        },
        removeEventListeners() {
            window.removeEventListener('message', this.iframeEventsListener)
        },
        iframeEventsListener(event: any) {
            if (event.data.type === 'error' && event.data.editorMode === this.editorMode) {
                this.setError({ title: this.$t('common.error.generic'), msg: event.data.error?.message ?? '' })
            } else if (event.data.type === 'clickManager') this.onClickManager(event.data.payload.columnName, event.data.payload.columnValue)
            else if (event.data.type === 'setState') this.onSetState(event.data.payload)
        },
        loadProfileAttributesToDatastore() {
            const profileAttributes = this.getProfileAttributes()
            this.datastore.setProfileAttributes(profileAttributes)
        },
        loadVariablesToDatastore() {
            this.datastore.setVariables(this.variables)
        },
        loadWidgetState() {
            if (this.propWidget.state) this.datastore.state = this.propWidget.state
        },
        async loadDataToShow() {
            this.dataToShow = this.widgetData
            if (this.widgetData) this.datastore.setData(this.widgetData)
            setTimeout(() => {}, 250)
            await this.loadHTML()
        },
        loadActiveSelections() {
            this.activeSelections = this.propActiveSelections
        },
        async loadHTML() {
            this.$emit('loading', true)
            if (!this.propWidget.settings || !this.propWidget.settings.editor) return

            this.htmlContent = this.propWidget.settings.editor.html
            this.webComponentCss = this.propWidget.settings.editor.css
            this.webComponentJs = this.propWidget.settings.editor.js

            this.renderCustomWidget()
            this.$emit('loading', false)
        },
        renderCustomWidget() {
            this.loadedScriptsCount = 0
            const iframe = this.recreateIframeElement()
            setTimeout(() => this.createIframeContent(iframe), 300)
        },
        createIframeContent(iframe: any) {
            this.iframeDocument = iframe.contentWindow.document
            this.iframeDocument.body.innerHTML = `<html>
                <head></head>
                <body>
                    <div id="containerElement">
                    </div>
                </body>
            </html>`

            const containerElement = this.iframeDocument.getElementById('containerElement')
            this.createWrapperDiv(containerElement)
            this.insertUsersHtmlContent()
            this.insertUsersCssContent()
            this.setDatastoreObjectInFrame(iframe)
            iframe.sandbox = 'allow-scripts'
            this.loadUserImportScripts()
        },
        recreateIframeElement() {
            const wrapper = document.getElementById('wrapper-' + this.id) as any
            if (document.getElementById('iframe-' + this.id)) wrapper.innerHTML = ''
            const iframe = document.createElement('iframe') as any
            iframe.id = 'iframe-' + this.id
            iframe.src = 'about:blank'
            iframe.style = 'width: 100%; height: 100%; border: none;'
            if (wrapper) wrapper.appendChild(iframe)
            return iframe
        },
        createWrapperDiv(containerElement: Element) {
            const style = document.createElement('style')
            style.classList.add('style-wrapper')

            const wrapper = document.createElement('div')
            wrapper.classList.add('component-wrapper')
            wrapper.style.position = 'relative'
            wrapper.style.overflow = 'auto'
            wrapper.style.height = '100%'

            wrapper.textContent = ''
            containerElement.appendChild(style)
            containerElement.appendChild(wrapper)
        },
        insertUsersHtmlContent() {
            const tempEl = this.iframeDocument.querySelector('.component-wrapper')
            this.htmlContent = this.htmlContent.replace(/(?:\[kn-i18n='([a-zA-Z0-9_\-\s]*)'\])/gm, (match, g1) => {
                return (this as any).$internationalization(g1) || g1
            })
            if (tempEl) tempEl.innerHTML = this.htmlContent
            this.getUserImportScripts(tempEl)
        },
        getUserImportScripts(componentWrapperElement: any) {
            this.userScriptsURLs = []
            this.addUserScriptsFromLibrariesConfiguration()
            const userImports = componentWrapperElement.getElementsByTagName('kn-import') ?? []
            for (let i = 0; i < userImports.length; i++) {
                if (userImports.item(i)?.attributes?.src?.textContent) {
                    const textContent = userImports.item(i).attributes.src.textContent
                    this.userScriptsURLs.push(textContent)
                }
            }
        },
        addUserScriptsFromLibrariesConfiguration() {
            if (!this.propWidget.settings.configuration?.libraries) return
            this.userScriptsURLs = this.userScriptsURLs.concat(this.propWidget.settings.configuration.libraries)
        },
        insertUsersCssContent() {
            const tempEl = this.iframeDocument.querySelector('.style-wrapper')
            if (tempEl) tempEl.innerHTML = this.webComponentCss
        },
        setDatastoreObjectInFrame(iframe: any) {
            iframe.contentWindow.datastore = this.datastore
        },
        createScriptTagFromUsersJSScript() {
            const userScript = document.createElement('script')
            userScript.text = 'try {' + this.webComponentJs + `\n} catch (error) {window.parent.postMessage({type: 'error', error: error, editorMode: ${this.editorMode}}, '*')}`

            setTimeout(() => {
                this.iframeDocument?.body?.appendChild(userScript)
            }, 1000)
        },
        loadUserImportScripts() {
            if (this.loadedScriptsCount === this.userScriptsURLs.length) this.createScriptTagFromUsersJSScript()
            else this.loadUserImportScript(this.userScriptsURLs[this.loadedScriptsCount])
        },
        loadUserImportScript(scriptURL: string) {
            if (this.isUserScriptAlreadyLoaded(scriptURL)) {
                this.onScriptLoaded()
                return
            }

            const userImportScript = document.createElement('script')
            userImportScript.setAttribute('src', scriptURL)
            userImportScript.async = false
            userImportScript.addEventListener('load', () => this.onScriptLoaded())
            this.setScriptOnErrorListener(userImportScript)
            this.iframeDocument.body.appendChild(userImportScript)
        },
        onScriptLoaded() {
            this.loadedScriptsCount++
            this.loadUserImportScripts()
        },
        isUserScriptAlreadyLoaded(scriptURL: string) {
            let loaded = false
            const loadedScriptElements = this.iframeDocument.getElementsByTagName('script')
            for (let i = 0; i < loadedScriptElements.length; i++) {
                if (loadedScriptElements.item(i).attributes?.src?.textContent == scriptURL) {
                    loaded = true
                    break
                }
            }
            return loaded
        },
        setScriptOnErrorListener(script: any) {
            script.addEventListener('error', () => this.$emit('loading', false))
        },
        onClickManager(columnName: string, columnValue: string | number) {
            if (this.editorMode) return
            if (this.propWidget.settings.interactions.crossNavigation.enabled) {
                const formattedOutputParameters = formatForCrossNavigation(columnValue, this.propWidget.settings.interactions.crossNavigation)
                executeChartCrossNavigation(formattedOutputParameters, this.propWidget.settings.interactions.crossNavigation, this.dashboardId)
            } else if (this.propWidget.settings.interactions.preview.enabled) {
                this.$emit('datasetInteractionPreview', { columnValue: columnValue, previewSettings: this.propWidget.settings.interactions.preview })
            } else if (this.propWidget.settings.interactions.iframe.enabled) {
                startHTMLAndCustomChartIFrameInteractions(columnValue, this.propWidget.settings.interactions.iframe, this.dashboardId, this.variables, window)
            } else {
                if (!columnName) return
                updateStoreSelections(this.createNewSelection([columnValue], columnName), this.activeSelections, this.dashboardId, this.setSelections, this.$http)
            }
        },
        createNewSelection(value: (string | number)[], columnName: string) {
            return { datasetId: this.propWidget.dataset as number, datasetLabel: this.getDatasetLabel(this.propWidget.dataset as number), columnName: columnName, value: value, aggregated: false, timestamp: new Date().getTime() }
        },
        getDatasetLabel(datasetId: number) {
            const datasets = this.getAllDatasets()
            const index = datasets.findIndex((dataset: IDataset) => dataset.id.dsId == datasetId)
            return index !== -1 ? datasets[index].label : ''
        },
        onSetState(state: any) {
            this.datastore.state = state
            const currentState = this.getCurrentDashboardView(this.dashboardId)
            if (currentState && this.propWidget.id) currentState.settings.states[this.propWidget.id] = { type: this.propWidget.type, state: state }
        }
    }
})
</script>

<style lang="scss" scoped>
.wrapper {
    height: 100%;
    width: 100%;
}
</style>
