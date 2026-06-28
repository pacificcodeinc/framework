export {};

declare global {
  interface Window {
    frameworkWindow?: {
      minimize: () => Promise<void>;
      toggleMaximize: () => Promise<void>;
      close: () => Promise<void>;
    };
  }
}
