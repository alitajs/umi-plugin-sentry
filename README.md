# umi-plugin-sentry

umi 项目快速介入 [Sentry](https://github.com/getsentry/sentry) 官方 [SDK](https://github.com/getsentry/sentry-javascript) 的插件。

Sentry 是一个服务，帮助你监测和修复在实时崩溃。服务器是 Python 的，但是它包含一个完整的 API，用于在任何应用程序中从任何语言发送事件。

## 调试开发

`yarn && yarn build && yarn start`

> 无需在 example 目录下面安装依赖

## 使用

```base
$ yarn add @alitajs/sentry
```

```ts
import { defineConfig } from 'umi';
export default defineConfig({
  plugins: ['@alitajs/sentry'],
  sentry: {
    dsn: '可以访问 https://sentry.io/ 免费申请，记得选 react 项目类型',
  },
});
```

## 错误跟踪

![image](https://user-images.githubusercontent.com/11746742/118098421-78894e80-b406-11eb-92b2-c05a6788dce6.png)

## 错误堆栈

![image](https://user-images.githubusercontent.com/11746742/118098813-f6e5f080-b406-11eb-9257-cea293b92685.png)

## 面包屑

![image](https://user-images.githubusercontent.com/11746742/118099128-65c34980-b407-11eb-9f42-3e238bb820c1.png)

## 用户反馈

![image](https://user-images.githubusercontent.com/11746742/118099037-47f5e480-b407-11eb-86b2-f5b791d298fa.png)

## 配置

|            属性             |                                                              说明                                                              |
| :-------------------------: | :----------------------------------------------------------------------------------------------------------------------------: |
|            debug            |                                           是否开启调试模式，主要是发送之前会打印数据                                           |
|             dsn             |                           数据链接地址，可以访问 https://sentry.io/ 免费申请，记得选 react 项目类型                            |
|         development          |                               默认打包之后启用，可以设置这个属性，来在开发环境演示 sentry 功能。                               |
|         sourceMap          | 传递给 @sentry/webpack-plugin 的配置，https://docs.sentry.io/platforms/javascript/guides/react/sourcemaps/generating/#webpack                          |
| 其他 sentry init 支持的参数 | https://github.com/getsentry/sentry-javascript/blob/0c4fdf60fe1394dd453093fc7ecf6d95ccee070f/packages/types/src/options.ts#L10 |

## 运行时配置

|     属性      |                                                                   说明                                                                    |
| :-----------: | :---------------------------------------------------------------------------------------------------------------------------------------: |
|  showDialog   |                                                           弹窗邀请用户提交反馈                                                            |
|   fallback    |                               当发生错误时，会使用这个返回的组件渲染页面，可以调用 resetError 关闭当前错误                                |
|    onError    | 当错误边界遇到错误时调用的函数。如果要将错误传播到 Redux 之类的状态管理库中，或者要检查可能由于错误而发生的任何副作用，onError 非常有用。 |
| beforeCapture |                               在将错误发送到 Sentry 之前被调用的函数，允许向错误中添加额外的标记或上下文。                                |

比如：

```ts
export const sentry = {
  showDialog: true,
  fallback: ({ error, componentStack, resetError }) => (
    <React.Fragment>
      <div>You have encountered an error</div>
      <div>{error.toString()}</div>
      <div>{componentStack}</div>
      <button
        onClick={() => {
          resetError();
        }}
      >
        Click here to reset!
      </button>
    </React.Fragment>
  ),
  onError: (e) => {
    console.error(e);
  },
  beforeCapture: (scope) => {
    scope.setTag('location', 'first');
    scope.setTag('anotherTag', 'anotherValue');
  },
};
```

## API

`import { Sentry } from 'umi';`

### captureMessage 手动发数据

```ts
// 此处的 debug 为等级
Sentry.captureMessage('Something went wrong', 'debug');
```

### captureException 手动发送事件

默认情况下 sentry 只会发送我们程序中没有捕获的错误，如果是已经被程序捕获的错误，将不会自动发送，这时候我们可以在处理完错误之后，选择性的手动发送事件。

```ts
try {
  aFunctionThatMightFail();
} catch (err) {
  Sentry.captureException(err);
}
```

### setLevel 设置等级

```ts
Sentry.configureScope(function (scope) {
  scope.setLevel(Sentry.Severity.Warning);
});
```

### setUser 设置用户

比如在用户登陆授权之后，全程跟踪用户发生的错误。

```ts
Sentry.setUser({ id: '123', username: 'xiaohuoni', email: '' });
```

可以清除当前设置的用户：

```ts
Sentry.configureScope((scope) => scope.setUser(null));
```

### setTag 设置标签

设置完可以在后台看到对应的分类标签

```ts
Sentry.setTag('page_locale', 'de-at');
```

以上是我觉得比较常用的方法，如果你想了解更多，请查看 [sentry 的文档](https://docs.sentry.io/platforms/javascript/guides/react/#monitor-performance)。

