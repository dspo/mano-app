/**
 * EmbeddedPlayground: 将原有 Vite index.html + index.tsx 的运行逻辑封装为一个可直接在任意 React 应用中使用的组件。
 * 页面及功能与原 Playground 保持一致：包括 App、Settings 面板、调试视图、GitHub 角标、以及为弹窗/菜单提供的 #portal 挂载点。
 *
 * 用法示例：
 * import {EmbeddedPlayground} from 'lexical-playground/src/EmbeddedPlayground';
 *
 * <EmbeddedPlayground />
 *
 * 注意：此组件假设运行环境已支持浏览器 API。若需要 SSR，请在外层自行判断再渲染。
 */
import './index.css';
// setupEnv 必须最先导入以保持与原入口一致
import setupEnv from './setupEnv';
import App from './App';
import * as React from 'react';
import {useEffect} from 'react';

export interface EmbeddedPlaygroundProps {
  /** 是否启用 StrictMode，默认 true 与原入口保持 */
  strictMode?: boolean;
}

function useEnsurePortal() {
  useEffect(() => {
    const existing = document.getElementById('portal');
    if (!existing) {
      const portal = document.createElement('div');
      portal.id = 'portal';
      document.body.appendChild(portal);
    }
  }, []);
}

function useErrorOverlay() {
  useEffect(() => {
    // 保留与 index.tsx 相同的错误覆盖行为（在 Vite 开发模式下有效）
    const showErrorOverlay = (err: any) => {
      // Vite 的自定义元素（仅开发模式存在）
      const ErrorOverlay = (window as any).customElements?.get(
        'vite-error-overlay',
      );
      if (!ErrorOverlay) return;
      try {
        const overlay = new ErrorOverlay(err);
        document.body?.appendChild(overlay);
      } catch (_) {
        // 忽略 overlay 构建异常
      }
    };
    const onRejection = (e: PromiseRejectionEvent) => showErrorOverlay(e.reason);
    window.addEventListener('error', showErrorOverlay as EventListener);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', showErrorOverlay as EventListener);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);
}

export function EmbeddedPlayground({strictMode = true}: EmbeddedPlaygroundProps) {
  // 与原入口一致，保留 setupEnv 的副作用
  if (setupEnv.disableBeforeInput) {
    // 仅用于保证 tree-shaking 不移除导入
  }
  useEnsurePortal();
  useErrorOverlay();

  const playground = <App />;
  return strictMode ? <React.StrictMode>{playground}</React.StrictMode> : playground;
}

export default EmbeddedPlayground;
