<script setup lang="ts">
import type { Project } from "~/types/project";

const { data } = await useFetch<Project[]>("/api/projects");
</script>

<template>
  <div class="flex flex-col items-center justify-center">
    <h1 class="my-4">My projects</h1>
    <NuxtLink class="btn-primary" to="/create">Create</NuxtLink>

    <div class="flex flex-col mt-12">
      <NuxtLink class="btn-plain mb-3" v-for="item in data || []" :key="item.id" :to="`/v/${item.id}`">
        {{ item.title || item.id }}
      </NuxtLink>
    </div>
  </div>
</template>
