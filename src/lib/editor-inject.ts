/**
 * Editor script + CSS injected into the builder iframe during the editor step.
 *
 * The iframe runs with `sandbox="allow-scripts"` — no same-origin, no forms,
 * no navigation. Communication with the parent builder is via postMessage.
 *
 * These are exported as string constants so the builder can construct the
 * iframe `srcDoc` with them inlined.
 */

export const EDITOR_OVERLAY_CSS = `
[data-s9-edit] {
  cursor: pointer;
  transition: outline 0.15s ease, outline-offset 0.15s ease;
}
[data-s9-edit]:hover {
  outline: 2px dashed rgba(43, 107, 255, 0.5);
  outline-offset: 3px;
}
[data-s9-edit].s9-selected {
  outline: 2px solid #2B6BFF;
  outline-offset: 3px;
}
`

export const EDITOR_SCRIPT = `
(function() {
  var selected = null;

  function getEditables() {
    return document.querySelectorAll('[data-s9-edit]');
  }

  function clearSelection() {
    if (selected) selected.classList.remove('s9-selected');
    selected = null;
  }

  document.addEventListener('click', function(e) {
    var el = e.target.closest('[data-s9-edit]');
    if (!el) {
      clearSelection();
      window.parent.postMessage({ type: 's9:deselect' }, '*');
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    clearSelection();
    el.classList.add('s9-selected');
    selected = el;

    var s9Type = el.getAttribute('data-s9-type') || 'text';
    var content = s9Type === 'image' ? el.getAttribute('src') || '' : el.innerHTML;

    window.parent.postMessage({
      type: 's9:select',
      editKey: el.getAttribute('data-s9-edit'),
      content: content,
      tagName: el.tagName.toLowerCase(),
      s9Type: s9Type,
    }, '*');
  }, true);

  window.addEventListener('message', function(e) {
    var d = e.data;
    if (!d || !d.type) return;

    if (d.type === 's9:update' && d.editKey) {
      var target = document.querySelector('[data-s9-edit="' + d.editKey + '"]');
      if (target) target.innerHTML = d.content;
    }

    if (d.type === 's9:updateAttr' && d.editKey) {
      var imgEl = document.querySelector('[data-s9-edit="' + d.editKey + '"]');
      if (imgEl) imgEl.setAttribute(d.attr, d.value);
    }

    if (d.type === 's9:deselect') {
      clearSelection();
    }

    if (d.type === 's9:getHtml') {
      clearSelection();
      // Small delay to let the class removal render
      setTimeout(function() {
        window.parent.postMessage({
          type: 's9:html',
          html: document.body.innerHTML,
        }, '*');
      }, 50);
    }
  });

  // Signal readiness
  window.parent.postMessage({ type: 's9:ready' }, '*');
})();
`

/**
 * Build the full srcDoc for the editor iframe.
 * The CSS and script are inlined so the sandbox can remain restrictive.
 */
export function buildEditorSrcDoc(html: string, css: string): string {
  return `<!doctype html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>${css}</style>
<style>${EDITOR_OVERLAY_CSS}</style>
</head><body>
${html}
<script>${EDITOR_SCRIPT}</script>
</body></html>`
}
