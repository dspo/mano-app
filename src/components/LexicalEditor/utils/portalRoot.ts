let portalRoot: HTMLElement | null = null;
let usageCount = 0;

const ensureDocumentBody = (): HTMLElement => {
  if (typeof document !== 'undefined' && document.body) {
    return document.body;
  }
  return typeof document !== 'undefined'
    ? document.createElement('div')
    : ({} as HTMLElement);
};

const createPortalHost = (): HTMLElement => {
  if (typeof document === 'undefined') {
    return ensureDocumentBody();
  }
  const existing = document.getElementById('lexical-portal-root');
  if (existing && existing instanceof HTMLElement) {
    return existing;
  }
  const host = document.createElement('div');
  host.id = 'lexical-portal-root';
  host.style.position = 'relative';
  host.style.zIndex = '2147483000';
  document.body?.appendChild(host);
  return host;
};

const ensurePortalRoot = (): HTMLElement => {
  if (portalRoot && portalRoot.isConnected) {
    return portalRoot;
  }
  portalRoot = createPortalHost();
  return portalRoot;
};

export const acquirePortalRoot = (): HTMLElement | null => {
  if (typeof document === 'undefined') {
    return null;
  }
  usageCount += 1;
  return ensurePortalRoot();
};

export const releasePortalRoot = () => {
  if (usageCount > 0) {
    usageCount -= 1;
  }
  // 为避免 React 在卸载 Portal 子树时找不到宿主，不再主动移除 host。
};

export const getPortalRoot = (): HTMLElement => {
  if (typeof document === 'undefined') {
    return ensureDocumentBody();
  }
  return ensurePortalRoot();
};

