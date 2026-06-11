import axios from 'axios';

interface FFlogsTokenResponse {
  access_token: string;
}

interface GraphqlResponse<T> {
  data?: T;
  errors?: unknown[];
}

export async function getAccessToken(): Promise<string> {
  const clientId = process.env.FFLOGS_CLIENT_ID?.trim();
  console.log('clientId::: ', clientId);
  const clientSecret = process.env.FFLOGS_CLIENT_SECRET?.trim();
  console.log('clientSecret::: ', clientSecret);

  if (!clientId || !clientSecret) {
    throw new Error('請確認環境變數有設定 FFLOGS_CLIENT_ID 與 FFLOGS_CLIENT_SECRET');
  }

  const res = await axios.post<FFlogsTokenResponse>(
    'https://www.fflogs.com/oauth/token',
    new URLSearchParams({
      grant_type: 'client_credentials',
    }),
    {
      auth: {
        username: clientId,
        password: clientSecret,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    },
  );

  return res.data.access_token;
}

export async function queryFflogs<TData, TVariables extends Record<string, unknown>>(
  token: string,
  query: string,
  variables: TVariables,
): Promise<TData> {
  const res = await axios.post<GraphqlResponse<TData>>(
    'https://www.fflogs.com/api/v2/client',
    {
      query,
      variables,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (res.data.errors?.length) {
    console.error('[FFLogs GraphQL errors]', res.data.errors);
    throw new Error('FFLogs GraphQL query failed');
  }

  if (!res.data.data) {
    throw new Error('FFLogs GraphQL response data is empty');
  }

  return res.data.data;
}