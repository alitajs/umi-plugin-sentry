import React from 'react';
import { ApplyPluginsType } from 'umi';
import { ErrorBoundary } from "@sentry/react";
import { getPluginManager } from '../core/plugin';

export function rootContainer(container) {
  const runtimeSentry = getPluginManager().applyPlugins({
    key: 'sentry',
    type: ApplyPluginsType.modify,
    initialValue: {
    },
  });
  return React.createElement(ErrorBoundary, runtimeSentry, container);
}
