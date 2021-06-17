// ref:
// - https://umijs.org/plugins/api
import { IApi } from '@umijs/types';
import { join, resolve } from 'path';
import { readFileSync } from 'fs';
import { BrowserOptions } from '@sentry/browser';
import SentryPlugin from 'webpack-sentry-plugin';
import { execSync } from 'child_process';

let commitHash = '';
try {
  commitHash = execSync(`git show -s --format=%h`).toString().trim();
} catch (err) {
  console.error(err);
}

// 提取所在项目 package.json
function npmPackage() {
  try {
    const pkg = require(resolve(process.env.PWD, 'package.json'));
    return pkg;
  } catch (err) {
    console.error(err);
    return {};
  }
}

interface SentryOptions extends BrowserOptions {
  // sentry init
  dsn: string;
  enabled?: boolean;
  runtime?: boolean;
  release?: string;
  environment?: string;
  tracesSampleRate?: number;
  commit?: boolean;
  // sourceMap options
  apiKey?: string;
  baseSentryURL?: string;
  organization?: string;
  project?: string; // 默认取 package.json name
  include?: any;
  exclude?: any;
  deleteAfterCompile?: boolean;
  suppressConflictError?: boolean;
  filenameTransform?: any;
}
const { name: packageName = '', version: packageVersion = '0.0.0' } =
  npmPackage();
const DEFAULT_OPTIONS = {
  // Sentry init options
  dsn: '',
  enabled: process.env.NODE_ENV !== 'developemnt',
  runtime: false,
  release: packageVersion, // 默认取 package.json version
  environment: 'temp',
  tracesSampleRate: 1.0,
  commit: false,
  // sourceMap options
  apiKey: '',
  baseSentryURL: '',
  organization: 'sentry',
  project: packageName, // 默认取 package.json name
  include: /\.(js|js\.map)$/,
  exclude: /\.(html|css|css\.map)$/,
  deleteAfterCompile: true,
  suppressConflictError: true,
};

export default (api: IApi) => {
  const { sentry, publicPath = '/' } = api.userConfig;
  if (!sentry) return;
  const realConfig = Object.assign(
    {},
    api.config?.sentry || DEFAULT_OPTIONS,
    sentry,
  );

  const {
    dsn,
    enabled,
    runtime,
    release,
    environment,
    tracesSampleRate,
    commit,
    // sourceMap options
    apiKey,
    baseSentryURL,
    organization,
    project,
    include,
    exclude,
    deleteAfterCompile,
    suppressConflictError,
    filenameTransform,
    ...rest
  } = realConfig as SentryOptions;
  // 配置
  api.describe({
    key: 'sentry',
    config: {
      schema(joi) {
        return joi.object({
          dsn: joi.string(), // 包含域名 projectId dsn
          enabled: joi.boolean(),
          runtime: joi.boolean(),
          release: joi.string(), // `${version}_${commit}`
          environment: joi.any(), // `${version}_${commit}`
          tracesSampleRate: joi.number(),
          commit: joi.boolean(),

          // 配置自动上传 cdn
          apiKey: joi.string(),
          baseSentryURL: joi.string(), // 可以从 dsn 中提取
          organization: joi.string(),
          project: joi.string(),
          exclude: joi.any(),
          include: joi.any(),
          deleteAfterCompile: joi.boolean(),
          suppressConflictError: joi.boolean(),
          filenameTransform: joi.any(),
        });
      },
      default: {
        ...DEFAULT_OPTIONS,
      },
    },
  });
  if (!enabled) return;

  if (!dsn) {
    console.error('只有配置sentry.dsn，才能使用sentry功能。');
    return;
  }
  let releaseVersion = release;
  if (commit && commitHash) {
    releaseVersion = `${release}_${commitHash}`;
  }
  let injectScripts = `window.APP_VERSION='${releaseVersion}';`;
  if (environment) {
    injectScripts += `window.APP_ENVIRONMENT='${environment}';`;
  }
  api.addHTMLHeadScripts(() => {
    return [
      {
        content: injectScripts,
      },
    ];
  });
  // 配置 sentry init
  api.addEntryImports(() => {
    let sources = [
      {
        source: '@sentry/react',
        specifier: '* as Sentry',
      },
      {
        source: '@sentry/tracing',
        specifier: '{ Integrations }',
      },
    ];
    if (runtime) {
      sources = [
        ...sources,
        {
          source: './core/history',
          specifier: '{ history }',
        },
        {
          source: 'react-router-dom',
          specifier: '{ matchPath }',
        },
      ];
    }
    return sources;
  });
  api.addEntryCode(() => {
    // releaseVersion 注入到 window 上
    // Can also use reactRouterV4Instrumentation
    // reactRouterV5Instrumentation 上报的时候可以上报具体的路由地址
    return `Sentry.init({
      dsn: "${dsn}",
      release: window.APP_VERSION,
      environment: window.APP_ENVIRONMENT,
      tracesSampleRate: ${tracesSampleRate},
      integrations: [new Integrations.BrowserTracing({
        routingInstrumentation: Sentry.reactRouterV5Instrumentation(history,getRoutes(),matchPath),
      })],
      ...${JSON.stringify(rest)}
    });`;
    // integrations: [new Integrations.BrowserTracing()],
  });

  if (runtime) {
    api.addUmiExports(() => [
      {
        exportAll: true,
        source: '../plugin-sentry/exports',
      },
    ]);
  }

  // runtime
  api.onGenerateFiles({
    fn() {
      if (runtime) {
        // runtime.tsx
        const runtimeTpl = readFileSync(
          join(__dirname, 'runtime.tpl'),
          'utf-8',
        );
        api.writeTmpFile({
          path: 'plugin-sentry/runtime.tsx',
          content: runtimeTpl,
        });
      }
      api.writeTmpFile({
        path: 'plugin-sentry/exports.tsx',
        content: `export * as Sentry from '@sentry/react';\nexport type { ErrorBoundaryProps as SentryRunTime } from '@sentry/react/dist/errorboundary';`,
      });
    },
  });
  if (runtime) {
    api.addRuntimePlugin(() => [
      join(api.paths.absTmpPath!, 'plugin-sentry/runtime.tsx'),
    ]);
    api.addRuntimePluginKey(() => ['sentry']);
  }

  // 通过 webpack-sentry-plugin 配置 sentry 自动上传 sourceMap
  if (!apiKey) return;
  if (apiKey) {
    if (!organization || !project) {
      console.error('上传 sourceMap 必须配置 organization 和 project。');
      return;
    }
  }
  api.modifyDefaultConfig((config) => {
    return {
      ...config,
      hash: true,
      devtool: 'source-map',
    };
  });
  api.chainWebpack((config) => {
    // 从dsn 中提取 origin
    const params = new URL(dsn);
    const sentryConfig = {
      // Sentry options are required
      apiKey,
      organization,
      project,
      deleteAfterCompile,
      exclude,
      include,
      // baseSentryURL: 'https://sentry.io/api/0',
      baseSentryURL: baseSentryURL || `${params.origin}/api/0`,
      suppressConflictError,
      release: releaseVersion,
      filenameTransform:
        filenameTransform ||
        function (filename: any) {
          // 此处应结合使用 publicPath 来处理，配置正确 sourceMap 才会生效（~代表域名）
          return join('~/', publicPath, filename);
        },
    };

    config.plugin('sentry').use(SentryPlugin, [sentryConfig]);
    return config;
  });
};
