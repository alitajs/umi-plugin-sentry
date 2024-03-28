import { defineConfig } from 'alita';

export default defineConfig({
  appType: 'h5',
  mobileLayout: true,
  dva:{},
  plugins: ['../lib/index.js'],
  sentry: {
    // 可以访问 https://sentry.io/ 免费申请，记得选 react 项目类型
    dsn: 'https://96620dadccb040a3a5acc998a6078212@o1378593.ingest.us.sentry.io/6690607',
    development: true,
    sourceMap: {
      org: "juejin",
      project: "javascript-react",
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }
  },
});
