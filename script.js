/**
 * 通信費・固定費見直しナビ - メインスクリプト (script.js)
 * 依存関係なし・外部通信なし・クライアント完結の静的Webサイト
 */

(function () {
  'use strict';

  // --- 1. ルーティング（ハッシュベースのページ切り替え） ---
  const validPages = [
    'top',
    'sim-cost',
    'sub-cost',
    'fixed-cost',
    'savings-calc',
    'sim-precheck',
    'sim-compare',
    'kakeibo-guide',
    'fixed-guide',
    'about',
    'disclaimer',
    'privacy',
    'ad-policy',
    'contact'
  ];

  function navigateTo(pageId) {
    if (!validPages.includes(pageId)) {
      pageId = 'top';
    }

    // 全ページビューの非表示 & 該当ページの表示
    const pageViews = document.querySelectorAll('.page-view');
    pageViews.forEach(view => {
      view.classList.remove('active');
    });

    const activeView = document.getElementById('page-' + pageId);
    if (activeView) {
      activeView.classList.add('active');
    }

    // ナビゲーションリンクのアクティブ状態更新
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      const href = link.getAttribute('href') || '';
      if (href === '#' + pageId || (pageId === 'top' && href === '#top')) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // モバイルメニューを閉じる
    const siteNav = document.getElementById('site-nav');
    if (siteNav) {
      siteNav.classList.remove('open');
    }

    // 画面トップへスクロール
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleHashChange() {
    const hash = window.location.hash.replace('#', '') || 'top';
    navigateTo(hash);
  }

  // --- 2. 汎用バリデーション & フォーマット関数 ---
  function formatYen(val) {
    if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) {
      return '0円';
    }
    return Math.round(val).toLocaleString('ja-JP') + '円';
  }

  function parseInputNumber(inputEl, errorEl, options = {}) {
    const {
      allowEmpty = false,
      defaultValue = 0,
      min = 0,
      max = 1000000000,
      fieldName = '数値'
    } = options;

    const rawVal = inputEl.value.trim();

    // 空欄の場合
    if (rawVal === '') {
      if (allowEmpty) {
        clearError(inputEl, errorEl);
        return defaultValue;
      } else {
        showError(inputEl, errorEl, `${fieldName}を入力してください（0以上の半角数字）`);
        return null;
      }
    }

    // 全角数字を半角に自動変換
    const normalized = rawVal.replace(/[０-９]/g, function (s) {
      return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    }).replace(/,/g, '');

    const num = Number(normalized);

    // 数字以外の文字またはNaN
    if (isNaN(num) || !isFinite(num)) {
      showError(inputEl, errorEl, `${fieldName}は有効な半角数字で入力してください`);
      return null;
    }

    // 負の数チェック
    if (num < min) {
      showError(inputEl, errorEl, `${fieldName}は${min}以上の数値を入力してください`);
      return null;
    }

    // 極端に大きい数値チェック
    if (num > max) {
      showError(inputEl, errorEl, `${fieldName}の値が大きすぎます（${max.toLocaleString()}以下で入力してください）`);
      return null;
    }

    clearError(inputEl, errorEl);
    return num;
  }

  function showError(inputEl, errorEl, message) {
    if (inputEl) inputEl.classList.add('error');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('visible');
    }
  }

  function clearError(inputEl, errorEl) {
    if (inputEl) inputEl.classList.remove('error');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.remove('visible');
    }
  }

  // --- 3. ツール1: スマホ代年間コスト計算 ---
  function initSimCostCalculator() {
    const form = document.getElementById('sim-cost-form');
    const resetBtn = document.getElementById('sim-cost-reset');
    const resultBox = document.getElementById('sim-cost-result');

    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const baseInput = document.getElementById('sim-base');
      const baseErr = document.getElementById('sim-base-error');
      const deviceInput = document.getElementById('sim-device');
      const deviceErr = document.getElementById('sim-device-error');
      const optionInput = document.getElementById('sim-option');
      const optionErr = document.getElementById('sim-option-error');
      const discountInput = document.getElementById('sim-discount');
      const discountErr = document.getElementById('sim-discount-error');
      const monthsInput = document.getElementById('sim-months');
      const monthsErr = document.getElementById('sim-months-error');

      const baseVal = parseInputNumber(baseInput, baseErr, { fieldName: 'スマホ料金の月額' });
      const deviceVal = parseInputNumber(deviceInput, deviceErr, { allowEmpty: true, defaultValue: 0, fieldName: '端末代金の月額' });
      const optionVal = parseInputNumber(optionInput, optionErr, { allowEmpty: true, defaultValue: 0, fieldName: 'オプション料金の月額' });
      const discountVal = parseInputNumber(discountInput, discountErr, { allowEmpty: true, defaultValue: 0, fieldName: '割引額の月額' });
      const monthsVal = parseInputNumber(monthsInput, monthsErr, { min: 1, max: 120, fieldName: '利用予定の月数' });

      if (baseVal === null || deviceVal === null || optionVal === null || discountVal === null || monthsVal === null) {
        resultBox.classList.add('hidden');
        return;
      }

      // 毎月の実質支払額
      const monthlyTotal = Math.max(0, baseVal + deviceVal + optionVal - discountVal);
      const oneYearTotal = monthlyTotal * 12;
      const twoYearsTotal = monthlyTotal * 24;
      const customTotal = monthlyTotal * monthsVal;

      document.getElementById('sim-res-monthly').textContent = formatYen(monthlyTotal);
      document.getElementById('sim-res-1year').textContent = formatYen(oneYearTotal);
      document.getElementById('sim-res-2year').textContent = formatYen(twoYearsTotal);
      document.getElementById('sim-res-custom-months').textContent = `${monthsVal}か月`;
      document.getElementById('sim-res-custom-val').textContent = formatYen(customTotal);

      // 極端な金額のヒント警告
      const alertBox = document.getElementById('sim-cost-warning');
      if (monthlyTotal > 15000) {
        alertBox.textContent = `【ご注意】月額のお支払いが${formatYen(monthlyTotal)}と高めです。大容量プランや不要な端末代・オプションが含まれていないか、公式サイトや契約明細で確認しましょう。`;
        alertBox.style.display = 'block';
      } else {
        alertBox.style.display = 'none';
      }

      resultBox.classList.remove('hidden');
      resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    resetBtn.addEventListener('click', function () {
      form.reset();
      resultBox.classList.add('hidden');
      const errors = form.querySelectorAll('.form-error');
      errors.forEach(el => {
        el.textContent = '';
        el.classList.remove('visible');
      });
      const inputs = form.querySelectorAll('.form-input');
      inputs.forEach(el => el.classList.remove('error'));
      const alertBox = document.getElementById('sim-cost-warning');
      if (alertBox) alertBox.style.display = 'none';
    });
  }

  // --- 4. ツール2: サブスク年間コスト計算 ---
  function initSubCostCalculator() {
    const form = document.getElementById('sub-cost-form');
    const resetBtn = document.getElementById('sub-cost-reset');
    const resultBox = document.getElementById('sub-cost-result');

    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const videoInput = document.getElementById('sub-video');
      const videoErr = document.getElementById('sub-video-error');
      const musicInput = document.getElementById('sub-music');
      const musicErr = document.getElementById('sub-music-error');
      const gameInput = document.getElementById('sub-game');
      const gameErr = document.getElementById('sub-game-error');
      const appInput = document.getElementById('sub-app');
      const appErr = document.getElementById('sub-app-error');
      const otherInput = document.getElementById('sub-other');
      const otherErr = document.getElementById('sub-other-error');

      const videoVal = parseInputNumber(videoInput, videoErr, { allowEmpty: true, defaultValue: 0, fieldName: '動画サービス' });
      const musicVal = parseInputNumber(musicInput, musicErr, { allowEmpty: true, defaultValue: 0, fieldName: '音楽サービス' });
      const gameVal = parseInputNumber(gameInput, gameErr, { allowEmpty: true, defaultValue: 0, fieldName: 'ゲームサービス' });
      const appVal = parseInputNumber(appInput, appErr, { allowEmpty: true, defaultValue: 0, fieldName: 'アプリ課金' });
      const otherVal = parseInputNumber(otherInput, otherErr, { allowEmpty: true, defaultValue: 0, fieldName: 'その他定額サービス' });

      if (videoVal === null || musicVal === null || gameVal === null || appVal === null || otherVal === null) {
        resultBox.classList.add('hidden');
        return;
      }

      const monthlyTotal = videoVal + musicVal + gameVal + appVal + otherVal;
      const annualTotal = monthlyTotal * 12;

      document.getElementById('sub-res-monthly').textContent = formatYen(monthlyTotal);
      document.getElementById('sub-res-annual').textContent = formatYen(annualTotal);

      // アドバイス文の生成
      const adviceEl = document.getElementById('sub-res-advice');
      if (monthlyTotal === 0) {
        adviceEl.textContent = '現在定額サブスクの出費は0円です。今後利用を始める際も、月々の固定費を意識しておくと安心です。';
      } else if (monthlyTotal >= 5000) {
        adviceEl.textContent = `サブスクの合計が毎月${formatYen(monthlyTotal)}（年間${formatYen(annualTotal)}）となっています。複数ある動画や音楽配信で最近使っていないサービスがないか、アカウントの契約履歴を確認してみましょう。`;
      } else {
        adviceEl.textContent = `月額${formatYen(monthlyTotal)}（年間${formatYen(annualTotal)}）のサブスク費用がかかっています。1か月以上視聴していない動画や使っていないアプリがないか、定期的に見直す習慣がおすすめです。`;
      }

      resultBox.classList.remove('hidden');
      resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    resetBtn.addEventListener('click', function () {
      form.reset();
      resultBox.classList.add('hidden');
      const errors = form.querySelectorAll('.form-error');
      errors.forEach(el => {
        el.textContent = '';
        el.classList.remove('visible');
      });
      const inputs = form.querySelectorAll('.form-input');
      inputs.forEach(el => el.classList.remove('error'));
    });
  }

  // --- 5. ツール3: 固定費チェック診断 ---
  function initFixedCostCalculator() {
    const form = document.getElementById('fixed-cost-form');
    const resetBtn = document.getElementById('fixed-cost-reset');
    const resultBox = document.getElementById('fixed-cost-result');

    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const phoneInput = document.getElementById('fixed-phone');
      const phoneErr = document.getElementById('fixed-phone-error');
      const netInput = document.getElementById('fixed-net');
      const netErr = document.getElementById('fixed-net-error');
      const subInput = document.getElementById('fixed-sub');
      const subErr = document.getElementById('fixed-sub-error');
      const insInput = document.getElementById('fixed-ins');
      const insErr = document.getElementById('fixed-ins-error');
      const utilityInput = document.getElementById('fixed-utility');
      const utilityErr = document.getElementById('fixed-utility-error');
      const otherInput = document.getElementById('fixed-other');
      const otherErr = document.getElementById('fixed-other-error');

      const phoneVal = parseInputNumber(phoneInput, phoneErr, { allowEmpty: true, defaultValue: 0, fieldName: 'スマホ料金' });
      const netVal = parseInputNumber(netInput, netErr, { allowEmpty: true, defaultValue: 0, fieldName: 'インターネット料金' });
      const subVal = parseInputNumber(subInput, subErr, { allowEmpty: true, defaultValue: 0, fieldName: 'サブスク料金' });
      const insVal = parseInputNumber(insInput, insErr, { allowEmpty: true, defaultValue: 0, fieldName: '保険料' });
      const utilityVal = parseInputNumber(utilityInput, utilityErr, { allowEmpty: true, defaultValue: 0, fieldName: '電気・ガス料金' });
      const otherVal = parseInputNumber(otherInput, otherErr, { allowEmpty: true, defaultValue: 0, fieldName: 'その他の固定費' });

      if (phoneVal === null || netVal === null || subVal === null || insVal === null || utilityVal === null || otherVal === null) {
        resultBox.classList.add('hidden');
        return;
      }

      const monthlyTotal = phoneVal + netVal + subVal + insVal + utilityVal + otherVal;
      const annualTotal = monthlyTotal * 12;

      document.getElementById('fixed-res-monthly').textContent = formatYen(monthlyTotal);
      document.getElementById('fixed-res-annual').textContent = formatYen(annualTotal);

      // 内訳カード
      document.getElementById('fixed-res-phone').textContent = formatYen(phoneVal);
      document.getElementById('fixed-res-net').textContent = formatYen(netVal);
      document.getElementById('fixed-res-sub').textContent = formatYen(subVal);
      document.getElementById('fixed-res-ins').textContent = formatYen(insVal);
      document.getElementById('fixed-res-utility').textContent = formatYen(utilityVal);
      document.getElementById('fixed-res-other').textContent = formatYen(otherVal);

      resultBox.classList.remove('hidden');
      resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    resetBtn.addEventListener('click', function () {
      form.reset();
      resultBox.classList.add('hidden');
      const errors = form.querySelectorAll('.form-error');
      errors.forEach(el => {
        el.textContent = '';
        el.classList.remove('visible');
      });
      const inputs = form.querySelectorAll('.form-input');
      inputs.forEach(el => el.classList.remove('error'));
    });
  }

  // --- 6. ツール4: 貯金目標シミュレーター ---
  function initSavingsCalculator() {
    const form = document.getElementById('savings-form');
    const resetBtn = document.getElementById('savings-reset');
    const resultBox = document.getElementById('savings-result');

    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const targetInput = document.getElementById('savings-target');
      const targetErr = document.getElementById('savings-target-error');
      const currentInput = document.getElementById('savings-current');
      const currentErr = document.getElementById('savings-current-error');
      const monthlyInput = document.getElementById('savings-monthly');
      const monthlyErr = document.getElementById('savings-monthly-error');

      const targetVal = parseInputNumber(targetInput, targetErr, { min: 1, fieldName: '目標金額' });
      const currentVal = parseInputNumber(currentInput, currentErr, { allowEmpty: true, defaultValue: 0, fieldName: '今ある貯金' });
      const monthlyVal = parseInputNumber(monthlyInput, monthlyErr, { min: 1, fieldName: '毎月貯める金額' });

      if (targetVal === null || currentVal === null || monthlyVal === null) {
        resultBox.classList.add('hidden');
        return;
      }

      const diff = targetVal - currentVal;
      const remainingAmount = Math.max(0, diff);

      document.getElementById('savings-res-diff').textContent = formatYen(remainingAmount);

      const monthsBox = document.getElementById('savings-res-months');
      const weeklyBox = document.getElementById('savings-res-weekly');
      const hintBox = document.getElementById('savings-res-hint');

      if (remainingAmount === 0) {
        monthsBox.textContent = '目標達成済み！';
        weeklyBox.textContent = '0円';
        hintBox.textContent = 'すばらしいです！現在の貯金額で目標金額に到達しています。次の目標設定や、生活防衛資金の維持を検討しましょう。';
      } else {
        const totalMonths = Math.ceil(remainingAmount / monthlyVal);
        const years = Math.floor(totalMonths / 12);
        const months = totalMonths % 12;

        let timeStr = '';
        if (years > 0 && months > 0) {
          timeStr = `${years}年${months}か月（約${totalMonths}か月）`;
        } else if (years > 0) {
          timeStr = `${years}年間（${totalMonths}か月）`;
        } else {
          timeStr = `${totalMonths}か月`;
        }
        monthsBox.textContent = timeStr;

        // 1週間あたりの目安 (1ヶ月を約4.33週として計算)
        const weeklyEstimate = Math.round(monthlyVal / 4.33);
        weeklyBox.textContent = `約 ${formatYen(weeklyEstimate)}`;

        hintBox.textContent = `毎月${formatYen(monthlyVal)}を継続して貯めることで、約${timeStr}で目標の${formatYen(targetVal)}に届きます。スマホ代や使っていないサブスクなど固定費を毎月数千円見直すだけで、期間を短縮したり月々の負担を軽減できます。`;
      }

      resultBox.classList.remove('hidden');
      resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    resetBtn.addEventListener('click', function () {
      form.reset();
      resultBox.classList.add('hidden');
      const errors = form.querySelectorAll('.form-error');
      errors.forEach(el => {
        el.textContent = '';
        el.classList.remove('visible');
      });
      const inputs = form.querySelectorAll('.form-input');
      inputs.forEach(el => el.classList.remove('error'));
    });
  }

  // --- 7. モバイルメニュートグル ---
  function initMobileMenu() {
    const menuBtn = document.getElementById('menu-toggle');
    const siteNav = document.getElementById('site-nav');

    if (!menuBtn || !siteNav) return;

    menuBtn.addEventListener('click', function () {
      siteNav.classList.toggle('open');
      const isExpanded = siteNav.classList.contains('open');
      menuBtn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    });

    // 画面外クリックで閉じる
    document.addEventListener('click', function (e) {
      if (!siteNav.contains(e.target) && !menuBtn.contains(e.target)) {
        siteNav.classList.remove('open');
      }
    });
  }

  // --- 8. 初期化 ---
  document.addEventListener('DOMContentLoaded', function () {
    initMobileMenu();
    initSimCostCalculator();
    initSubCostCalculator();
    initFixedCostCalculator();
    initSavingsCalculator();

    // ハッシュ変更監視
    window.addEventListener('hashchange', handleHashChange);

    // 初回表示
    handleHashChange();
  });
})();
