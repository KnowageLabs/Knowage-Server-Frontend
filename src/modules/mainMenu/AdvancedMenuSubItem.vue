<template>
    <q-list style="min-width: 100px">
        <q-item v-for="subItem in props.item.items" class="q-pa-none">
            <q-item-section v-if="subItem.iconCls || subItem.custIcon" avatar>
                <q-icon v-if="subItem.iconCls" color="primary" />
                <img v-else :src="item.custIcon" />
            </q-item-section>
            <q-item-section class="relative-position">
                <q-btn flat square align="left" :label="getInternationalizedValue(subItem)" class="text-lowercase fit text-weight-regular" :to="subItem.to">
                    <q-badge v-if="subItem.badge > 0" color="accent" floating>{{ subItem.badge }}</q-badge>
                </q-btn>
            </q-item-section>
            <q-item-section avatar v-if="subItem.items">
                <q-btn flat square icon="keyboard_arrow_right" class="fit" />
                <q-menu v-if="subItem.items" :anchor="$q.screen.lt.md ? 'bottom right' : 'top right'" self="top left">
                    <advanced-menu-sub-item :item="subItem" />
                </q-menu>
            </q-item-section>
        </q-item>
    </q-list>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { useInternationalization } from '@/composables/useInternationalization'
import AdvancedMenuSubItem from './AdvancedMenuSubItem.vue'
import { useQuasar } from 'quasar'

const props = defineProps<{
    item: any
}>()

const { t } = useI18n()
const $q = useQuasar()
const { i18n } = useInternationalization()

function getInternationalizedValue(item): string {
    const value = item.descr ? item.descr : item.label
    return i18n(value) || t(value)
}
</script>
<style lang="scss" scoped>
.q-item__section--main ~ .q-item__section--side {
    padding-left: 0 !important;
}
</style>
