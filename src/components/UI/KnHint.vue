<template>
    <div class="kn-hint hint">
        <div class="kn-hintContent">
            <div class="kn-hintIcon"></div>
            <div class="kn-hintText">
                <h3>{{ $t(title) }}</h3>
                <p v-html="$t(hint)"></p>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
    name: 'kn-hint',
    props: { title: String, hint: String }
})
</script>
