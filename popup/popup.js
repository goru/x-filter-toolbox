if (typeof browser == "undefined") {
  globalThis.browser = chrome;
}

document.addEventListener('DOMContentLoaded', async () => {
  const configs = await browser.storage.local.get({
    'enabled': true
  });
  document.querySelector('#switch-enabled').checked = configs.enabled;
});

document.querySelector('#switch-enabled').addEventListener('click', async (e) => {
  const enabled = document.querySelector('#switch-enabled').checked;

  await browser.storage.local.set({
    'enabled': enabled
  });
});

document.querySelector('#button-mute').addEventListener('click', async (e) => {
  (await browser.tabs.query({ 
    active: true,
    currentWindow: true,
    url: [
      'https://x.com/*',
      'https://mobile.x.com/*',
      'https://twitter.com/*',
      'https://mobile.twitter.com/*'
    ]
  })).forEach((t) => {
    browser.scripting.executeScript({ target: { tabId: t.id }, func: () => { muteFilteredPosts() } });
  });
});

document.querySelector('#button-block').addEventListener('click', async (e) => {
  (await browser.tabs.query({ 
    active: true,
    currentWindow: true,
    url: [
      'https://x.com/*',
      'https://mobile.x.com/*',
      'https://twitter.com/*',
      'https://mobile.twitter.com/*'
    ]
  })).forEach((t) => {
    browser.scripting.executeScript({ target: { tabId: t.id }, func: () => { blockFilteredPosts() } });
  });
});

document.querySelector('#button-options').addEventListener('click', async (e) => {
  browser.runtime.openOptionsPage();
  window.close();
});
