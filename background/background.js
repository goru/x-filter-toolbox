if (typeof browser == "undefined") {
  globalThis.browser = chrome;
}

const hour = 60 * 60 * 1000;

async function update() {
  const configs = await browser.storage.local.get({
    'enabled': true,
    'remote': [],
    'url': ['https://raw.githubusercontent.com/goru/x-filter-toolbox/refs/heads/main/configs.json'],
    'updated': 0
  });

  // 機能が無効
  // 自動更新が無効
  // 24時間以上経っていない
  if (!configs.enabled
    || configs.updated == Number.MAX_SAFE_INTEGER
    || (Date.now() - configs.updated) < 24 * hour) {
    return;
  }

  // 全てのURLからJSONをダウンロード
  const promises = configs.url.map((u) => { return fetch(u) });
  const results = await Promise.all(
    (await Promise.allSettled(promises))
      .filter((r) => { return r.status == 'fulfilled' })
      .map((r) => { return r.value.json() })
  );

  // JSONからフィルタの配列を取り出して結合する
  const remote = results.map((r) => {
    return r.filters;
  }).flat();

  // 保存
  await browser.storage.local.set({
    'remote': remote,
    'updated': Date.now()
  });
}

// インストール、起動時に確認
update();

// 1時間おきに確認
(function check() {
  setTimeout(() => {
    update();
    check();
  }, hour);
})();
