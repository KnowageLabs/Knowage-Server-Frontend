<template>
    <div id="host-info" data-test="host-info">
        <div id="host-labels">
            <p>{{ $t('licenseDialog.hostName') }}:</p>
            <p>{{ $t('licenseDialog.hardwareId') }}:</p>
            <p>{{ $t('licenseDialog.numberOfCpu') }}:</p>
        </div>
        <div>
            <p>{{ selectedHost.hostName }}</p>
            <p id="hardwareId">{{ selectedHost.hardwareId }}</p>
            <p>{{ cpunumber }}</p>
        </div>
    </div>
    <Toolbar class="kn-toolbar--transparent p-mb-2">
        <template #end>
            <FabButton v-tooltip.top="$t('licenseDialog.dataRequired')" icon="fas fa-plus" :style="licenseDialogDescriptor.fabButton.style" data-test="new-button" @click="setUploadType('', false)" />
            <KnInputFile v-if="!uploading" label="" :change-function="uploadLicense" accept=".lic" :trigger-input="triggerUpload" />
        </template>
    </Toolbar>
    <Listbox class="kn-list--column kn-list-no-border-right" :style="licenseDialogDescriptor.list.style" :options="licensesList">
        <template #empty>{{ $t('licenseDialog.noLicenses') }}</template>
        <template #option="slotProps">
            <div class="kn-list-item" data-test="list-item">
                <Avatar :image="`./images/licenseImages/${slotProps.option.product}.png`" size="medium" />
                <div class="kn-list-item-text">
                    <span>{{ slotProps.option.product }}</span>
                    <span class="kn-list-item-text-secondary" :class="setLicenseClass(slotProps.option.status)">{{ licenseText(slotProps.option.status) }}</span>
                </div>
                <div class="kn-list-item-text">
                    <span class="kn-list-item-text-secondary">{{ $t('licenseDialog.licenseId') }}:</span>
                    <span>{{ slotProps.option.licenseId }}</span>
                </div>
                <Button v-tooltip.top="$t('licenseDialog.changeLicense')" icon="pi pi-pencil" class="p-button-link" data-test="edit-button" @click="setUploadType(slotProps.option.product, true)" />
                <Button v-tooltip.top="$t('licenseDialog.deleteLicense')" icon="pi pi-trash" class="p-button-link" data-test="delete-button" @click="showDeleteDialog(slotProps.option.product)" />
            </div>
        </template>
    </Listbox>
    <Dialog v-model:visible="displayWarning" header="Error">
        <p>{{ errorMessage }}</p>
        <template #footer>
            <Button label="Ok" icon="pi pi-check" @click="displayWarning = false" />
        </template>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { iLicense, iHost } from './License'
import licenseDialogDescriptor from './LicenseDialogDescriptor.json'
import { AxiosResponse } from 'axios'
import Avatar from 'primevue/avatar'
import Dialog from 'primevue/dialog'
import KnInputFile from '@/components/UI/KnInputFile.vue'
import FabButton from '@/components/UI/KnFabButton.vue'
import Listbox from 'primevue/listbox'
import Tooltip from 'primevue/tooltip'
import auth from '@/helpers/commons/authHelper'
import mainStore from '../../../../App.store'
import { mapActions } from 'pinia'

export default defineComponent({
    name: 'license-tab',
    components: {
        Avatar,
        Dialog,
        FabButton,
        Listbox,
        KnInputFile
    },
    directives: {
        tooltip: Tooltip
    },
    props: {
        cpunumber: {
            type: Number,
            default: 0
        },
        licenses: {
            type: Array,
            required: true
        },
        host: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            licenseDialogDescriptor,
            licensesList: [] as iLicense[],
            selectedHost: {} as iHost,
            triggerUpload: false,
            displayWarning: false,
            existingLicenseName: '',
            isForUpdate: Boolean as any,
            uploading: false,
            errorMessage: ''
        }
    },
    watch: {
        licenses() {
            this.loadLicenses()
        },
        host() {
            this.loadHost()
        }
    },
    created() {
        this.loadLicenses()
        this.loadHost()
    },
    methods: {
        ...mapActions(mainStore, ['setError', 'setInfo', 'updateLicense']),
        logout() {
            auth.logout()
        },
        loadLicenses() {
            this.licensesList = this.licenses as iLicense[]
        },
        loadHost() {
            this.selectedHost = { ...this.host } as iHost
        },
        setLicenseClass(status: string) {
            return status === 'LICENSE_VALID' ? 'kn-text-success' : 'kn-text-error'
        },
        licenseText(status: string) {
            return status === 'LICENSE_VALID' ? this.$t('licenseDialog.validLicense') : this.$t('licenseDialog.invalidLicense')
        },

        setUploadType(productName, value) {
            this.triggerUpload = false
            this.isForUpdate = value
            this.existingLicenseName = productName
            setTimeout(() => (this.triggerUpload = true), 200)
        },
        uploadLicense(event) {
            this.uploading = true
            const uploadedFiles = event.target.files[0]
            if (this.isForUpdate && !uploadedFiles.name.includes(this.existingLicenseName)) {
                this.errorMessage = this.$t('licenseDialog.wrongType')
                this.displayWarning = true
                this.triggerUpload = false
            } else {
                this.startUpload(uploadedFiles)
            }
            this.triggerUpload = false
            setTimeout(() => (this.uploading = false), 200)
        },
        async startUpload(uploadedFiles) {
            const formData = new FormData()
            formData.append('file', uploadedFiles)
            await this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/license/upload` + `/${this.selectedHost.hostName}` + `?isForUpdate=${this.isForUpdate}`, formData)
                .then((response: AxiosResponse<any>) => {
                    this.setInfo({
                        title: this.$t('common.uploading'),
                        msg: this.$t('importExport.import.successfullyCompleted')
                    })

                    this.updateLicense({ hostName: this.selectedHost.hostName, license: response.data })
                })
                .catch((response) => {
                    if (response.message == 'error.message.license.exists') {
                        this.setError({
                            title: this.$t('common.uploading'),
                            msg: this.$t('licenseDialog.errorExists')
                        })
                    } else {
                        this.setError({
                            title: this.$t('common.uploading'),
                            msg: response.message
                        })
                    }
                })
                .finally(() => (this.triggerUpload = false))
        },

        showDeleteDialog(licenseName) {
            this.$confirm.require({
                message: this.$t('licenseDialog.warningBeforeDelete'),
                header: this.$t('common.toast.deleteConfirmTitle'),
                icon: 'pi pi-exclamation-triangle',
                accept: () => this.deleteLicense(licenseName)
            })
        },
        async deleteLicense(licenseName) {
            await this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/license/delete` + `/${this.selectedHost.hostName}/` + licenseName, {
                    headers: {
                        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9'
                    }
                })
                .then((response: AxiosResponse<any>) => {
                    if (response.data.errors) {
                        this.setError({
                            title: this.$t('licenseDialog.errorLicense'),
                            msg: this.$t('licenseDialog.errorMessage')
                        })
                    } else {
                        this.setInfo({
                            title: this.$t('common.toast.deleteTitle'),
                            msg: this.$t('common.toast.deleteSuccess')
                        })
                        this.$emit('reloadList')
                    }
                })
                .finally(() => this.logout())
        }
    }
})
</script>

<style scoped>
#host-info {
    font-size: 0.7rem;
    padding: 0.5rem;
    border: 1px solid rgba(59, 103, 140, 0.1);
    background-color: #eaf0f6;
    margin: 0 auto;
    width: 80%;
    display: flex;
    flex-direction: row;
}
#host-labels {
    flex: 0.7;
    margin-left: 1rem;
}

#host-info p {
    margin: 0;
}

#hardwareId {
    word-break: break-all;
}
</style>
