if (typeof browser == "undefined") {
  globalThis.browser = chrome;
}

document.addEventListener('DOMContentLoaded', async () => {
  const configs = await browser.storage.local.get({
    'enabled': true,
    'local': [],
    'remote': [],
    'url': ['https://raw.githubusercontent.com/goru/x-filter-toolbox/refs/heads/main/configs.json'],
    'updated': 0
  });

  document.querySelector('#switch-enabled').checked = configs.enabled;
  document.querySelector('#textarea-local').value = filtersToText(configs.local);
  document.querySelector('#textarea-remote').value = filtersToText(configs.remote);
  document.querySelector('#textarea-url').value = configs.url.join('\n');
  document.querySelector('#checkbox-auto').checked = configs.updated != Number.MAX_SAFE_INTEGER;
});

document.querySelector('#switch-enabled').addEventListener('click', async (e) => {
  const enabled = document.querySelector('#switch-enabled').checked;

  await browser.storage.local.set({
    'enabled': enabled
  });
});

document.querySelector('#button-save').addEventListener('click', async (e) => {
  const local = arrayToFilters(textToArray(document.querySelector('#textarea-local').value));
  const remote = arrayToFilters(textToArray(document.querySelector('#textarea-remote').value));
  const url = textToArray(document.querySelector('#textarea-url').value);
  const updated = document.querySelector('#checkbox-auto').checked ? Date.now() : Number.MAX_SAFE_INTEGER;

  await browser.storage.local.set({
    'local': local,
    'remote': remote,
    'url': url,
    'updated': updated
  });
});

document.querySelector('#button-import').addEventListener('click', async (e) => {
  const url = textToArray(document.querySelector('#textarea-url').value);

  // 全てのURLからJSONをダウンロード
  const promises = url.map((u) => { return fetch(u) });
  const results = await Promise.all(
    (await Promise.allSettled(promises))
      .filter((r) => { return r.status == 'fulfilled' })
      .map((r) => { return r.value.json() })
  );

  // JSONからフィルタの中身を取り出して結合する
  const text = Array.from(new Set(results.map((r) => {
    return r.filters.map((f) => { return f.value })
  }).flat())).join('\n');

  document.querySelector('#textarea-remote').value = text;
});

function filtersToText(filters) {
  return filters.map((f) => { return f.value }).join('\n');
}

function textToArray(text) {
  const array = text
    // 改行で分割
    .split('\n')
    // 前後の空白を削除
    .map((t) => { return t.trim() })
    // 空行を削除
    .filter((t) => { return t != '' });
  // 重複を削除
  return Array.from(new Set(array));
}

function arrayToFilters(array) {
  return array.map((a) => {
    // とりあえずこの形式しか実装しない
    return { target: 'text', type: 'includes', value: a }
  });
}
