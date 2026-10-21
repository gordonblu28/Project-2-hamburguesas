// En el Worker, wrangler importa los .yaml como texto (regla "Text" de wrangler.jsonc).
declare module '*.yaml' {
  const texto: string;
  export default texto;
}
