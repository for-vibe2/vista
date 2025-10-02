import transformerDirective from "@unocss/transformer-directives";
import { defineNuxtConfig } from "nuxt/config";

// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  modules: ["@unocss/nuxt", "@vueuse/nuxt", "@nuxtjs/supabase", "@nuxt/image-edge", "nuxt-electron"],
  css: ["@unocss/reset/tailwind.css", "~~/assets/main.css"],
  runtimeConfig: {
    public: {
      UMAMI_WEBSITE_ID: process.env.UMAMI_WEBSITE_ID,
    },
  },
  electron: {
    build: [
      {
        entry: "electron/main.ts",
        onstart({ startup }) {
          if (process.env.NODE_ENV !== "production") {
            startup();
          }
        },
      },
      {
        entry: "electron/preload.ts",
        onstart({ reload }) {
          if (process.env.NODE_ENV !== "production") {
            reload();
          }
        },
      },
    ],
  },
  typescript: {
    tsConfig: {
      compilerOptions: {
        types: ["nuxt-electron/electron-env", "./types/electron"],
      },
    },
  },
  nitro: {
    rollupConfig: {
      plugins: [
        {
          name: "nuxt-electron-unocss-empty-chunk",
          enforce: "post",
          load(id) {
            if (id.includes("-styles-") && (id.endsWith(".js") || id.endsWith(".mjs"))) {
              return {
                code: "export default undefined;",
                map: null,
              };
            }
            return null;
          },
        },
      ],
    },
  },
  unocss: {
    // presets
    uno: true, // enabled `@unocss/preset-uno`
    icons: true, // enabled `@unocss/preset-icons`,
    transformers: [transformerDirective({ enforce: "pre" })], // enabled `@unocss/transformer-directives`,
    // core options
    shortcuts: [
      {
        btn: " text-sm md:text-base font-medium rounded-full py-3 px-6 transition ring-3 ring-transparent disabled:opacity-50 relative inline-flex justify-center items-center shadow-none",
        "btn-plain":
          "btn bg-gray-100 hover:bg-gray-200 font-semibold text-gray-400 focus:text-dark-50 hover:text-dark-50",
        "btn-primary": "btn bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-600 focus:shadow-xl",
        "btn-secondary": "btn bg-white hover:bg-gray-100 focus:ring-gray-100",
        "btn-danger": "btn bg-red-500 text-white hover:bg-red-600 focus:ring-red-300",
      },
    ],
    safelist: [...Array.from({ length: 5 }, (_, i) => `bg-blue-${i + 1}00`)],
    rules: [],
  },
  image: {
    domains: ["avatars0.githubusercontent.com", "avatars.githubusercontent.com/", "images.unsplash.com/"],
  },

  routeRules: {
    "/v/**": { ssr: false },
  },

  build: {
    transpile: process.env.NODE_ENV === "development" ? [] : ["vue3-colorpicker", "vue3-angle"],
  },
});
