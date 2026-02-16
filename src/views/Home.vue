<template>
    <iframe v-if="!homePage.loading && homePage.label && completeUrl" :src="`${completeUrl}`"></iframe>
    <div v-if="!homePage.loading" class="homeContainer">
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
import { mapState } from 'pinia'
import mainStore from '../App.store.js'
import logo from '/images/commons/logo_knowage_white.svg'

export default defineComponent({
    name: 'home',
    data() {
        return {
            completeUrl: false,
            logo: logo
        }
    },
    mounted() {
        if (!this.homePage.loading) {
            this.setCompleteUrl()
        }
    },
    methods: {
        setCompleteUrl() {
            if (this.homePage?.url || this.homePage?.to) {
                this.completeUrl = this.homePage.url
                if (this.homePage.to) {
                    const to = this.homePage.to?.replaceAll('\\/', '/')
                    if (this.isFunctionality(to) || this.isADocument(to) || this.isHTML(to)) this.$router.push(to)
                    else this.completeUrl = import.meta.env.VITE_HOST_URL + this.homePage.to.replaceAll('\\/', '/')
                }
            } else {
                this.completeUrl = false
            }
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
            // Quando la homepage finisce di caricare, imposta l'URL
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
