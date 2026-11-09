declare module "pdf-parse/lib/pdf-parse.js" {
  const pdf: (data: Buffer) => Promise<{ numpages: number; text: string }>;
  export default pdf;
}
