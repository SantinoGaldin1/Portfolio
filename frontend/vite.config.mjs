import { defineConfig } from 'vite'

// base relativa por si la pagina vive en un subpath (GitHub Pages),
// asi los assets resuelven bien.
export default defineConfig({
  base: './'
})
