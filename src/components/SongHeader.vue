<script setup>
defineProps({ title: String, composer: String })
defineEmits(['update:title', 'update:composer'])
</script>

<template>
  <div class="song-header">
    <input
      :value="title"
      class="title-input"
      placeholder="Nome da música"
      @input="$emit('update:title', $event.target.value)"
    />
    <input
      :value="composer"
      class="composer-input"
      placeholder="Compositor"
      @input="$emit('update:composer', $event.target.value)"
    />
  </div>
</template>

<style scoped>
.song-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 1.25rem;
}
.title-input {
  font-size: 22px;
  font-weight: 600;
  color: #0D1F3C;
  border: none;
  background: transparent;
  outline: none;
  flex: 1;
  min-width: 0;
  font-family: inherit;
}
.title-input::placeholder { color: #96B5D0; }
.composer-input {
  font-size: 13px;
  font-style: italic;
  color: #4B6B8A;
  border: none;
  background: transparent;
  outline: none;
  text-align: right;
  min-width: 0;
  font-family: inherit;
}
.composer-input::placeholder { color: #96B5D0; }
</style>
