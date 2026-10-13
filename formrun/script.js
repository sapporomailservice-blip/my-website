// ===== お問い合わせフォームの動き =====
// ※ formrun の送信処理（送信ボタンの制御・エラー表示）には触れていません

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form.formrun');
  if (!form) return;

  // メールアドレスの形式チェック
  const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  // 入力済みかどうか（チェックボックス・メール・それ以外）
  const isFilled = (el) => {
    if (el.type === 'checkbox') return el.checked;
    if (el.dataset.formrunType === 'email') return emailOk(el.value.trim());
    return el.value.trim() !== '';
  };

  // 対象の項目（ボット対策用の隠し項目は除く）
  const fields = [...form.querySelectorAll('input, textarea, select')]
    .filter((el) => el.name && el.name !== '_formrun_gotcha');
  const required = fields.filter((el) => el.hasAttribute('data-formrun-required'));

  // 進み具合バー
  const bar = document.getElementById('progress-bar');
  const barWrap = document.getElementById('progress');
  const barText = document.getElementById('progress-text');

  // お問い合わせ欄の文字数カウンター
  const textarea = form.querySelector('textarea');
  let counter = null;
  if (textarea) {
    counter = document.createElement('p');
    counter.className = 'char-count';
    textarea.insertAdjacentElement('afterend', counter);
  }

  const update = () => {
    // 項目ごとに ✓ を付ける／メールの形式ミスを赤枠に
    fields.forEach((el) => {
      const box = el.closest('form.formrun > div');
      if (!box) return;
      const empty = el.type !== 'checkbox' && el.value.trim() === '';
      box.classList.toggle('is-ok', isFilled(el));
      box.classList.toggle('is-ng', !!el.dataset.touched && !empty && !isFilled(el));
    });

    // 必須項目の進み具合
    const done = required.filter(isFilled).length;
    const total = required.length;
    if (bar) bar.style.width = (done / total) * 100 + '%';
    if (barWrap) barWrap.classList.toggle('is-complete', done === total);
    if (barText) {
      const msg = done === total ? '入力完了！ 送信できます' : `必須項目 ${done} / ${total}`;
      if (barText.textContent !== msg) {
        barText.textContent = msg;
        // メッセージが変わったらフェードし直す
        barText.classList.remove('is-changed');
        void barText.offsetWidth;
        barText.classList.add('is-changed');
      }
    }

    // 全部そろったら送信ボタンを目立たせる
    form.classList.toggle('is-ready', done === total);

    // 文字数
    if (counter) counter.textContent = `${textarea.value.length} 文字`;
  };

  fields.forEach((el) => {
    el.addEventListener('input', update);
    el.addEventListener('change', update);
    el.addEventListener('blur', () => { el.dataset.touched = '1'; update(); });
  });

  // お問い合わせ欄を入力量に合わせて自動で伸ばす
  if (textarea) {
    const minH = textarea.offsetHeight;
    textarea.addEventListener('input', () => {
      textarea.style.height = 'auto';
      textarea.style.height = Math.max(minH, textarea.scrollHeight + 2) + 'px';
    });
  }

  update();

  // ===== 項目を上から順番にフェードイン =====
  const items = [...form.querySelectorAll(':scope > div:not(._formrun_gotcha), :scope > button')];
  form.classList.add('js-reveal');
  const show = (el) => {
    el.classList.add('is-shown');
    // 表示し終わったら遅延を消す（ボタンのホバーが遅れないように）
    setTimeout(() => { el.style.transitionDelay = ''; }, 1200);
  };
  items.forEach((el, i) => { el.style.transitionDelay = `${0.3 + i * 0.1}s`; });
  if ('IntersectionObserver' in window) {
    // 画面に入ったものから表示（スマホで下にスクロールしたときも順番に出る）
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
    items.forEach((el) => io.observe(el));
  } else {
    items.forEach(show);
  }
});
