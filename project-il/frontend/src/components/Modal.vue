<template>
  <div class="modal-overlay" @click.self="emitClose">
    <div class="modal-box">
      <slot />
    </div>
  </div>
</template>

<script setup>
const emit = defineEmits(['close'])
const emitClose = () => emit('close')
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-box {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  min-width: 300px;
  max-width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}
</style>
