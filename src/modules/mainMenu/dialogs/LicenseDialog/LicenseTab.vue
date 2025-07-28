<template>
    <div id="host-info" data-test="host-info">
        <div id="host-labels">
            <p>{{ $t('licenseDialog.hostName') }}:</p>
            <p>{{ $t('licenseDialog.hardwareId') }}:</p>
            <p>{{ $t('licenseDialog.numberOfCpu') }}:</p>
            <p>{{ $t('licenseDialog.adminsCreated') }}:</p>
            <p>{{ $t('licenseDialog.usersCreated') }}:</p>
        </div>
        <div id="host-values">
            <p>{{ selectedHost.hostName }}</p>
            <p id="hardwareId">{{ selectedHost.hardwareId }}</p>
            <p>{{ cpunumber }}</p>
            <p>{{ `${adminUsersCreated}/${maxAdminUsers}` }}</p>
            <p>{{ `${endUsersCreated}/${maxEndUsers}` }}</p>
        </div>
    </div>
    <Toolbar class="kn-toolbar--transparent p-mb-2">
        <template #end>
            <FabButton v-tooltip.top="$t('licenseDialog.dataRequired')" icon="fas fa-plus" :style="licenseDialogDescriptor.fabButton.style" data-test="new-button" @click="setUploadType('', false)" />
            <KnInputFile v-if="!uploading" label="" :change-function="uploadLicense" accept=".lic" :trigger-input="triggerUpload" />
        </template>
    </Toolbar>
    <q-list class="rounded-borders" bordered>
        <q-item v-for="(license, index) in licensesList" :key="index">
            <q-item-section avatar class="col-1">
                <q-avatar :label="license.product" square>
                    <img :src="`${publicPath}/images/licenseImages/${license.product}.png`" />
                </q-avatar>
            </q-item-section>
            <q-item-section class="col-3 q-pl-xs">
                <span class="text-sm">{{ license.product }}</span>
                <span class="text-sm" :class="setLicenseClass(license.status)">{{ licenseText(license.status) }}</span>
            </q-item-section>
            <q-item-section class="col-6 flex flex-row items-center justify-center">
                <span>{{ $t('licenseDialog.licenseId') }}:</span>
                <span>{{ license.licenseId }}</span>
            </q-item-section>
            <q-item-section class="col-2" side>
                <div class="flex flex-row items-center justify-center gap-2">
                    <q-btn v-tooltip.top="$t('licenseDialog.updateLicense')" class="gt-xs" size="12px" flat dense round icon="upload" @click="setUploadType(license.product, true)" />
                    <q-btn v-tooltip.top="$t('common.delete')" class="gt-xs" size="12px" flat dense round icon="delete" @click="showDeleteDialog(license.product)" />
                </div>
            </q-item-section>
        </q-item>
    </q-list>
    <Dialog v-model:visible="displayWarning" header="Error">
        <p>{{ errorMessage }}</p>
        <template #footer>
            <Button label="Ok" icon="pi pi-check" @click="displayWarning = false" />
        </template>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent, pushScopeId } from 'vue'
import { iLicense, iHost } from './License'
import licenseDialogDescriptor from './LicenseDialogDescriptor.json'
import { AxiosResponse } from 'axios'
import Avatar from 'primevue/avatar'
import Dialog from 'primevue/dialog'
import KnInputFile from '@/components/UI/KnInputFile.vue'
import FabButton from '@/components/UI/KnFabButton.vue'
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
        maxAdminUsers: {
            type: Number,
            default: 0
        },
        maxEndUsers: {
          type: Number,
          default: 0
        },
        adminUsersCreated: {
          type: Number,
          default: 0
        },
        endUsersCreated: {
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
            errorMessage: '',
            publicPath: import.meta.env.VITE_PUBLIC_PATH
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
    margin: 20px auto 0;
    width: 80%;
    display: flex;
    flex-direction: row;
}
#host-labels {
    flex: 0 0 auto;
    margin-left: 1rem;
}


#host-values {
  flex: 1;
  min-width: 0;
}


#host-info p {
    margin: 0;
}

#hardwareId {
    word-break: break-all;
}
</style>
