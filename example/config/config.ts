import { defineConfig } from 'alita';
export default defineConfig({
  appType: 'h5',
  mobileLayout: true,
  plugins: ['../lib/index.js'],
  // routes: [{ path: '/', component: '@/pages/index/index' }],
  sentry: {
    // 可以访问 https://sentry.io/ 免费申请，记得选 react 项目类型
    // dsn: 'https://abc@o652357.ingest.sentry.io/abc',
    // apiKey: 'xxx',
    // organization: 'xxx',
    runtime: true,

    // enabled: false,

    dsn: 'http://8feacf7ebf5340dcb4d4857c07ca8676@101.201.120.29:9000/3',
    apiKey: '3ce24b30eaf846d6a0df80234d6e16e4d68ede69628e450eb983ecd2b0e22c95',
    organization: 'sentry',
  }
});
