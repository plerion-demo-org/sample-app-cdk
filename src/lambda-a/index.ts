import _ from 'lodash';

export const handler = async (): Promise<{ statusCode: number; body: string }> => {    console.log('_', { _ });
  const msg = _.clone(['Hello from lambda-a using lodash v3.x', '— demo only']);
  console.log(msg);
  return { statusCode: 200, body: JSON.stringify({ ok: true, msg }) };
};
