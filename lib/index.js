"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _react() {
  const data = _interopRequireDefault(require("react"));

  _react = function _react() {
    return data;
  };

  return data;
}

function _path() {
  const data = require("path");

  _path = function _path() {
    return data;
  };

  return data;
}

function _fs() {
  const data = require("fs");

  _fs = function _fs() {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

var _default = api => {
  const sentry = api.userConfig.sentry;

  const _ref = sentry,
        dsn = _ref.dsn,
        _ref$tracesSampleRate = _ref.tracesSampleRate,
        tracesSampleRate = _ref$tracesSampleRate === void 0 ? 1.0 : _ref$tracesSampleRate,
        _ref$production = _ref.production,
        production = _ref$production === void 0 ? false : _ref$production,
        other = _objectWithoutProperties(_ref, ["dsn", "tracesSampleRate", "production"]); // 配置


  api.describe({
    key: 'sentry',
    config: {
      schema(joi) {
        return joi.object({
          dsn: joi.string(),
          tracesSampleRate: joi.string(),
          release: joi.string(),
          production: joi.boolean()
        });
      }

    }
  }); // if (!production || process.env.NODE_ENV === 'development') {
  //   return
  // }

  if (!dsn) {
    console.error('只有配置sentry.dsn,才能使用sentry功能。');
    return;
  }

  api.addEntryImports(() => {
    return [{
      source: '@sentry/react',
      specifier: '* as Sentry'
    }, {
      source: '@sentry/tracing',
      specifier: '{ Integrations }'
    }, {
      source: './core/history',
      specifier: '{ history }'
    }, {
      source: 'react-router-dom',
      specifier: '{ matchPath }'
    }];
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
  api.addUmiExports(() => [{
    exportAll: true,
    source: '../plugin-sentry/exports'
  }]);
  api.onGenerateFiles({
    fn() {
      // runtime.tsx
      const runtimeTpl = (0, _fs().readFileSync)((0, _path().join)(__dirname, 'runtime.tpl'), 'utf-8');
      api.writeTmpFile({
        path: 'plugin-sentry/runtime.tsx',
        content: runtimeTpl
      });
      api.writeTmpFile({
        path: 'plugin-sentry/exports.tsx',
        content: `export * as Sentry from '@sentry/react';\nexport type { ErrorBoundaryProps as SentryRunTime } from '@sentry/react/dist/errorboundary';`
      });
    }

  });
  api.addRuntimePlugin(() => [(0, _path().join)(api.paths.absTmpPath, 'plugin-sentry/runtime.tsx')]);
  api.addRuntimePluginKey(() => ['sentry']);
};

exports.default = _default;