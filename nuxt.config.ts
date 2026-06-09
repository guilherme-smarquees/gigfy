export default defineNuxtConfig({
  srcDir: 'src',
  ssr: false,
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL ?? '/',
    rootId: 'app',
    head: {
      htmlAttrs: { lang: 'pt-BR' },
      title: 'Chord Chart Generator',
      meta: [
        { charset: 'UTF-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap',
        },
        {
          rel: 'stylesheet',
          href: 'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css',
        },
      ],
    },
  },
  css: ['~/assets/style.css'],
})
