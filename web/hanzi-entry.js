(() => {
  'use strict';
  const modal = document.getElementById('hanziLookupModal');
  const frame = document.getElementById('hanziLookupFrame');
  let previous = [], returnFocus = null, previousOverflow = '';
  function open(button, focus) {
    if (!modal.hidden) return;
    returnFocus = button;
    previousOverflow = document.body.style.overflow;
    previous = [...document.body.children].filter(node => node !== modal && node.tagName !== 'SCRIPT')
      .map(node => [node, node.inert]);
    previous.forEach(([node]) => { node.inert = true; });
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    frame.src = `hanzi/index.html?focus=${focus ? '1' : '0'}`;
    frame.focus();
  }
  function close() {
    if (modal.hidden) return;
    // Unload the child document to stop its animations and handwriting listeners.
    frame.src = 'about:blank';
    modal.hidden = true;
    previous.forEach(([node, inert]) => { node.inert = inert; });
    previous = [];
    document.body.style.overflow = previousOverflow;
    returnFocus?.focus();
  }
  document.getElementById('homeLookupButton').addEventListener('click', event => open(event.currentTarget, false));
  document.getElementById('focusLookupButton').addEventListener('click', event => open(event.currentTarget, true));
  window.addEventListener('message', event => {
    if (event.source === frame.contentWindow && event.data?.type === 'homework-hanzi-close') close();
  });
  window.addEventListener('keydown', event => {
    if (!modal.hidden && event.key === 'Escape') { event.preventDefault(); close(); }
  });
  window.HanziLookup = { isOpen: () => !modal.hidden };
})();
