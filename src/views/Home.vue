<template>
    <iframe v-if="showIframe" v-show="iframeLoaded" :src="`${completeUrl}`" @load="onIframeLoad"></iframe>
    <div v-if="showDefaultHome" class="homeContainer">
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
import { mapActions, mapState } from 'pinia'
import mainStore from '../App.store.js'
import logo from '/images/commons/logo_knowage_white.svg'

export default defineComponent({
    name: 'home',
    data() {
        return {
            completeUrl: '',
            iframeLoaded: false,
            isManagingGlobalLoading: false,
            logo: logo
        }
    },
    beforeMounted() {
        this.resolveHomeTarget()
    },
    beforeUnmount() {
        this.stopGlobalLoading()
    },
    methods: {
        ...mapActions(mainStore, ['setLoading']),
        async resolveHomeTarget() {
            const router = (this as any).$router
            this.completeUrl = ''
            this.iframeLoaded = false
            this.stopGlobalLoading()

            if (this.homePage?.loading) return

            const homeButtonUrl = this.user?.configuration?.['home.button.url']
            if (homeButtonUrl) {
                this.startGlobalLoading()
                location.replace(homeButtonUrl)
                return
            }

            if (!this.hasConfiguredHomeTarget) return

            this.startGlobalLoading()

            if (this.homePage?.to) {
                const to = this.homePage.to.replaceAll('\\/', '/')
                if (this.isFunctionality(to) || this.isADocument(to)) {
                    await router.replace(to)
                    this.stopGlobalLoading()
                    return
                }

                this.completeUrl = import.meta.env.VITE_HOST_URL + to
            } else {
                this.completeUrl = this.homePage.url
            }
        },
        onIframeLoad() {
            this.iframeLoaded = true
            this.stopGlobalLoading()
        },
        startGlobalLoading() {
            if (!this.isManagingGlobalLoading) {
                this.setLoading(true)
                this.isManagingGlobalLoading = true
            }
        },
        stopGlobalLoading() {
            if (this.isManagingGlobalLoading) {
                this.setLoading(false)
                this.isManagingGlobalLoading = false
            }
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
        }),
        hasConfiguredHomeTarget(): boolean {
            return !!(this.homePage?.url || this.homePage?.to)
        },
        showDefaultHome(): boolean {
            return this.homePage?.loading === false && !this.hasConfiguredHomeTarget && !this.user?.configuration?.['home.button.url']
        },
        showIframe(): boolean {
            return this.homePage?.loading === false && !!this.completeUrl
        }
    },
    watch: {
        homePage: {
            handler() {
                this.resolveHomeTarget()
            },
            deep: true
        },
        user: {
            handler() {
                this.resolveHomeTarget()
            },
            deep: true
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
