<template>
    <Dialog class="kn-dialog--toolbar--primary" :visible="visibility" footer="footer" :header="$t('language.languageSelection')" :closable="false" modal>
        <Listbox class="countryList" :options="languages" option-disabled="disabled">
            <template #option="slotProps">
                <div :class="['p-d-flex', 'p-ai-center', 'countryItem', slotProps.option.locale]" class="p-my-1" @click="changeLanguage(slotProps.option)">
                    <img :alt="slotProps.option.locale" :src="`${publicPath}/images/flags/${slotProps.option.locale.toLowerCase().substring(3, 5)}.svg`" width="40" />
                    <div class="countryLabel">{{ $t(`language.${slotProps.option.locale}`) }}</div>
                    <span class="kn-flex"></span>
                    <i v-if="slotProps.option.locale === $i18n.locale" class="fas fa-check"></i>
                </div>
            </template>
        </Listbox>
        <template #footer>
            <Button class="kn-button kn-button--primary" @click="closeDialog"> {{ $t('common.close') }}</Button>
        </template>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Dialog from 'primevue/dialog'
import Listbox from 'primevue/listbox'
import { mapState, mapActions } from 'pinia'
import mainStore from '@/App.store'
import { loadLanguageAsync } from '@/App.i18n.js'

import { AxiosResponse } from 'axios'

interface Language {
    locale: string
    disabled: boolean | false
}

export default defineComponent({
    name: 'language-dialog',
    components: {
        Dialog,
        Listbox
    },
    props: {
        visibility: Boolean
    },
    emits: ['update:visibility', 'update:loading', 'language-changed'],
    data() {
        return {
            languages: Array<Language>(),
            publicPath: import.meta.env.VITE_PUBLIC_PATH
        }
    },
    computed: {
        ...mapState(mainStore, {
            locale: 'locale'
        })
    },
    watch: {
        visibility(newVisibility) {
            if (newVisibility && this.languages.length == 0) {
                this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/languages').then(
                    (response: AxiosResponse<any>) => {
                        const languagesArray = response.data.sort()

                        for (const idx in languagesArray) {
                            let disabled = false
                            if (languagesArray[idx] === this.$i18n.locale) {
                                disabled = true
                            }
                            this.languages.push({ locale: languagesArray[idx], disabled: disabled })
                        }
                    },
                    (error) => console.error(error)
                )
            }
        }
    },
    methods: {
        ...mapActions(mainStore, ['setLocale']),
        async changeLanguage(language) {
            const tempLanguage = language.locale.replace('_', '-')
            this.$emit('update:loading', true)

            this.setLocale(tempLanguage)
            localStorage.setItem('locale', tempLanguage)
            await loadLanguageAsync(tempLanguage)
            this.$i18n.locale = tempLanguage
            this.closeDialog()
            this.$forceUpdate()

            this.$emit('update:loading', false)
            this.$emit('language-changed', tempLanguage)
        },
        closeDialog() {
            this.$emit('update:visibility', false)
        }
    }
})
</script>

<style scoped lang="scss">
.countryList {
    border: none;
    border-radius: 0;
    min-width: 250px;
    max-height: 100%;

    &:deep(li.p-listbox-item) {
        padding: 0rem 0rem;
        min-height: 46px;
    }

    .countryItem {
        padding: 0.25rem 0.25rem;

        .countryLabel {
            margin: 0 0 0 15px;
        }
    }
}
</style>
