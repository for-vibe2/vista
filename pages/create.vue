<script setup lang="ts">
import { wait } from "@/utils/functions";

const { file, fileName, open } = useFileSystemAccess({
  dataType: "Blob",
  types: [
    {
      description: "Videos",
      accept: {
        "video/*": [".mp4", ".avi", ".wmv", ".mov", ".webm"],
      },
    },
  ],
  excludeAcceptAllOption: true,
});

const { el, duration, playing } = usePlayback();
const inMemoryFile = useInMemoryFile();

const DURATION_LIMIT = 15;
const title = ref("");
const isOffLimit = computed(() => duration.value >= DURATION_LIMIT);

const url = computed(() => (file.value ? URL.createObjectURL(file.value) : undefined));

const progress = ref(0);
const isProcessing = computed(() => progress.value !== 0);

const uploadToStorage = async () => {
  if (!file.value || !title.value) return;
  try {
    progress.value = 0.2;
    const form = new FormData();
    form.append("title", title.value);
    form.append("file", file.value, fileName.value);

    const project = await $fetch<{ id: string }>("/api/projects", {
      method: "POST",
      body: form,
    });

    progress.value = 1;
    if (project?.id && url.value) {
      await wait(300);
      inMemoryFile.value[project.id] = file.value;
      navigateTo(`/v/${project.id}`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    progress.value = 0;
  }
};
</script>

<template>
  <div>
    <h1 class="my-4">Create</h1>
    <div class="flex justify-center">
      <button :class="[url ? 'btn-plain' : 'btn-primary my-10']" @click="open()">
        Select/Drop a video (max {{ DURATION_LIMIT }}s, for now)
      </button>
    </div>

    <div v-if="file" class="flex flex-col items-center mt-4">
      <div class="max-w-screen-md m-auto">
        <button @click="playing = !playing" class="border relative rounded-3xl overflow-hidden">
          <video ref="el" class="max-h-screen-sm" :src="url"></video>

          <div
            class="overlay absolute right-0 top-0 h-full bg-opacity-30 transition-all duration-300 ease-in-out border-l-2 border-white border-opacity-50"
            :class="[isProcessing ? 'bg-dark-100' : 'bg-transparent']"
            :style="{ width: isProcessing ? (1 - progress) * 100 + '%' : '100%' }"
          ></div>
        </button>
        <PreviewControls></PreviewControls>
      </div>

      <div v-if="isOffLimit" class="text-red font-semibold my-4">
        Video is too long, currently only max {{ DURATION_LIMIT }} seconds.
      </div>

      <div v-if="!isProcessing" class="mt-12 flex items-center">
        <input type="text" class="mr-4 w-full !rounded-full !px-4 !py-3" v-model="title" placeholder="Project title" />
        <button :disabled="isOffLimit || !title" @click="uploadToStorage" class="btn-primary">Upload</button>
      </div>
    </div>
  </div>
</template>
