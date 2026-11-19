/**
 * JAZTECH auth guard — uniform logout + block back-button after logout
 */
(function () {
  function getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token') || null;
  }

  function clearSession() {
    try {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('jaz_admin_token');
      localStorage.removeItem('jaz_admin_user');
    } catch (e) {}
  }

  function goLoginHard() {
    clearSession();
    // replace so Back cannot return to a protected page
    window.location.replace('login.html');
  }

  function ensurePopupCss() {
    if (document.getElementById('jazAuthPopupStyle')) return;
    var s = document.createElement('style');
    s.id = 'jazAuthPopupStyle';
    s.textContent = [
      '.app-popup-overlay{position:fixed;inset:0;background:rgba(0,0,0,.72);display:none;align-items:center;justify-content:center;z-index:99999;padding:16px;}',
      '.app-popup-overlay.open{display:flex;}',
      '.app-popup{background:#161d2d;border:1px solid #1f2937;border-radius:16px;padding:28px 22px 20px;max-width:340px;width:100%;text-align:center;color:#e5e7eb;box-shadow:0 20px 50px rgba(0,0,0,.5);}',
      '.app-popup .brand{color:#f59e0b;font-weight:800;letter-spacing:.06em;font-size:.8rem;margin-bottom:10px;}',
      '.app-popup .icon{width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-size:1.35rem;}',
      '.app-popup.success .icon{background:rgba(16,185,129,.15);color:#10b981;}',
      '.app-popup.error .icon{background:rgba(239,68,68,.15);color:#ef4444;}',
      '.app-popup.info .icon,.app-popup.confirm .icon{background:rgba(245,158,11,.15);color:#f59e0b;}',
      '.app-popup h3{margin:0 0 8px;font-size:1.15rem;color:#fff;}',
      '.app-popup p{margin:0 0 18px;color:#9ca3af;font-size:.92rem;line-height:1.5;}',
      '.app-popup .ok-btn,.app-popup .cancel-btn{border:none;border-radius:10px;padding:12px 18px;font-weight:700;cursor:pointer;font-size:.95rem;min-width:100px;}',
      '.app-popup .ok-btn{background:#f59e0b;color:#111;}',
      '.app-popup .cancel-btn{background:#1f2937;color:#e5e7eb;margin-right:8px;}',
      '.app-popup .btn-row{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;}'
    ].join('');
    document.head.appendChild(s);
  }

  window.showAppPopup = window.showAppPopup || function (options) {
    ensurePopupCss();
    var opts = typeof options === 'string' ? { message: options, type: 'info' } : (options || {});
    var type = opts.type || 'info';
    var title = opts.title || (type === 'success' ? 'Success' : type === 'error' ? 'Error' : type === 'confirm' ? 'Confirm' : 'Notice');
    var message = opts.message || '';
    var onOk = opts.onOk || null;
    var onCancel = opts.onCancel || null;
    var okText = opts.okText || 'OK';
    var cancelText = opts.cancelText || 'Cancel';
    var showCancel = type === 'confirm' || opts.showCancel;

    var overlay = document.getElementById('appPopupOverlay');
    if (!overlay) {
      document.body.insertAdjacentHTML('beforeend',
        '<div class="app-popup-overlay" id="appPopupOverlay">' +
        '<div class="app-popup success" id="appPopup">' +
        '<div class="brand">JAZTECH</div>' +
        '<div class="icon" id="appPopupIcon"><i class="fa-solid fa-check"></i></div>' +
        '<h3 id="appPopupTitle">Success</h3>' +
        '<p id="appPopupMessage">Done.</p>' +
        '<div class="btn-row" id="appPopupBtns">' +
        '<button type="button" class="cancel-btn" id="appPopupCancel" style="display:none">Cancel</button>' +
        '<button type="button" class="ok-btn" id="appPopupOk">OK</button>' +
        '</div></div></div>');
      overlay = document.getElementById('appPopupOverlay');
    }
    var box = document.getElementById('appPopup');
    var icon = document.getElementById('appPopupIcon');
    var titleEl = document.getElementById('appPopupTitle');
    var msgEl = document.getElementById('appPopupMessage');
    var okBtn = document.getElementById('appPopupOk');
    var cancelBtn = document.getElementById('appPopupCancel');

    box.className = 'app-popup ' + (type === 'confirm' ? 'confirm' : type);
    if (type === 'success') icon.innerHTML = '<i class="fa-solid fa-check"></i>';
    else if (type === 'error') icon.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    else icon.innerHTML = '<i class="fa-solid fa-circle-info"></i>';
    titleEl.textContent = title;
    msgEl.textContent = message;
    okBtn.textContent = okText;
    cancelBtn.textContent = cancelText;
    cancelBtn.style.display = showCancel ? 'inline-block' : 'none';
    overlay.classList.add('open');

    okBtn.onclick = function () {
      overlay.classList.remove('open');
      if (typeof onOk === 'function') onOk();
    };
    cancelBtn.onclick = function () {
      overlay.classList.remove('open');
      if (typeof onCancel === 'function') onCancel();
    };
  };

  window.jazConfirmLogout = function () {
    showAppPopup({
      type: 'confirm',
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      okText: 'Logout',
      cancelText: 'Stay',
      showCancel: true,
      onOk: function () {
        try { fetch('/api/logout', { method: 'POST' }).catch(function () {}); } catch (e) {}
        goLoginHard();
      }
    });
  };

  window.jazRequireAuth = function () {
    if (!getToken()) {
      goLoginHard();
      return false;
    }
    return true;
  };

  // Block bfcache / back button from showing logged-out protected pages
  window.addEventListener('pageshow', function (e) {
    var path = (location.pathname || '').toLowerCase();
    var isPublic = /login\.html|register\.html|forgot-password\.html|terms\.html|privacy\.html/.test(path) || path === '/' || path.endsWith('/');
    if (isPublic) return;
    if (path.indexOf('admin') !== -1) return; // admin has its own guard
    if (!getToken()) {
      goLoginHard();
    }
  });

  // Expose helpers
  window.jazClearSession = clearSession;
  window.jazGoLoginHard = goLoginHard;
  window.jazGetToken = getToken;
})();
