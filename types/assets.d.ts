declare module '*.webp' {
  const source: import('react-native').ImageSourcePropType;

  export default source;
}

declare module 'pdfjs-dist/legacy/build/pdf.worker.mjs' {
  export const WorkerMessageHandler: unknown;
}
