/**
 * WordPress Core React & ReactDOM Shim (wp.element)
 * WordPress.org Plugin Check strictly prohibits inlining React into plugin JS files.
 * This shim resolves all React imports directly to WordPress core's window.wp.element.
 */

const getWp = () => (typeof window !== 'undefined' ? (window.wp?.element || window.React || {}) : {});
const getWpDom = () => (typeof window !== 'undefined' ? (window.wp?.element || window.ReactDOM || {}) : {});

const wpElement = (typeof window !== 'undefined' && (window.wp?.element || window.React)) || {};

export default wpElement;
export const useState = (...args) => getWp().useState(...args);
export const useEffect = (...args) => getWp().useEffect(...args);
export const useMemo = (...args) => getWp().useMemo(...args);
export const useCallback = (...args) => getWp().useCallback(...args);
export const useRef = (...args) => getWp().useRef(...args);
export const useContext = (...args) => getWp().useContext(...args);
export const useReducer = (...args) => getWp().useReducer(...args);
export const createContext = (...args) => getWp().createContext(...args);
export const createElement = (...args) => getWp().createElement(...args);
export const createRef = (...args) => getWp().createRef(...args);
export const forwardRef = (...args) => getWp().forwardRef(...args);
export const memo = (...args) => getWp().memo(...args);
export const Children = (typeof window !== 'undefined' && (window.wp?.element || window.React)?.Children) || {};
export const Fragment = (typeof window !== 'undefined' && (window.wp?.element || window.React)?.Fragment) || 'div';
export const StrictMode = (typeof window !== 'undefined' && (window.wp?.element || window.React)?.StrictMode) || Fragment;

export const jsx = (type, props, key) => {
  const el = getWp();
  const p = { ...props };
  if (key !== undefined) p.key = key;
  const children = p.children;
  delete p.children;
  if (children === undefined) {
    return el.createElement(type, p);
  }
  return Array.isArray(children)
    ? el.createElement(type, p, ...children)
    : el.createElement(type, p, children);
};
export const jsxs = jsx;
export const jsxDEV = jsx;

export const createRoot = (container) => {
  const dom = getWpDom();
  if (dom && dom.createRoot) {
    return dom.createRoot(container);
  }
  return {
    render: (node) => {
      if (dom && dom.render) dom.render(node, container);
    }
  };
};

export const render = (...args) => getWpDom().render(...args);
