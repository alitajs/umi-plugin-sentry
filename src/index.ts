import { IApi } from "@umijs/types";
import { join } from "path";
import { readFileSync } from "fs";
import { BrowserOptions } from "@sentry/browser";
// @ts-ignore
import SentryPlugin from 'webpack-sentry-plugin';

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
  api.addUmiExports(() => [
    {
      exportAll: true,
      source: "../plugin-sentry/exports",
    },
  ]);
  api.onGenerateFiles({
    fn() {
      // runtime.tsx
      const runtimeTpl = readFileSync(join(__dirname, "runtime.tpl"), "utf-8");
      api.writeTmpFile({
        path: "plugin-sentry/runtime.tsx",
        content: runtimeTpl,
      });
      api.writeTmpFile({
        path: "plugin-sentry/exports.tsx",
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
        source: "@sentry/tracing",
        specifier: "{ Integrations }",
      },
      {
        source: "./core/history",
        specifier: "{ history }",
      },
      {
        source: "react-router-dom",
        specifier: "{ matchPath }",
      },
    ];
  });
  api.addEntryCode(() => {
    return `Sentry.init({
      dsn:"${dsn}",
      tracesSampleRate: ${tracesSampleRate},
      integrations: [new Integrations.BrowserTracing({
        routingInstrumentation: Sentry.reactRouterV5Instrumentation(history,getRoutes(),matchPath),
      })],
      ...${JSON.stringify(other)}
    });`;
  });

  if (sourceMap) {
    api.modifyDefaultConfig((config) => {
      return {
        ...config,
        hash: true,
        devtool: "source-map",
      };
    });
    api.chainWebpack((config) => {
      config.plugin("sentry").use(SentryPlugin, [sourceMap]);
      return config;
    });
  }
};
