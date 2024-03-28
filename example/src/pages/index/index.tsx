import React, { FC, useEffect } from 'react';
import { IndexModelState, ConnectProps, connect, Sentry } from 'alita';
import { Button } from 'antd-mobile';
import styles from './index.less';

interface PageProps extends ConnectProps {
  index: IndexModelState;
}

const IndexPage: FC<PageProps> = ({ index, dispatch, history }) => {
  useEffect(() => {
    dispatch?.({
      type: 'index/query',
    });
  }, []);

  const { name='sentry' } = index;
  return <div className={styles.center} onClick={() => {
    console.log('click');
    Sentry.setUser({ id: "123", username: "xiaohuoni" });
    history.push('/some/123');
  }}>Hello {name}
    <Button>点击设置用户信息，并跳转到 some 页面</Button>
  </div>;
};

export default connect(({ index }: { index: IndexModelState }) => ({ index }))(IndexPage);
