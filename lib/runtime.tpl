import React from 'react';
import { ApplyPluginsType } from 'umi';
import { ErrorBoundary } from "@sentry/react";
import { plugin } from '../core/umiExports';

export function rootContainer(container) {
  const runtimeSentry = plugin.applyPlugins({
    key: 'sentry',
    type: ApplyPluginsType.modify,
    initialValue: {
    },
  });
  return React.createElement(ErrorBoundary, runtimeSentry, container);
}
