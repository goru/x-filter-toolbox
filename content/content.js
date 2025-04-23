if (typeof browser == "undefined") {
  globalThis.browser = chrome;
}

function getPosts() {
  return Array.from(document.querySelectorAll('div[data-testid="cellInnerDiv"]'));
}

function hasText(e) {
  // テキストがある
  return e.querySelector('div[data-testid="tweetText"]') != null;
}

function isVisible(e) {
  // 全体が画面内に収まっている
  const rect = e.getBoundingClientRect();
  return 0 < rect.top && rect.bottom < window.innerHeight;
}

function isNgWord(e, ngword) {
  if (ngword.length == 0) {
    return false;
  }
  // NGワードを含む
  const text = e.innerText.split('\n').join();
  return ngword.some((w) => { return text.includes(w) });
}

//function isNgUserId(e) {
//  // NGユーザーIDと一致する
//  const userId = e.querySelector('div[data-testid="User-Name"]')
//    .firstChild.querySelector('a').attributes.href.value;
//}
//
//function isNgUserName(e) {
//  // ユーザー名にNGワードを含む
//  const userName = e.querySelector('div[data-testid="User-Name"]')
//    .firstChild.querySelector('a').querySelector('span > span').innerText;
//}

function isNgPost(e, configs) {
  const filters = configs.local.concat(configs.remote)
    .filter((f) => {
      // とりあえずこの形式しか実装しない
      return f.target == 'text' && f.type == 'includes';
    })
    .map((f) => { return f.value });
  const ngword = Array.from(new Set(filters));

  // NG条件に一致する
  return isNgWord(e, ngword);
    //|| isNgUserId(e) || isNgUserName(e);
}

async function blurFilteredPosts() {
  const configs = await browser.storage.local.get({
    'enabled': true,
    'local': [],
    'remote': []
  });

  const posts = getPosts()
    // 一度すべて戻す
    .map((e) => {
      e.style['filter'] = '';
      return e;
    });

  if (!configs.enabled) {
    return;
  }

  posts
    // テキストがある
    .filter(hasText)
    // 見えていないポストも対象
    //.filter(isVisible)
    // NG条件に一致する
    .filter((e) => { return isNgPost(e, configs) })
    .forEach((e) => {
      e.style['filter'] = 'blur(4px)';
    });
}

function wait(delay) {
  return new Promise((resolve) => { setTimeout(resolve, delay); });
}

function waitFor(check, delay, repeat) {
  return new Promise(async (resolve, reject) => {
    while (repeat-- > 0) {
      if (check()) {
        resolve(true);
        return;
      }
      await wait(delay);
    }
    resolve(false);
  });
}

async function muteFilteredPosts() {
  const configs = await browser.storage.local.get({
    'enabled': true,
    'local': [],
    'remote': []
  });

  if (!configs.enabled) {
    return;
  }

  const posts = getPosts()
    // テキストがある
    .filter(hasText)
    // 見えてるポストだけ対象
    .filter(isVisible)
    // NG条件に一致する
    .filter((e) => { return isNgPost(e, configs) });

  for (const p of posts) {
    // メニューを出す
    p.querySelector('button[data-testid="caret"]').click();

    // メニューが出るまで待つ
    let check = await waitFor(() => {
      return document.querySelector('div[data-testid="block"]') != null;
    }, 10, 20);
    if (!check) {
      // なにかがおかしい
      break;
    }

    // "ミュート"を押す
    document.querySelector('div[data-testid="block"]').previousSibling.click();

    await wait(200);
  }
}

async function blockFilteredPosts() {
  const configs = await browser.storage.local.get({
    'enabled': true,
    'local': [],
    'remote': []
  });

  if (!configs.enabled) {
    return;
  }

  const posts = getPosts()
    // テキストがある
    .filter(hasText)
    // 見えてるポストだけ対象
    .filter(isVisible)
    // NG条件に一致する
    .filter((e) => { return isNgPost(e, configs) });

  for (const p of posts) {
    // 位置調整
    //p.scrollIntoView({behavior: 'instant', block: 'end'});

    // メニューを出す
    p.querySelector('button[data-testid="caret"]').click();

    // メニューが出るまで待つ
    let check = await waitFor(() => {
      return document.querySelector('div[data-testid="block"]') != null;
    }, 10, 20);
    if (!check) {
      // なにかがおかしい
      break;
    }

    // "ブロック"を押す
    document.querySelector('div[data-testid="block"]').click();

    // 確認画面が出るまで待つ
    check = await waitFor(() => {
      return document.querySelector('button[data-testid="confirmationSheetConfirm"]') != null;
    }, 10, 20);

    // Control Panel for Twitter等で確認画面がスキップされている場合がある
    if (!check) {
      continue;
    }

    // 確認画面をOKで閉じる
    document.querySelector('button[data-testid="confirmationSheetConfirm"]').click();

    await wait(200);
  }
}

const observer = new MutationObserver(() => { blurFilteredPosts() });
async function update() {
  const configs = await browser.storage.local.get({
    'enabled': true
  });

  // 表示非表示の状態を更新
  blurFilteredPosts();

  if (configs.enabled) {
    // 監視する
    observer.observe(document.querySelector('main'), { subtree: true, childList: true });
  } else {
    // 監視をやめる
    observer.disconnect();
  }
}

// ポストが表示されるまで待つ
let timeout = 600;
(function init() {
  setTimeout(() => {
    if (timeout-- <= 0) {
      return;
    }

    if (getPosts().length == 0) {
      init();
    } else {
      update();
    }
  }, 100);
})();
