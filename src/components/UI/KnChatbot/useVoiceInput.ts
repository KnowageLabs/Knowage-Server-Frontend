import { ref } from 'vue'
import type { Ref } from 'vue'

export function useVoiceInput(userMessage: Ref<string>) {
    const listening = ref(false)
    let recognition: any = null

    function toggleVoice() {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        if (!SpeechRecognition) return

        if (listening.value) {
            recognition?.stop()
            listening.value = false
            return
        }

        recognition = new SpeechRecognition()
        recognition.lang = navigator.language || 'it-IT'
        recognition.interimResults = false
        recognition.maxAlternatives = 1

        recognition.onresult = (event: any) => {
            const transcript: string = event.results[0][0].transcript
            userMessage.value = userMessage.value ? userMessage.value + ' ' + transcript : transcript
        }
        recognition.onerror = () => {
            listening.value = false
        }
        recognition.onend = () => {
            listening.value = false
        }

        recognition.start()
        listening.value = true
    }

    return { listening, toggleVoice }
}
