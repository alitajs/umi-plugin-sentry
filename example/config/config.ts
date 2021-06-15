import { defineConfig } from 'alita';
export default defineConfig({
  appType: 'h5',
  mobileLayout: true,
  plugins: ['../lib/index.js'],
  // routes: [{ path: '/', component: '@/pages/index/index' }],
  sentry: {
    // 可以访问 https://sentry.io/ 免费申请，记得选 react 项目类型
    dsn: 'https://abc@o652357.ingest.sentry.io/abc',
    apiKey: 'xxx',
    organization: 'xxx',
    runtime: true,

    enabled: false,
  }
});
