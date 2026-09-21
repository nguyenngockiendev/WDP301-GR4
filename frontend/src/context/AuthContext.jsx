import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, send } from '../services/api';
const Context = createContext(null);
export const useAuth = () => useContext(Context);
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null),
    [error, setError] = useState('');
  const refresh = async () => {
    const result = await api('/session');
    setSession(result);
    return result;
  };
  useEffect(() => {
    refresh().catch(e => setError(e.message));
  }, []);
  if (error)
    return (
      <div className="container p-5">
        <h1>Unable to connect</h1>
        <p>{error}</p>
        <button onClick={() => location.reload()}>Try again</button>
      </div>
    );
  if (!session)
    return (
      <div className="p-5" role="status">
        Loading workspace…
      </div>
    );
  return (
    <Context.Provider
      value={{
        ...session,
        refresh,
        logout: async () => {
          await send('/auth/logout', {});
          await refresh();
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
