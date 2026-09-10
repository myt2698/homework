(() => {
  'use strict';
  const el = id => document.getElementById(id);
  const input = el('lookupInput'), canvas = el('lookupCanvas'), status = el('lookupStatus');
  const animateButton = el('lookupAnimate'), practiceButton = el('lookupPractice');
  const pauseButton = el('lookupPause'), hintButton = el('lookupHint'), progress = el('lookupPracticeProgress');
  const catalog = new Set(Array.from(window.HanziCatalog.characters));
  const loads = new Map();
  window.HanziStrokeData = Object.create(null);
  let writer = null, selected = '', selectedData = null, operation = 0, mode = 'empty', nextStroke = 0;
  const params = new URLSearchParams(location.search);
  el('lookupTimerNote').hidden = params.get('focus') !== '1';
  el('lookupBack').setAttribute('aria-label', params.get('focus') === '1' ? '返回专注计时' : '返回首页');
  el('lookupCoverage').textContent = `内置 ${window.HanziCatalog.count.toLocaleString('zh-CN')} 个汉字，断网也能查。本页提供笔顺和跟写，暂不提供拼音、释义或组词。`;

  function tell(message, error = false) {
    status.textContent = message;
    status.dataset.error = String(error);
  }

  function controls(nextMode) {
    mode = nextMode;
    const ready = Boolean(selectedData) && !['loading', 'empty', 'error'].includes(mode);
    animateButton.disabled = practiceButton.disabled = !ready;
    pauseButton.disabled = !['animation', 'paused'].includes(mode);
    pauseButton.textContent = mode === 'paused' ? '继续' : '暂停';
    hintButton.disabled = mode !== 'practice';
    animateButton.setAttribute('aria-pressed', String(mode === 'animation' || mode === 'paused'));
    practiceButton.setAttribute('aria-pressed', String(mode === 'practice'));
    progress.hidden = mode !== 'practice' && mode !== 'complete';
    canvas.setAttribute('role', mode === 'practice' ? 'application' : 'img');
    canvas.setAttribute('aria-label', mode === 'practice' ? `跟着轮廓书写${selected}，共${selectedData.strokes.length}笔` : `${selected || '汉字'}笔顺演示`);
  }

  function loadData(character) {
    if (window.HanziStrokeData[character]) return Promise.resolve(window.HanziStrokeData[character]);
    const bucket = (character.codePointAt(0) >>> 8).toString(16);
    if (!loads.has(bucket)) {
      const promise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        let timer;
        const finish = error => {
          clearTimeout(timer);
          script.remove();
          error ? reject(error) : resolve();
        };
        script.src = `data/${bucket}.js`;
        script.onload = () => finish();
        script.onerror = () => finish(new Error('字库文件未能读取'));
        timer = setTimeout(() => finish(new Error('字库读取超时')), 8000);
        document.head.appendChild(script);
      });
      loads.set(bucket, promise);
      promise.catch(() => loads.delete(bucket));
    }
    return loads.get(bucket).then(() => {
      const data = window.HanziStrokeData[character];
      if (!data) throw new Error('字库缺少该字');
      return data;
    });
  }

  async function prepareWriter(character) {
    canvas.style.visibility = '';
    if (!writer) {
      const size = canvas.clientWidth;
      writer = new HanziWriter(canvas, {
        width: size, height: size, padding: 22,
        charDataLoader: char => window.HanziStrokeData[char],
        strokeColor: '#365f9a', outlineColor: '#dce6f2', drawingColor: '#347e6b',
        highlightColor: '#65bca2', strokeAnimationSpeed: .8, delayBetweenStrokes: 280,
        showHintAfterMisses: 2, showOutline: true, drawingWidth: 10
      });
    }
    await writer.setCharacter(character);
  }

  async function play() {
    if (!selectedData) return;
    const ticket = ++operation;
    controls('animation');
    tell('仔细看，一笔一笔慢慢写');
    await prepareWriter(selected);
    if (ticket !== operation) return;
    await writer.animateCharacter();
    if (ticket !== operation) return;
    controls('ready');
    tell(`共 ${selectedData.strokes.length} 笔，试试跟着写吧`);
  }

  async function practice() {
    if (!selectedData) return;
    const ticket = ++operation;
    controls('practice');
    nextStroke = 0;
    progress.max = selectedData.strokes.length;
    progress.value = 0;
    tell('沿着浅色轮廓，从第一笔开始写');
    await prepareWriter(selected);
    if (ticket !== operation) return;
    writer.quiz({
      onCorrectStroke: data => {
        if (ticket !== operation) return;
        nextStroke = data.strokeNum + 1;
        progress.value = nextStroke;
        tell(`写对啦！已写 ${nextStroke} / ${selectedData.strokes.length} 笔`);
      },
      onMistake: () => {
        if (ticket === operation) tell('再试一次，留意这一笔的方向和顺序');
      },
      onComplete: () => {
        if (ticket !== operation) return;
        controls('complete');
        progress.value = selectedData.strokes.length;
        tell(`写好啦！你完成了“${selected}”，可以再练一次`);
      }
    });
  }

  async function choose(character) {
    const ticket = ++operation;
    if (writer) { writer.cancelQuiz(); writer.pauseAnimation(); }
    selected = character;
    selectedData = null;
    canvas.style.visibility = 'hidden';
    el('lookupPlaceholder').hidden = true;
    el('lookupCharacter').textContent = character;
    el('lookupStrokeCount').textContent = '';
    for (const button of el('lookupCharacters').children) button.setAttribute('aria-pressed', String(button.textContent === character));
    controls('loading');
    if (!catalog.has(character)) {
      controls('error');
      tell(`暂时还没有“${character}”的笔顺，换个字试试`, true);
      return;
    }
    tell('正在找这个字的笔顺…');
    try {
      const data = await loadData(character);
      if (ticket !== operation) return;
      selectedData = data;
      el('lookupStrokeCount').textContent = `共 ${data.strokes.length} 笔`;
      await play();
    } catch (_) {
      if (selected !== character) return;
      selectedData = null;
      canvas.style.visibility = 'hidden';
      controls('error');
      tell('这个字的资料没有读到，请再查一次', true);
    }
  }

  function isHanzi(character) {
    const code = character.codePointAt(0);
    return (code >= 0x3400 && code <= 0x9fff) || (code >= 0xf900 && code <= 0xfaff)
      || (code >= 0x20000 && code <= 0x323af) || code === 0x3007;
  }

  function search() {
    const characters = [...new Set(Array.from(input.value.trim()).filter(isHanzi))];
    if (!characters.length || characters.length > 12) {
      ++operation;
      if (writer) { writer.cancelQuiz(); writer.pauseAnimation(); }
      selectedData = null;
      selected = '';
      canvas.style.visibility = 'hidden';
      el('lookupPlaceholder').hidden = false;
      el('lookupCharacter').textContent = '来查一个字吧';
      el('lookupStrokeCount').textContent = '';
      el('lookupCharacters').hidden = true;
      controls('error');
      tell(characters.length ? '一次最多查 12 个不同的字，分开查一查吧' : '先输入一个汉字，也可以输入词语', true);
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      return;
    }
    input.removeAttribute('aria-invalid');
    input.blur();
    const choices = el('lookupCharacters');
    choices.replaceChildren();
    choices.hidden = characters.length < 2;
    for (const character of characters) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = character;
      button.setAttribute('aria-label', `查看${character}的笔顺`);
      button.addEventListener('click', () => choose(character));
      choices.appendChild(button);
    }
    choose(characters[0]);
  }

  function back() {
    if (window.parent !== window) window.parent.postMessage({ type: 'homework-hanzi-close' }, '*');
    else if (params.get('host') === 'android') location.href = 'close';
    else location.href = '../index.html';
  }

  el('lookupForm').addEventListener('submit', event => { event.preventDefault(); search(); });
  el('lookupExamples').addEventListener('click', event => {
    const button = event.target.closest('button[data-character]');
    if (button) { input.value = button.dataset.character; search(); }
  });
  animateButton.addEventListener('click', play);
  practiceButton.addEventListener('click', practice);
  pauseButton.addEventListener('click', () => {
    if (mode === 'animation') { writer.pauseAnimation(); controls('paused'); tell('已暂停，看清这一笔再继续'); }
    else if (mode === 'paused') { writer.resumeAnimation(); controls('animation'); tell('仔细看，一笔一笔慢慢写'); }
  });
  hintButton.addEventListener('click', () => {
    if (mode === 'practice') writer.highlightStroke(nextStroke);
  });
  el('lookupBack').addEventListener('click', back);
  window.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); back(); }
    if (event.key === 'Tab' && window.parent !== window) {
      const buttons = [...document.querySelectorAll('button:not(:disabled), input, summary')].filter(node => node.getClientRects().length);
      if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons.at(-1).focus(); }
      else if (!event.shiftKey && document.activeElement === buttons.at(-1)) { event.preventDefault(); buttons[0].focus(); }
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && mode === 'animation') { writer.pauseAnimation(); controls('paused'); tell('已暂停，回来后可以继续看'); }
  });
  const resize = () => {
    if (writer) writer.updateDimensions({ width: canvas.clientWidth, height: canvas.clientWidth, padding: 22 });
  };
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(resize).observe(canvas);
  else window.addEventListener('resize', resize);
  el('lookupLicenseButton').addEventListener('click', () => {
    const panel = el('lookupLicenses');
    panel.hidden = !panel.hidden;
    el('lookupLicenseButton').setAttribute('aria-expanded', String(!panel.hidden));
    if (!panel.hidden) for (const frame of panel.querySelectorAll('iframe[data-src]')) { frame.src = frame.dataset.src; frame.removeAttribute('data-src'); }
  });
  el('lookupBack').focus();
})();
