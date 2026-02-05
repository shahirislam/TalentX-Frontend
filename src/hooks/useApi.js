import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { getApi } from '../api/index.js';

export function useApi() {
  const auth = useAuth();
  const getToken = typeof auth.getIdToken === 'function' ? auth.getIdToken : () => Promise.resolve(null);
  return useMemo(() => getApi(getToken), [getToken]);
}
