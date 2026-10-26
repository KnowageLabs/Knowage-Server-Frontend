<template>
    <q-layout view="hHh lpR fFf" container style="height: 100%; overflow: hidden">
        <q-page-container>
            <q-page class="row" style="position: unset">
                <q-drawer v-model="drawerVisible" side="left" :width="300" :breakpoint="0" show-if-above class="column no-wrap">
                    <q-toolbar class="kn-toolbar kn-toolbar--primary">
                        <q-toolbar-title>{{ $t('managers.scheduler.title') }}</q-toolbar-title>
                        <q-btn flat round dense icon="add" data-tour-id="scheduler-add" data-test="new-button" @click="showJobDetail(null, false)">
                            <q-tooltip :delay="500">{{ $t('common.add') }}</q-tooltip>
                        </q-btn>
                    </q-toolbar>
                    <q-linear-progress v-if="loading" indeterminate color="primary" />
                    <div class="scheduler-list column no-wrap col" data-tour-id="scheduler-list">
                        <div class="scheduler-list__search">
                            <q-input v-model="filter" outlined dense clearable :placeholder="$t('common.search')" data-test="search-input">
                                <template #append><q-icon name="search" /></template>
                            </q-input>
                        </div>
                        <q-scroll-area class="col scheduler-list__items">
                            <q-list separator>
                                <q-item v-for="job in filteredJobs" :key="job.jobName" clickable :active="isActive(job)" active-class="scheduler-list__item--active" class="scheduler-list__item" @click="showJobDetail(job, false)">
                                    <q-item-section avatar>
                                        <q-avatar size="2rem" class="scheduler-list__avatar" icon="schedule" font-size="1rem" />
                                    </q-item-section>
                                    <q-item-section>
                                        <q-item-label class="ellipsis" :title="job.jobName">{{ job.jobName }}</q-item-label>
                                        <q-item-label caption lines="1">{{ job.jobDescription }}</q-item-label>
                                    </q-item-section>
                                    <q-item-section side class="row no-wrap items-center">
                                        <div class="row no-wrap">
                                            <q-btn flat round dense size="sm" icon="content_copy" class="kn-editor-action" @click.stop="showJobDetail(job, true)">
                                                <q-tooltip :delay="500">{{ $t('common.clone') }}</q-tooltip>
                                            </q-btn>
                                            <q-btn flat round dense size="sm" icon="delete" class="kn-editor-action" @click.stop="deleteJobConfirm(job)">
                                                <q-tooltip :delay="500">{{ $t('common.delete') }}</q-tooltip>
                                            </q-btn>
                                        </div>
                                    </q-item-section>
                                </q-item>
                                <q-item v-if="!loading && filteredJobs.length === 0">
                                    <q-item-section class="text-grey-6">{{ $t('common.info.noDataFound') }}</q-item-section>
                                </q-item>
                            </q-list>
                        </q-scroll-area>
                    </div>
                </q-drawer>

                <div class="col relative-position">
                    <div class="absolute-full column no-wrap">
                        <router-view v-slot="{ Component }">
                            <component :is="Component" ref="detail" :selected-job="selectedJob" :datasets="datasets" :drawer-visible="drawerVisible" @dirty-change="(value: boolean) => (detailDirty = value)" @document-saved="loadSelectJob" @close="closeDetail" @trigger-saved="loadPage" @toggle-drawer="drawerVisible = !drawerVisible" />
                        </router-view>
                    </div>
                </div>
            </q-page>
        </q-page-container>
    </q-layout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import axios, { AxiosResponse } from 'axios'
import deepcopy from 'deepcopy'
import { iPackage } from './Scheduler'
import { usePageTour } from '@/composables/usePageTour'
import { startSchedulerTour } from './SchedulerTour'
import mainStore from '../../../App.store'

const store = mainStore()
const { t } = useI18n()
const $q = useQuasar()
const route = useRoute()
const router = useRouter()

const jobs = ref<iPackage[]>([])
const selectedJob = ref<iPackage | null>(null)
const datasets = ref<any[]>([])
const loading = ref(false)
const filter = ref<string | null>('')
const drawerVisible = ref(true)
const detailDirty = ref(false)
const detail = ref<any>(null)

const filteredJobs = computed(() => {
    const term = (filter.value ?? '').trim().toLowerCase()
    if (!term) return jobs.value
    return jobs.value.filter((job: iPackage) => [job.jobName, job.jobDescription, ...(job.documents ?? []).map((document: any) => document.name)].some((value) => (value ?? '').toLowerCase().includes(term)))
})

function isActive(job: iPackage) {
    return route.name === 'edit-package-schedule' && route.query.id === job.jobName
}

async function loadPage() {
    if (route.query.id) {
        await loadSelectJob(route.query.id as string)
    } else {
        selectedJob.value = { jobName: '', jobDescription: '', documents: [], triggers: [], edit: false } as any
        await loadJobs()
    }
}

async function loadJobs() {
    loading.value = true
    let tempJobs = [] as iPackage[]
    await axios
        .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/scheduleree/listAllJobs/`)
        .then((response: AxiosResponse<any>) => (tempJobs = response.data.root))
        .finally(() => (loading.value = false))
    jobs.value = tempJobs
}

async function loadDatasets() {
    await axios.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/datasets/?asPagedList=true`).then((response: AxiosResponse<any>) => (datasets.value = response.data.item ?? []))
}

function askToLeave(): Promise<boolean> {
    return new Promise((resolve) => {
        $q.dialog({ title: t('common.toast.unsavedChangesHeader'), message: t('common.toast.unsavedChangesMessage'), cancel: true, persistent: true })
            .onOk(() => resolve(true))
            .onCancel(() => resolve(false))
    })
}

async function leaveDetail(action: () => void) {
    if (detailDirty.value && !(await askToLeave())) return
    detailDirty.value = false
    action()
}

function showJobDetail(job: iPackage | null, clone: boolean) {
    leaveDetail(() => {
        selectedJob.value = job ? { ...deepcopy(findSelectedJob(job)), edit: true } : ({ jobName: '', jobDescription: '', documents: [], triggers: [] } as any)

        if (clone && selectedJob.value) {
            selectedJob.value.jobName = t('common.copyOf') + ' ' + selectedJob.value.jobName
            selectedJob.value.edit = false
        }

        if (job) router.push({ path: '/scheduler/edit-package-schedule', query: { id: job.jobName, clone: String(clone) } })
        else router.push('/scheduler/new-package-schedule')
    })
}

function findSelectedJob(job: iPackage) {
    return jobs.value.find((tempJob: iPackage) => tempJob.jobName === job.jobName) ?? job
}

function deleteJobConfirm(job: iPackage) {
    $q.dialog({ title: t('common.toast.deleteTitle'), message: t('common.toast.deleteMessage'), cancel: true, persistent: true }).onOk(() => deleteJob(job.jobName))
}

async function deleteJob(jobName: string) {
    loading.value = true
    let tempResponse = null as any
    await axios
        .post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/scheduleree/deleteJob?jobGroup=BIObjectExecutions&jobName=${encodeURIComponent(jobName)}`)
        .then((response: AxiosResponse<any>) => {
            store.setInfo({ title: t('common.toast.deleteTitle'), msg: t('common.toast.deleteSuccess') })
            tempResponse = response.data
        })
        .catch((error) => store.setError({ title: t('common.toast.deleteTitle'), msg: error?.message }))

    if (tempResponse?.resp === 'ok') {
        await loadJobs()
        if (route.query.id === jobName) {
            selectedJob.value = null
            detailDirty.value = false
            router.push('/scheduler')
        }
    }
    loading.value = false
}

async function loadSelectJob(name: string) {
    await loadJobs()
    const job = jobs.value.find((el: iPackage) => el.jobName === name)
    selectedJob.value = job ? { ...deepcopy(job), edit: true } : null
}

function closeDetail() {
    selectedJob.value = null
}

async function guardRoute() {
    if (!detailDirty.value) return true
    const leave = await askToLeave()
    if (leave) detailDirty.value = false
    return leave
}

onBeforeRouteLeave(guardRoute)
onBeforeRouteUpdate(guardRoute)

usePageTour(() =>
    startSchedulerTour({
        t,
        ensureJob: async () => {
            if (route.name === 'edit-package-schedule' && detail.value) return true
            const job = jobs.value.find((job: iPackage) => !job.edit) ?? jobs.value[0]
            if (!job) return false
            showJobDetail(job, false)
            await new Promise((resolve) => setTimeout(resolve, 600))
            return !!detail.value
        },
        detail: () => detail.value
    })
)

onMounted(async () => {
    await Promise.all([loadPage(), loadDatasets()])
})
</script>

<style scoped lang="scss">
.scheduler-list {
    min-height: 0;
    border-right: 1px solid var(--kn-list-border-color);
}

.scheduler-list__item {
    padding: 0.75rem;
}

// Same icon-to-text spacing as the users list
.scheduler-list__item :deep(.q-item__section--avatar) {
    min-width: 0;
    padding-right: 0.8rem;
}

.scheduler-list__search {
    padding: 8px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.scheduler-list__items {
    min-height: 0;
}

// q-scroll-area lets its content grow wider than the column; keep it at the column width, so long names get an ellipsis
.scheduler-list__items :deep(.q-scrollarea__content) {
    width: 100%;
}

.scheduler-list__item:hover {
    background: var(--kn-list-item-hover-background-color);
}

.scheduler-list__item--active {
    background: var(--kn-list-item-selected-background-color);
    color: inherit;
}

.scheduler-list__avatar {
    background-color: #9e9e9e;
    color: #ffffff;
}
</style>
