class WidgetWebComponent extends HTMLElement {
    widgetType = '' as string

    constructor() {
        super()
    }

    connectedCallback() {
        const shadow = this.attachShadow({ mode: 'open' })
        const style = document.createElement('style')
        style.classList.add('style-wrapper')

        const wrapper = document.createElement('div')
        wrapper.classList.add('component-wrapper')

        wrapper.style.position = 'relative'
        wrapper.style.overflow = 'auto'
        wrapper.style.height = '100%'

        wrapper.textContent = ''
        shadow.appendChild(style)
        shadow.appendChild(wrapper)
    }

    get htmlContent() {
        return this.htmlContent
    }

    set htmlContent(value: string) {
        if (this.shadowRoot) {
            const temp = this.shadowRoot.querySelector('.component-wrapper')
            if (temp) temp.innerHTML = value

            this.setSelectonElementsListeners()
            this.setPreviewElementsListeners()
            this.setCrossNavElementsListeners()
            this.setIframeInteractionsListeners()
        }
    }

    get webComponentCss() {
        return this.webComponentCss
    }

    set webComponentCss(value: string) {
        if (this.shadowRoot) {
            const temp = this.shadowRoot.querySelector('.style-wrapper')
            if (temp) temp.innerHTML = value
        }
    }

    setSelectonElementsListeners = () => {
        const selectionElements = this.shadowRoot?.querySelectorAll('.select-class-temp')
        if (selectionElements)
            selectionElements.forEach((el: any) => {
                el.addEventListener(
                    'click',
                    (event: PointerEvent) => {
                        const eventTarget = event.target as HTMLElement
                        const targetElement = this.findParentWithAttribute(eventTarget, 'kn-selection-column')

                        if (targetElement) {
                            const selectionColumn = targetElement.getAttribute('kn-selection-column')
                            const selectionValue = targetElement.getAttribute('kn-selection-value')
                            this.dispatchEvent(
                                new CustomEvent('selectEvent', {
                                    bubbles: true,
                                    cancelable: false,
                                    composed: true,
                                    detail: { selectionColumn: selectionColumn, selectionValue: selectionValue }
                                })
                            )
                        }
                    },
                    false
                )
            })
    }

    setPreviewElementsListeners = () => {
        const previewElements = this.shadowRoot?.querySelectorAll('.preview-class-temp')
        if (previewElements)
            previewElements.forEach((el: any) => {
                el.addEventListener(
                    'click',
                    (event: PointerEvent) => {
                        const eventTarget = event.target as HTMLElement
                        const targetElement = this.findParentWithAttribute(eventTarget, 'kn-preview')

                        if (targetElement) {
                            const datasetLabel = targetElement.getAttribute('kn-preview')
                            this.dispatchEvent(
                                new CustomEvent('previewEvent', {
                                    bubbles: true,
                                    cancelable: false,
                                    composed: true,
                                    detail: { datasetLabel: datasetLabel }
                                })
                            )
                        }
                    },
                    false
                )
            })
    }

    setCrossNavElementsListeners = () => {
        const crossNavElements = this.shadowRoot?.querySelectorAll('.cross-nav-class-temp')
        if (crossNavElements)
            crossNavElements.forEach((el: any) => {
                el.addEventListener(
                    'click',
                    (event: PointerEvent) => {
                        const eventTarget = event.target as HTMLElement
                        const targetElement = this.findParentWithAttribute(eventTarget, 'kn-cross')

                        if (targetElement) {
                            const crossValue = this.widgetType === 'html' ? targetElement.getAttribute('kn-cross') : targetElement.innerHTML
                            this.dispatchEvent(
                                new CustomEvent('crossNavEvent', {
                                    bubbles: true,
                                    cancelable: false,
                                    composed: true,
                                    detail: { crossValue: crossValue }
                                })
                            )
                        }
                    },
                    false
                )
            })
    }

    setIframeInteractionsListeners = () => {
        const crossNavElements = this.shadowRoot?.querySelectorAll('.iframe-class-temp')
        if (crossNavElements)
            crossNavElements.forEach((el: any) => {
                el.addEventListener(
                    'click',
                    (event: any) => {
                        const eventTarget = event.target as HTMLElement
                        const targetElement = this.findParentWithAttribute(eventTarget, 'kn-message')

                        if (targetElement) {
                            const iframeMessage = targetElement.getAttribute('kn-message')
                            this.dispatchEvent(
                                new CustomEvent('iframeInteractionEvent', {
                                    bubbles: true,
                                    cancelable: false,
                                    composed: true,
                                    detail: { iframeMessage: iframeMessage }
                                })
                            )
                        }
                    },
                    false
                )
            })
    }

    findParentWithAttribute = (element: HTMLElement, attribute: string): HTMLElement | null => {
        while (element) {
            if (element.hasAttribute(attribute)) {
                return element
            }
            element = element.parentElement as HTMLElement
        }
        return null
    }
}

customElements.define('widget-web-component', WidgetWebComponent)

export {}
