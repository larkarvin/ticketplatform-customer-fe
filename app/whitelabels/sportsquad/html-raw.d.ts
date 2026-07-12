// Allow importing the ported Martex markup as a raw string (Vite ?raw suffix).
declare module '*.html?raw' {
  const content: string
  export default content
}
