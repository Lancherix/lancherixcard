import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setToken } from "../utils/auth";
import { useAppData } from "../context/AppContext";

import symbol from "./assets/symbolBlue.png";

// LancherixAuth's LoginPage redirects here as:
//   `${redirectBase}/auth/callback?token=${data.token}`
export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshState } = useAppData();

  useEffect(() => {
    const token = searchParams.get("token");

    if (token) {
      setToken(token);
      // AppProvider only auto-loads on mount, and it doesn't remount when we
      // navigate to "/" — so we trigger the hydration explicitly here,
      // right after the token becomes available.
      refreshState().finally(() => navigate("/", { replace: true }));
    } else {
      // Someone hit this route without a token — treat like "not logged in".
      navigate("/redirecting", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
      <div className="app-loading-screen">
        <img src={symbol} alt="Lancherix" className="app-loading-logo" />
      </div>
    );
}