import { createWorker } from 'tesseract.js';

export async function performLocalOcr(base64Image: string): Promise<string> {
  const worker = await createWorker('eng+chi_sim'); // 支持中英文
  const { data: { text } } = await worker.recognize(`data:image/png;base64,${base64Image}`);
  await worker.terminate();
  return text;
}
