<!-- src/components/common/ConfirmModal.vue -->
<template>
  <div v-if="visible" class="modal-backdrop">
    <div class="modal-dialog modal-dialog-centered" style="max-width: 500px;">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{{ title }}</h5>
        </div>
        <div class="modal-body">
          <p v-if="message" class="text-muted">{{ message }}</p>
          <textarea
            class="form-control"
            v-model="input"
            rows="4"
            placeholder="사유를 입력하세요"
          />
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="cancel">취소</button>
          <button type="button" class="btn btn-danger" @click="confirm">확인</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineExpose } from 'vue'

const visible = ref(false)
const input = ref('')
const resolveFn = ref(null)
const title = ref('')
const message = ref('')

function open(modalTitle = '확인', modalMessage = '') {
  visible.value = true
  title.value = modalTitle
  message.value = modalMessage
  input.value = ''
  return new Promise((resolve) => {
    resolveFn.value = resolve
  })
}

function confirm() {
  visible.value = false
  resolveFn.value(input.value)
}

function cancel() {
  visible.value = false
  resolveFn.value(null)
}

defineExpose({ open })
</script>

<style scoped>
.modal-dialog{
  background-color: #fff;
  padding: 20px;
}
.modal-backdrop {
  position: fixed;
  z-index: 9999;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
