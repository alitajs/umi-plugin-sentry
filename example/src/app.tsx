import React from 'react';
import { ResponseError } from 'umi-request';
import { NavBarProps, TitleListItem, NavBarListItem, TabBarProps, Sentry, SentryRunTime } from 'alita';

export const request = {
  prefix: '',
  method: 'post',
  errorHandler: (error: ResponseError) => {
    // 集中处理错误
    console.log(error);
    // throw error;
    Sentry.captureException(error);
  },
};

export const sentry = {
  showDialog: true,
  fallback: ({ error, componentStack, resetError }) => (
    <React.Fragment>
      <div>You have encountered an error</div>
      {/* <div>{error.toString()}</div> */}
      <div>{componentStack}</div>
      <button
        onClick={() => {
          resetError();
        }}
      >
        Click here to reset!
      </button>
    </React.Fragment>
  ) as React.ReactNode,
  onError: (e) => {
    console.error(e);
  },
  beforeCapture: (scope) => {
    scope.setTag("location", "first");
    scope.setTag("anotherTag", "anotherValue");
  }
} as SentryRunTime;

const titleList: TitleListItem[] = [
  {
    pagePath: '/',
    title: '首页',
  },
  {
    pagePath: '/list',
    title: '列表',
  },
  {
    pagePath: '/settings',
    title: '设置',
  },
];
const navList: NavBarListItem[] = [];
const navBar: NavBarProps = {
  navList,
  fixed: true,
  onLeftClick: (history) => {
    history.goBack();
  },
};

const tabBar: TabBarProps = {
  color: `#999999`,
  selectedColor: '#00A0FF',
  borderStyle: 'white',
  position: 'bottom',
  list: [],
};

export const mobileLayout = {
  documentTitle: '默认标题',
  navBar,
  tabBar,
  titleList,
};
