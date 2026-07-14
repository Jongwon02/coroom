// 나눠방 PWA Service Worker
// 목표: 인터넷이 없어도 마지막으로 본 화면(과 데이터)이 그대로 뜨도록 캐싱한다.
const CACHE = "narowbang-v3";
const SUPABASE_ORIGIN = "https://omznpynrenhfyhkhbuce.supabase.co";
const OFFLINE_FALLBACK = "/";

// 설치 시 최소 앱 셸을 미리 캐시
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll([OFFLINE_FALLBACK, "/my"]).catch(() => {}))
  );
  self.skipWaiting();
});

// 이전 버전 캐시 정리
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function putInCache(request, response) {
  // 정상 응답만 캐시 (opaque/에러 제외)
  if (!response || !response.ok || response.type === "opaque") return;
  const clone = response.clone();
  caches.open(CACHE).then((cache) => cache.put(request, clone));
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const isSupabase = url.origin === SUPABASE_ORIGIN;
  if (!sameOrigin && !isSupabase) return;

  // 페이지 이동(navigation): 네트워크 우선 → 실패 시 캐시 → 그래도 없으면 홈
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          putInCache(req, res);
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          return cached || (await caches.match(OFFLINE_FALLBACK)) || Response.error();
        })
    );
    return;
  }

  // Supabase 데이터: stale-while-revalidate (오프라인 시 마지막 데이터 노출)
  // 정적 자원(_next 등)도 동일 전략으로 즉시 응답 + 백그라운드 갱신
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          putInCache(req, res);
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
