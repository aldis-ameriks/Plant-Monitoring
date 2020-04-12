import { ACCESS_KEY } from '../config';
import { getUserByAccessKey } from './getUserByAccessKey';

import { Context } from 'types/context';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createRequestContext(headers: { [key: string]: any }, ip: string): Promise<Context> {
  const accessKeyHeader = headers['access-key'];
  let accessKey = Array.isArray(accessKeyHeader) ? accessKeyHeader[0] : accessKeyHeader;

  if (!accessKey && ACCESS_KEY) {
    accessKey = ACCESS_KEY;
  }

  if (!accessKey) {
    return { user: undefined, ip };
  }

  const user = await getUserByAccessKey(accessKey);
  return { user, ip };
}
