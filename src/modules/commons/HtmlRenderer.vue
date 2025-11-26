<template>
    <div v-if="htmlToRender && !error" class="html-renderer" v-html="htmlToRender"></div>
    <div v-if="error" class="html-renderer col flex justify-center items-center">
        <q-banner inline-actions class="text-white bg-red"> {{ $t('common.error.downloading') }} </q-banner>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import mainStore from '@/App.store'

const store = mainStore()

const htmlToRender = ref<string>('')
const error = ref<boolean>(false)

const route = useRoute()
const router = useRouter()

const menuId = computed(() => {
    const q = route.query.id
    return Array.isArray(q) ? q[0] : (q as string | undefined)
})

onMounted(async () => {
    await getHTMLContent()
})

watch(menuId, async () => {
    await getHTMLContent()
})

async function getHTMLContent() {
    if (!menuId.value) {
        router.push({ name: '404' })
    }
    store.setLoading(true)
    const idParam = menuId.value ?? ''
    await axios
        .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/readHtmlFile?MENU_ID=${encodeURIComponent(idParam)}`)
        .then((response: any) => {
            htmlToRender.value = response.data
        })
        .catch(() => {
            error.value = true
        })
        .finally(() => store.setLoading(false))
}
</script>
<style lang="scss" scoped>
.html-renderer {
    overflow: auto;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
}
</style>
