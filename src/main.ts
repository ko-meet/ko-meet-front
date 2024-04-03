import '@/assets/common.css';
import '@/assets/contents.css';

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from '@/router';
import setupI18n from './i18n';
const initializeApp = async () => {
  const pinia = createPinia();
  const app = createApp(App);

  const i18n = await setupI18n();
  app.use(router);
  app.use(i18n);
  app.use(pinia);

  app.mount('#app');
}

initializeApp();
