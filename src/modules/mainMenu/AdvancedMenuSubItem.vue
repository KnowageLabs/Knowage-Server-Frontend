<template>
    <q-list style="min-width: 100px">
        <q-item v-for="subItem in props.item.items" class="q-pa-none">
            <q-item-section v-if="subItem.iconCls || subItem.custIcon" avatar>
                <q-icon v-if="subItem.iconCls" color="primary" />
                <img v-else :src="item.custIcon" />
            </q-item-section>
            <q-item-section class="relative-position">
                <q-btn flat square align="left" :label="getInternationalizedValue(subItem)" class="text-lowercase fit text-weight-regular" :to="link">
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
import AdvancedMenuSubItem from './AdvancedMenuSubItem.vue'
import { useQuasar } from 'quasar'
import { computed } from 'vue'
import { getInternationalizedValue, cleanUrl } from './AdvancedMainMenuHelper'

const props = defineProps<{
    item: any
}>()

const $q = useQuasar()

const link = computed(() => {
    return cleanUrl(props.item)
})
</script>
<style lang="scss" scoped>
.q-item__section--main ~ .q-item__section--side {
    padding-left: 0 !important;
}
</style>
