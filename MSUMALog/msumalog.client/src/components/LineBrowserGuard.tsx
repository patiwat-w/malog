import { useEffect } from "react";

const getUniversalLink = (redirectUrl: string) => {
  const baseUrl = process.env.REACT_APP_UNIVERSAL_LINK_BASE || window.location.origin;
  return `${baseUrl}/open?redirect=${encodeURIComponent(redirectUrl)}`;
};

const getIntentUrl = () => {
  const host = window.location.host;
  const pathname = window.location.pathname;
  return `intent://${host}${pathname}#Intent;scheme=https;package=com.android.chrome;end`;
};

const LineBrowserGuard = () => {
  useEffect(() => {
    const ua = navigator.userAgent || (window as { opera?: string }).opera || "";

    if (/Line/i.test(ua)) {
      // Redirect to the universal link for iOS or Android
      const url = window.location.href;

      if (/iPhone|iPad|iPod/i.test(ua)) {
        window.location.href = getUniversalLink(url);
      } else if (/Android/i.test(ua)) {
        window.location.href = getIntentUrl();
      }
    }
  }, []);

  return null;
};

export default LineBrowserGuard;