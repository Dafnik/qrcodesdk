/** Vite resolves `?url` imports to the served URL of the asset. */
declare module '*?url' {
  const url: string;
  export default url;
}
