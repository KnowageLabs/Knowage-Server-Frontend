<template>
    <Dialog class="kn-dialog--toolbar--primary" :visible="visibility" footer="footer" :header="$t('infoDialog.aboutKnowage')" :closable="false" modal>
        <div class="p-grid p-m-1">
            <div class="p-col">
                <div class="p-d-flex p-jc-center">
                    <img :src="`${publicPath}/images/commons/logo_knowage_b.svg`" height="100" />
                </div>
                <p v-if="!configurations || !configurations['KNOWAGE.HIDE_VERSION']">
                    <strong>{{ $t('common.version') }}:</strong> {{ currentVersion }}
                </p>
                <p>
                    <strong>{{ $t('common.loggedUser') }}:</strong> {{ user.fullName }}
                </p>
                <p>
                    <strong>{{ $t('common.tenant') }}:</strong> {{ user.organization }}
                </p>
                <p>{{ $t('infoDialog.sourceCode') }} <a href="https://www.knowage-suite.com">Knowage Suite</a></p>
                <p>{{ $t('infoDialog.copyright', { year: currentYear }) }}</p>
            </div>
        </div>
        <template #footer>
            <Button :label="$t('common.close')" class="kn-button kn-button--primary" @click="closeDialog" />
        </template>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Dialog from 'primevue/dialog'
import { mapState } from 'pinia'
import moment from 'moment'
import mainStore from '../../../App.store.js'

export default defineComponent({
    name: 'info-dialog',
    components: {
        Dialog
    },
    props: {
        visibility: Boolean
    },
    emits: ['update:visibility'],
    data() {
        return {
            currentYear: moment().year(),
            // eslint-disable-next-line no-undef
            currentVersion: import.meta.env.PACKAGE_VERSION,
            publicPath: import.meta.env.VITE_PUBLIC_PATH
        }
    },
    computed: {
        ...mapState(mainStore, {
            user: 'user',
            configurations: 'configurations'
        })
    },
    methods: {
        closeDialog() {
            this.$emit('update:visibility', false)
        }
    }
})
</script>

<style scoped lang="scss">
p {
    text-transform: capitalize;
}
</style>
