import { defineConfig } from 'alita';
export default defineConfig({
  appType: 'h5',
  mobileLayout: true,
  plugins: ['../lib/index.js'],
  sentry: {
    // 可以访问 https://sentry.io/ 免费申请，记得选 react 项目类型
    dsn: 'https://f2a345433ac14d9da53a7537221cc8b8@o652357.ingest.sentry.io/5761287',
    development: true,
  }
});
