import axios from 'axios';

export const handler = async (): Promise<{ statusCode: number; body: string }> => {
  const msg = `Hello from lambda-b using axios v1.2.x — demo only. Axios keys: ${Object.keys(axios).length}`;
  console.log(msg);
  return { statusCode: 200, body: JSON.stringify({ ok: true, msg }) };
};


