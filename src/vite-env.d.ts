/// <reference types="vite/client" />
declare module 'algebrite' {
  const Algebrite: { run(code: string): string; eval(code: string): unknown };
  export default Algebrite;
}
