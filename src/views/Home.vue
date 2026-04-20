<template>
    <iframe v-if="!homePage.loading && homePage.type === 'dynamic' && dynamicSrcdoc" :srcdoc="dynamicSrcdoc" style="border:0;width:100%;height:100%;"></iframe>
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

export default defineComponent({
    name: 'home',
    data() {
        return {
            completeUrl: false as string | false,
            logo: logo,
            dynamicSrcdoc: '' as string,
            dynamicMenuNodes: [] as any[]
        }
    },
    mounted() {
        this.loadHomePage()
    },
    methods: {
        ...mapActions(mainStore, ['setHomePage']),
        resolveRoleName(): string | null {
            if (this.user.defaultRole) return this.user.defaultRole
            const raw: string = this.user.attributes?.roles ?? ''
            // format may be "'role1','role2'" — strip quotes and split
            const first = raw.split(',')[0]?.replace(/'/g, '').trim()
            return first || null
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
                const res = await axios.get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/homepage/' + id)
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
                    case 'document':
                        homePage.label = config.documentLabel
                        homePage.to = '/document-composite/execute?label=' + config.documentLabel
                        break
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
            if (this.homePage?.url || this.homePage?.to) {
                this.completeUrl = this.homePage.url
                if (this.homePage.to) {
                    const to = this.homePage.to?.replaceAll('\\/', '/')
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
            if (!template) return
            const roleSegment = this.homePage.roleId ?? 'default'
            try {
                const res = await axios.get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/menu/preview/' + roleSegment)
                this.dynamicMenuNodes = res.data
            } catch (e) {
                this.dynamicMenuNodes = []
            }
            this.dynamicSrcdoc = this.computeDynamicSrcdoc(template)
        },
        computeDynamicSrcdoc(template: any): string {
            const allFlat = this.flattenNodes(this.dynamicMenuNodes)
            let html = template.html || ''
            let phIdx = 0
            html = html.replace(/(<([a-zA-Z][a-zA-Z0-9]*)(\s[^>]*)?\sdata-kn-menu(\s[^>]*)?>)([\s\S]*?)(<\/\2>)/g, (_m: string, openFull: string, _tag: string, _pre: string, _post: string, inner: string, close: string) => {
                const ph = template.menuPlaceholders?.[phIdx]
                phIdx++
                if (!allFlat.length) return ''
                const selectedNodes = allFlat.filter((n: any) => ph?.menuIds?.includes(n.menuId))
                if (!selectedNodes.length) return ''
                return selectedNodes.map((node: any) => {
                    let cloneOpen = openFull.replace(/\sdata-kn-menu(\s|=|>)/, ' ')
                    cloneOpen = cloneOpen.replace(/href="[^"]*"/, `href="${this.resolveNodeUrl(node)}"`)
                    let cloneInner = inner.replace(/data-kn-label[^<]*/, `data-kn-label>${node.descr || node.name}`)
                    if (!cloneInner.includes('data-kn-label') && cloneInner.trim()) cloneInner = node.descr || node.name || ''
                    return `${cloneOpen}${cloneInner}${close}`
                }).join('\n')
            })
            return `<style>${template.css || ''}</style>\n${html}`
        },
        flattenNodes(nodes: any[]): any[] {
            const result: any[] = []
            const walk = (items: any[]) => {
                for (const n of items) {
                    result.push(n)
                    const children = n.lstChildren?.length ? n.lstChildren : (n.children ?? [])
                    if (children.length) walk(children)
                }
            }
            walk(nodes)
            return result
        },
        resolveNodeUrl(node: any): string {
            if (node.to) return (import.meta.env.VITE_PUBLIC_PATH || '') + node.to.replace(/\\\//g, '/')
            if (node.url) return node.url
            return '#'
        },
        isHTML(to: string): boolean {
            return to.startsWith('/html')
        },
        isFunctionality(to: string): boolean {
            return to.startsWith('/document-browser') || to.startsWith('/workspace')
        },
        isADocument(to: string): boolean {
            return to.startsWith('/dossier/') || to.startsWith('/map/') || to.startsWith('/kpi/') || to.startsWith('/office-doc/') || to.startsWith('/document-composite/')
        }
    },
    computed: {
        ...mapState(mainStore, {
            homePage: 'homePage',
            user: 'user'
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
