import { IApi } from "umi";
import { join } from "path";
import { readFileSync } from "fs";
import { BrowserOptions } from "@sentry/browser";
import { sentryWebpackPlugin } from '@sentry/webpack-plugin';

interface SentryOptions extends BrowserOptions {
  development?: boolean;
  sourceMap?: any;
}

export default (api: IApi) => {
  const { sentry } = api.userConfig;
  const {
    dsn,
    sourceMap,
    tracesSampleRate = 1.0,
    development = false,
    ...other
  } = sentry as SentryOptions;
  // 配置
  api.describe({
    key: "sentry",
    config: {
      schema(joi) {
        return joi.object({
          dsn: joi.string(),
          tracesSampleRate: joi.string(),
          release: joi.string(),
          development: joi.boolean(),
          //
          sourceMap: joi.object(),
        });
      },
    },
  });
  api.onGenerateFiles({
    fn() {
      // runtime.tsx
      const runtimeTpl = readFileSync(join(__dirname, "runtime.tpl"), "utf-8");
      api.writeTmpFile({
        path: "plugin-sentry/runtime.tsx",
        noPluginDir: true,
        content: runtimeTpl,
      });
      api.writeTmpFile({
        path: "plugin-sentry/index.tsx",
        noPluginDir: true,
        content: `export * as Sentry from '@sentry/react';\nexport type { ErrorBoundaryProps as SentryRunTime } from '@sentry/react/dist/errorboundary';`,
      });
    },
  });
  api.addRuntimePlugin(() => [
    join(api.paths.absTmpPath!, "plugin-sentry/runtime.tsx"),
  ]);
  api.addRuntimePluginKey(() => ["sentry"]);

  if (!development && process.env.NODE_ENV === "development") {
    return;
  }
  if (!dsn) {
    console.error("只有配置sentry.dsn,才能使用sentry功能。");
    return;
  }
  api.addEntryImports(() => {
    return [
      {
        source: "@sentry/react",
        specifier: "* as Sentry",
      },
      {
        source: "react",
        specifier: "{ useEffect }",
      },
      {
        source: "umi",
        specifier: "{ useLocation, useNavigationType ,createRoutesFromChildren, matchRoutes}",
      },
      {
        source: "./core/history",
        specifier: "{ history }",
      },
    ];
  });
  api.addEntryCode(() => {
    return `Sentry.init({
      dsn:"${dsn}",
      tracesSampleRate: ${tracesSampleRate},
      integrations: [Sentry.reactRouterV6BrowserTracingIntegration({
        useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes
    }),
    Sentry.replayIntegration(),
  ${sourceMap ? '' : 'new Sentry.Integrations.RewriteFrames()'
      }
  ],
      ...${JSON.stringify(other)}
    });`;
  });

  if (sourceMap) {
    api.modifyDefaultConfig((config) => {
      return {
        ...config,
        hash: true,
        esbuildMinifyIIFE: true,
        devtool: "source-map",
      };
    });
    api.chainWebpack((config) => {
      config.plugin("sentry").use(sentryWebpackPlugin(sourceMap), []);
      return config;
    });
  }
};
