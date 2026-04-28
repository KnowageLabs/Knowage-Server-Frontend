<template>
    <iframe v-if="!homePage.loading && homePage.type === 'dynamic' && dynamicSrcdoc" ref="dynamicHomeFrame" :srcdoc="dynamicSrcdoc" style="border:0;width:100%;height:100%;" @load="bindDynamicHomeFrameInteractions"></iframe>
    <iframe v-else-if="!homePage.loading && homePage.label && completeUrl" :src="`${completeUrl}`"></iframe>
    <div v-if="!homePage.loading && homePage.type !== 'dynamic'" class="homeContainer">
        <div class="upperSection p-d-flex">
            <div class="p-d-flex p-flex-column kn-flex">
                <div class="logo">
                    <img :src="logo" />
                </div>
                <div class="text row">
                    <p class="col-8" v-html="$t('home.welcomeText')"></p>
                </div>
            </div>
            <div class="buttons p-d-flex">
                <a href="https://knowage-suite.readthedocs.io/" target="_blank">{{ $t('home.button.documentation') }}</a>
                <a href="https://github.com/KnowageLabs/Knowage-Server/discussions" target="_blank">{{ $t('home.button.qa') }}</a>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapState, mapActions } from 'pinia'
import mainStore from '../App.store.js'
import logo from '/images/commons/logo_knowage_white.svg'
import axios from '@/axios.js'
import { DYNAMIC_HOME_NAVIGATION_SELECTOR, renderDynamicHomeSrcdoc } from '@/helpers/commons/dynamicHomeHelper'
import { getRouteDocumentType } from '@/helpers/commons/documentRouteHelper'
import { normalizeMenuLocale, normalizeMenuRoute } from '@/helpers/commons/menuHelper'
import type { IMenuNode } from '@/modules/managers/homeManagement/HomeManagement'

interface IEndUserMenuItem {
    menuId?: number | string | null
    label?: string | null
    descr?: string | null
    url?: string | null
    to?: string | null
    items?: IEndUserMenuItem[]
}

interface IDynamicHomeMenuLookup {
    byRoute: Map<string, number | null>
    bySignature: Map<string, number | null>
}

interface IHomepageDocumentNavigation {
    label: string
    routeType: string
}

export default defineComponent({
    name: 'home',
    data() {
        return {
            completeUrl: false as string | false,
            logo: logo,
            dynamicSrcdoc: '' as string,
            dynamicMenuNodes: [] as IMenuNode[],
            dynamicHomeFrameDocument: null as Document | null,
            dynamicHomeSyntheticMenuId: -1 as number
        }
    },
    mounted() {
        this.loadHomePage()
    },
    unmounted() {
        this.unbindDynamicHomeFrameInteractions()
    },
    methods: {
        ...mapActions(mainStore, ['setHomePage']),
        bindDynamicHomeFrameInteractions() {
            this.unbindDynamicHomeFrameInteractions()
            const dynamicHomeFrame = this.$refs.dynamicHomeFrame as HTMLIFrameElement | undefined
            const dynamicHomeFrameDocument = dynamicHomeFrame?.contentDocument
            if (!dynamicHomeFrameDocument) return

            dynamicHomeFrameDocument.addEventListener('click', this.onDynamicHomeDocumentClick)
            dynamicHomeFrameDocument.addEventListener('keydown', this.onDynamicHomeDocumentKeydown)
            this.dynamicHomeFrameDocument = dynamicHomeFrameDocument
        },
        unbindDynamicHomeFrameInteractions() {
            if (!this.dynamicHomeFrameDocument) return

            this.dynamicHomeFrameDocument.removeEventListener('click', this.onDynamicHomeDocumentClick)
            this.dynamicHomeFrameDocument.removeEventListener('keydown', this.onDynamicHomeDocumentKeydown)
            this.dynamicHomeFrameDocument = null
        },
        onDynamicHomeDocumentClick(event: MouseEvent) {
            const target = this.getDynamicHomeNavigationElement(event.target)
            if (!target) return

            event.preventDefault()
            this.navigateDynamicHomeElement(target)
        },
        onDynamicHomeDocumentKeydown(event: KeyboardEvent) {
            if (event.key !== 'Enter' && event.key !== ' ') return

            const target = this.getDynamicHomeNavigationElement(event.target)
            if (!target) return

            event.preventDefault()
            this.navigateDynamicHomeElement(target)
        },
        getDynamicHomeNavigationElement(target: EventTarget | null): Element | null {
            if (!(target instanceof Element)) return null
            return target.closest(DYNAMIC_HOME_NAVIGATION_SELECTOR)
        },
        navigateDynamicHomeElement(element: Element) {
            const navigationType = element.getAttribute('data-kn-menu-navigation-type')
            const navigationTarget = element.getAttribute('data-kn-menu-navigation')
            if (!navigationType || !navigationTarget) return

            if (navigationType === 'to') {
                this.$router.push(normalizeMenuRoute(navigationTarget))
                return
            }

            if (navigationType === 'url') {
                this.$router.push({ name: 'externalUrl', query: { url: navigationTarget } })
            }
        },
        resolveRoleName(): string | null {
            if (this.user.defaultRole) return this.user.defaultRole
            const raw: string = this.user.attributes?.roles ?? ''
            // format may be "'role1','role2'" — strip quotes and split
            const first = raw.split(',')[0]?.replace(/'/g, '').trim()
            return first || null
        },
        resolveMenuLocale(): string {
            const fallbackLocale = this.$i18n.fallbackLocale.toString()
            const currentLocale = localStorage.getItem('locale') || this.locale || fallbackLocale
            return normalizeMenuLocale(currentLocale, fallbackLocale)
        },
        getDynamicHomeRouteKey(to: string | null | undefined, url: string | null | undefined): string {
            const normalizedTo = normalizeMenuRoute(to)
            const normalizedUrl = url?.trim() ?? ''
            return normalizedTo || normalizedUrl ? `${normalizedTo}|${normalizedUrl}` : ''
        },
        getDynamicHomeSignature(label: string | null | undefined, path: string[]): string {
            return [...path, (label ?? '').trim().toLowerCase()].join('>')
        },
        registerDynamicHomeLookupValue(lookup: Map<string, number | null>, key: string, menuId: number) {
            if (!key) return

            if (!lookup.has(key)) {
                lookup.set(key, menuId)
                return
            }

            if (lookup.get(key) !== menuId) lookup.set(key, null)
        },
        buildDynamicHomePreviewLookup(previewNodes: IMenuNode[]): IDynamicHomeMenuLookup {
            const lookup: IDynamicHomeMenuLookup = {
                byRoute: new Map<string, number | null>(),
                bySignature: new Map<string, number | null>()
            }

            const visit = (nodes: IMenuNode[], path: string[] = []) => {
                nodes.forEach((node) => {
                    const label = (node.descr || node.name || '').trim()
                    this.registerDynamicHomeLookupValue(lookup.byRoute, this.getDynamicHomeRouteKey(node.to, node.url), node.menuId)
                    this.registerDynamicHomeLookupValue(lookup.bySignature, this.getDynamicHomeSignature(label, path), node.menuId)
                    const children = node.lstChildren?.length ? node.lstChildren : (node.children ?? [])
                    visit(children, label ? [...path, label.toLowerCase()] : path)
                })
            }

            visit(previewNodes)
            return lookup
        },
        getNextDynamicHomeSyntheticMenuId(): number {
            const nextId = this.dynamicHomeSyntheticMenuId
            this.dynamicHomeSyntheticMenuId--
            return nextId
        },
        resolveDynamicHomeMenuId(menuItem: IEndUserMenuItem, lookup: IDynamicHomeMenuLookup, path: string[]): number {
            const explicitMenuId = Number(menuItem.menuId)
            if (Number.isInteger(explicitMenuId) && explicitMenuId > 0) return explicitMenuId

            const label = menuItem.descr || menuItem.label || ''
            const signatureMatch = lookup.bySignature.get(this.getDynamicHomeSignature(label, path))
            if (signatureMatch !== undefined && signatureMatch !== null) return signatureMatch

            const routeMatch = lookup.byRoute.get(this.getDynamicHomeRouteKey(menuItem.to, menuItem.url))
            if (routeMatch !== undefined && routeMatch !== null) return routeMatch

            return this.getNextDynamicHomeSyntheticMenuId()
        },
        buildDynamicHomeMenuNodes(menuItems: IEndUserMenuItem[] = [], lookup: IDynamicHomeMenuLookup, path: string[] = []): IMenuNode[] {
            return menuItems.map((menuItem) => {
                const label = (menuItem.label || menuItem.descr || '').trim()
                const nextPath = label ? [...path, label.toLowerCase()] : path

                return {
                    menuId: this.resolveDynamicHomeMenuId(menuItem, lookup, path),
                    name: label,
                    descr: menuItem.descr ?? (label || null),
                    url: menuItem.url ?? null,
                    to: menuItem.to ?? null,
                    linkType: null,
                    children: this.buildDynamicHomeMenuNodes(menuItem.items ?? [], lookup, nextPath)
                }
            })
        },
        async resolveHomepageDocumentNavigation(config: any): Promise<IHomepageDocumentNavigation | null> {
            const configLabel = (config?.documentLabel ?? '').trim()
            const persistedRouteType = getRouteDocumentType(config)
            if (configLabel && persistedRouteType) return { label: configLabel, routeType: persistedRouteType }

            const documentIdentifier = config?.documentId ?? configLabel
            if (!documentIdentifier) return null

            try {
                const response = await axios.get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/documents/' + documentIdentifier, { headers: { 'X-Disable-Errors': 'true' } })
                const routeType = getRouteDocumentType(response.data)
                const label = response.data?.label ?? configLabel
                if (!label || !routeType) return null

                return { label, routeType }
            } catch {
                return null
            }
        },
        async loadHomePage() {
            // Resolve numeric roleId from role name
            let roleId: number | null = null
            try {
                const roleName = this.resolveRoleName()
                const rolesRes = await axios.get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/roles')
                const matched = rolesRes.data.find((r: any) => r.name === roleName)
                if (matched) roleId = matched.id
            } catch (e) {
                // ignore, fall back to default
            }

            const fetchConfig = async (id: number | string) => {
                const res = await axios.get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/homepage/' + id, { headers: { 'X-Disable-Errors': 'true' } })
                return res.data
            }

            let config: any = null
            try {
                config = await fetchConfig(roleId ?? 'default')
            } catch (e) {
                if (roleId !== null) {
                    try { config = await fetchConfig('default') } catch (e2) { /* ignore */ }
                }
            }

            const homePage: any = { loading: false }
            if (config && config.type && config.type !== 'default') {
                homePage.roleId = roleId
                switch (config.type) {
                    case 'document': {
                        const documentNavigation = await this.resolveHomepageDocumentNavigation(config)
                        if (documentNavigation) {
                            homePage.label = documentNavigation.label
                            homePage.to = `/${documentNavigation.routeType}/${documentNavigation.label}`
                            homePage.documentRouteType = documentNavigation.routeType
                        } else if (config.documentLabel) homePage.label = config.documentLabel
                        break
                    }
                    case 'static':
                        homePage.label = config.staticPage
                        homePage.url = import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/menu/htmls/' + config.staticPage
                        break
                    case 'image':
                        homePage.label = config.imageUrl
                        homePage.url = config.imageUrl
                        break
                    case 'dynamic':
                        homePage.label = 'dynamic'
                        homePage.type = 'dynamic'
                        homePage.template = config.template
                        break
                }
            }

            this.setHomePage(homePage)
        },
        async setCompleteUrl() {
            if (this.homePage?.type === 'dynamic') {
                await this.buildDynamicSrcdoc()
                return
            }
            this.unbindDynamicHomeFrameInteractions()
            this.dynamicSrcdoc = ''
            this.dynamicMenuNodes = []
            if (this.homePage?.url || this.homePage?.to) {
                this.completeUrl = this.homePage.url
                if (this.homePage.to) {
                    const to = normalizeMenuRoute(this.homePage.to)
                    // @ts-ignore
                    if (this.isFunctionality(to) || this.isADocument(to) || this.isHTML(to)) this.$router.push(to)
                    else this.completeUrl = import.meta.env.VITE_HOST_URL + this.homePage.to.replaceAll('\\/', '/')
                }
            } else {
                this.completeUrl = false
            }
        },
        async buildDynamicSrcdoc() {
            const template = this.homePage.template
            if (!template) {
                this.dynamicSrcdoc = ''
                this.dynamicMenuNodes = []
                return
            }

            this.unbindDynamicHomeFrameInteractions()
            const roleSegment = this.homePage.roleId ?? 'default'
            const [endUserRes, previewRes] = await Promise.all([
                axios.get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/3.0/menu/enduser?locale=' + encodeURIComponent(this.resolveMenuLocale())),
                axios.get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/menu/preview/' + roleSegment)
            ])

            const lookup = this.buildDynamicHomePreviewLookup(Array.isArray(previewRes.data) ? previewRes.data : [])
            this.dynamicHomeSyntheticMenuId = -1
            this.dynamicMenuNodes = this.buildDynamicHomeMenuNodes(endUserRes.data?.dynamicUserFunctionalities ?? [], lookup)
            this.dynamicSrcdoc = renderDynamicHomeSrcdoc(template, this.dynamicMenuNodes, import.meta.env.VITE_PUBLIC_PATH || '')
        },
        isHTML(to: string): boolean {
            return to.startsWith('/html')
        },
        isFunctionality(to: string): boolean {
            return to.startsWith('/document-browser') || to.startsWith('/workspace')
        },
        isADocument(to: string): boolean {
            return (
                to.startsWith('/registry/') ||
                to.startsWith('/dashboard/') ||
                to.startsWith('/dossier/') ||
                to.startsWith('/map/') ||
                to.startsWith('/kpi/') ||
                to.startsWith('/office-doc/') ||
                to.startsWith('/document-composite/') ||
                to.startsWith('/report/') ||
                to.startsWith('/olap/') ||
                to.startsWith('/etl/')
            )
        }
    },
    computed: {
        ...mapState(mainStore, {
            homePage: 'homePage',
            user: 'user',
            locale: 'locale'
        })
    },
    watch: {
        'homePage.loading'(newLoading, oldLoading) {
            if (oldLoading === true && newLoading === false) {
                this.setCompleteUrl()
            }
        }
    }
})
</script>

<style lang="scss" scoped>
$knowageBlueColor: #042d5f;
.homeContainer {
    height: 100vh;
    padding: 64px;
    background: url('/images/home/home-background.jpg') no-repeat;
    background-size: cover;
    display: flex;
    flex-direction: column;

    .upperSection {
        flex-wrap: wrap;
        align-items: center;
        .logo {
            width: 40%;
            min-width: 400px;
            img {
                width: 100%;
            }
        }
        .buttons {
            flex-direction: column;
            a {
                width: 300px;
                height: 60px;
                line-height: 60px;
                text-transform: capitalize;
                text-decoration: none;
                font-weight: bold;
                font-size: 1rem;
                color: black;
                text-align: center;
                background-color: white;
                margin-bottom: 20px;
                transition: all 0.3s ease-in;
                &:hover {
                    background-color: var(--kn-color-fab);
                    color: white;
                }
            }
        }
        .text {
            margin-top: 5%;
            p {
                font-size: 2rem;
                font-weight: 100;
                color: white;
            }
        }
    }
    .upperSection,
    .lowerSection {
        flex: 1;
    }
}

@media screen and (max-width: 1200px) {
    .homeContainer {
        .upperSection {
            .text {
                h2 {
                    font-size: 1.6rem;
                }
                p {
                    font-size: 1.1rem;
                }
            }
        }
    }
}
@media screen and (max-width: 1000px) {
    .homeContainer {
        .upperSection {
            .buttons {
                flex-direction: row;
                width: 100%;
                justify-content: space-around;
                margin-top: 20px;
            }
        }

        .lowerSection {
            .border-container {
                border: 0;
                flex-wrap: wrap;
                .image {
                    width: 40%;
                    margin: 20px 5%;
                }
            }
        }
    }
}
@media screen and (max-width: 800px) {
    .homeContainer {
        padding: 16px;
        .upperSection {
            .buttons {
                flex-direction: column;
                align-items: center;
            }
        }
        .lowerSection {
            .border-container {
                border: 0;
                flex-wrap: wrap;
                .image {
                    width: 80%;
                    margin: 20px 10%;
                }
            }
        }
    }
}

iframe {
    border: 0;
    width: 100%;
    height: 100%;
}
</style>
