const POLL_INTERVAL_MS = 2000;
const MAX_POLL_COUNT = 30;

const fileInput = document.getElementById('fileInput');
const uploadButton = document.getElementById('uploadButton');
const resetButton = document.getElementById('resetButton');
const statusElement = document.getElementById('status');
const resultImage = document.getElementById('resultImage');
const placeholder = document.getElementById('placeholder');
const objectKeyElement = document.getElementById('objectKey');
const resultUrlElement = document.getElementById('resultUrl');

const configEndpoint = ((window.APP_CONFIG && window.APP_CONFIG.signerEndpoint) || '').trim();

uploadButton.addEventListener('click', uploadImage);
resetButton.addEventListener('click', resetUi);

function setStatus(message, type = 'info') {
  statusElement.textContent = message;
  statusElement.dataset.state = type;
}

function resetUi() {
  fileInput.value = '';
  resultImage.removeAttribute('src');
  resultImage.classList.remove('is-visible');
  placeholder.classList.remove('hidden');
  objectKeyElement.textContent = '-';
  resultUrlElement.textContent = '-';
  setStatus('画像を選択してください。');
}

async function uploadImage() {
  const signerEndpoint = configEndpoint;
  const file = fileInput.files && fileInput.files[0];

  if (!signerEndpoint) {
    setStatus('config.js に signerEndpoint を設定してください。', 'error');
    return;
  }

  if (!file) {
    setStatus('先に画像ファイルを選択してください。', 'error');
    return;
  }

  uploadButton.disabled = true;
  setStatus('署名付きURLを取得しています...', 'busy');

  try {
    const requestUrl = buildSignerRequestUrl(signerEndpoint, file);

    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`署名付きURLの取得に失敗しました: ${response.status}`);
    }

    const payload = await response.json();
    const uploadUrl = payload.uploadUrl || payload.presignedUrl || payload.url;
    const resultUrl = payload.resultUrl || payload.outputUrl || payload.imageUrl;
    const objectKey = payload.key || payload.objectKey || payload.fileKey;

    if (!uploadUrl || !resultUrl) {
      throw new Error('API のレスポンスに uploadUrl または resultUrl がありません。');
    }

    objectKeyElement.textContent = objectKey || '-';
    resultUrlElement.textContent = resultUrl;

    setStatus('画像を Input Bucket にアップロードしています...', 'busy');
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'application/octet-stream'
      },
      body: file
    });

    if (!uploadResponse.ok) {
      throw new Error(`アップロードに失敗しました: ${uploadResponse.status}`);
    }

    setStatus('アップロード完了。合成画像の生成を待っています...', 'busy');
    await waitForProcessedImage(resultUrl);
    showResult(resultUrl);
    setStatus('合成画像を表示しました。', 'success');
  } catch (error) {
    console.error(error);
    setStatus(error.message || '処理中にエラーが発生しました。', 'error');
  } finally {
    uploadButton.disabled = false;
  }
}

async function waitForProcessedImage(resultUrl) {
  for (let attempt = 0; attempt < MAX_POLL_COUNT; attempt += 1) {
    const exists = await checkImageExists(resultUrl);
    if (exists) {
      return;
    }

    setStatus(`合成処理中です... (${attempt + 1}/${MAX_POLL_COUNT})`, 'busy');
    await delay(POLL_INTERVAL_MS);
  }

  throw new Error('合成画像の生成がタイムアウトしました。しばらくしてから再度お試しください。');
}

async function checkImageExists(resultUrl) {
  try {
    const response = await fetch(`${resultUrl}${resultUrl.includes('?') ? '&' : '?'}v=${Date.now()}`, {
      method: 'HEAD',
      cache: 'no-store'
    });
    return response.ok;
  } catch (error) {
    console.warn('HEAD check failed:', error);
    return false;
  }
}

function showResult(resultUrl) {
  placeholder.classList.add('hidden');
  resultImage.src = `${resultUrl}${resultUrl.includes('?') ? '&' : '?'}v=${Date.now()}`;
  resultImage.classList.add('is-visible');
}

function delay(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function buildSignerRequestUrl(endpoint, file) {
  const url = new URL(endpoint);
  url.searchParams.set('fileName', file.name || 'upload.png');
  url.searchParams.set('contentType', file.type || 'application/octet-stream');
  return url.toString();
}