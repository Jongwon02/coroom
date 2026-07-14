"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "narowbang.install.dismissed";

export default function PWA() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showAndroid, setShowAndroid] = useState(false);
  const [showIOS, setShowIOS] = useState(false);

  // 서비스 워커 등록
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const onLoad = () =>
        navigator.serviceWorker.register("/sw.js").catch(() => {
          /* 등록 실패는 조용히 무시 */
        });
      if (document.readyState === "complete") onLoad();
      else window.addEventListener("load", onLoad);
      return () => window.removeEventListener("load", onLoad);
    }
  }, []);

  // 설치 안내 배너 로직
  useEffect(() => {
    const dismissed = window.localStorage.getItem(DISMISS_KEY) === "1";

    // 이미 설치되어 실행 중(standalone)이면 배너 숨김
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (dismissed || isStandalone) return;

    // Android / Chrome: beforeinstallprompt 캡처
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setShowAndroid(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS Safari: beforeinstallprompt 미지원 → 수동 안내
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const isSafari = /safari/.test(ua) && !/crios|fxios|edgios/.test(ua);
    if (isIOS && isSafari) setShowIOS(true);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    window.localStorage.setItem(DISMISS_KEY, "1");
    setShowAndroid(false);
    setShowIOS(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setShowAndroid(false);
    window.localStorage.setItem(DISMISS_KEY, "1");
  };

  if (!showAndroid && !showIOS) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-brand-200 bg-white p-3 shadow-lg">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-200 to-brand-400 text-sm font-extrabold text-white">
          나
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-800">홈 화면에 추가</p>
          {showAndroid ? (
            <p className="text-xs text-slate-500">
              앱처럼 바로 열 수 있어요. 설치할까요?
            </p>
          ) : (
            <p className="text-xs leading-relaxed text-slate-500">
              하단 <span className="font-semibold text-brand-600">공유</span> 버튼 →{" "}
              <span className="font-semibold text-brand-600">홈 화면에 추가</span> 를 누르세요.
            </p>
          )}
        </div>
        {showAndroid && (
          <button
            onClick={install}
            className="shrink-0 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            설치
          </button>
        )}
        <button
          onClick={dismiss}
          aria-label="닫기"
          className="shrink-0 rounded-lg px-2 py-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
