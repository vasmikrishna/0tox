/**
 * Editor script + CSS injected into the builder iframe.
 * Handles: click-to-select any element, hover highlights, delete,
 * postMessage communication with the parent builder.
 */

export const EDITOR_OVERLAY_CSS = `
* { cursor: pointer !important; }
*:hover { outline: 1px dashed rgba(43,107,255,0.3); outline-offset: 2px; }
.s9-selected { outline: 2px solid #2B6BFF !important; outline-offset: 3px; position: relative; }
.s9-selected::after {
  content: attr(data-s9-tag);
  position: absolute; top: -20px; left: 0;
  background: #2B6BFF; color: #fff; font-size: 10px; padding: 1px 6px;
  border-radius: 3px; font-family: system-ui; pointer-events: none; z-index: 99999;
  white-space: nowrap;
}
`

export const EDITOR_SCRIPT = `
(function() {
  var selected = null;
  var editCounter = 0;

  function clearSelection() {
    if (selected) {
      selected.classList.remove('s9-selected');
      selected.removeAttribute('data-s9-tag');
    }
    selected = null;
  }

  function getType(el) {
    var explicit = el.getAttribute('data-s9-type');
    if (explicit) return explicit;
    var tag = el.tagName.toLowerCase();
    if (tag === 'img') return 'image';
    if (tag === 'a') return 'link';
    if (tag === 'section' || tag === 'header' || tag === 'footer' || tag === 'nav' || tag === 'div' || tag === 'article' || tag === 'aside') return 'section';
    return 'text';
  }

  function tagLabel(el) {
    var tag = el.tagName.toLowerCase();
    var cls = el.className ? '.' + el.className.split(' ')[0].replace('s9-selected','').trim() : '';
    if (cls === '.') cls = '';
    var id = el.id ? '#' + el.id : '';
    return tag + id + cls;
  }

  document.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();

    var el = e.target;
    // Don't select html/body
    if (el === document.documentElement || el === document.body) {
      clearSelection();
      window.parent.postMessage({ type: 's9:deselect' }, '*');
      return;
    }

    // Auto-assign edit key
    if (!el.getAttribute('data-s9-edit')) {
      el.setAttribute('data-s9-edit', 's9-auto-' + (++editCounter));
    }

    clearSelection();
    el.setAttribute('data-s9-tag', tagLabel(el));
    el.classList.add('s9-selected');
    selected = el;

    var s9Type = getType(el);
    var content = s9Type === 'image' ? (el.getAttribute('src') || '') : el.innerHTML;
    var href = '';
    if (el.tagName.toLowerCase() === 'a') href = el.getAttribute('href') || '';
    else { var p = el.closest('a'); if (p) href = p.getAttribute('href') || ''; }

    var rect = el.getBoundingClientRect();

    window.parent.postMessage({
      type: 's9:select',
      editKey: el.getAttribute('data-s9-edit'),
      content: content,
      tagName: el.tagName.toLowerCase(),
      s9Type: s9Type,
      href: href,
      rect: { width: Math.round(rect.width), height: Math.round(rect.height) },
    }, '*');
  }, true);

  window.addEventListener('message', function(e) {
    var d = e.data;
    if (!d || !d.type) return;

    if (d.type === 's9:update' && d.editKey) {
      var t = document.querySelector('[data-s9-edit="' + d.editKey + '"]');
      if (t) t.innerHTML = d.content;
    }

    if (d.type === 's9:updateAttr' && d.editKey) {
      var a = document.querySelector('[data-s9-edit="' + d.editKey + '"]');
      if (a) a.setAttribute(d.attr, d.value);
    }

    if (d.type === 's9:delete' && d.editKey) {
      var del = document.querySelector('[data-s9-edit="' + d.editKey + '"]');
      if (del) { del.remove(); selected = null; }
      window.parent.postMessage({ type: 's9:deleted', editKey: d.editKey }, '*');
    }

    if (d.type === 's9:deselect') { clearSelection(); }

    if (d.type === 's9:getHtml') {
      clearSelection();
      setTimeout(function() {
        window.parent.postMessage({ type: 's9:html', html: document.body.innerHTML }, '*');
      }, 50);
    }

    if (d.type === 's9:insertSection' && d.html) {
      var temp = document.createElement('div');
      temp.innerHTML = d.html;
      var section = temp.firstElementChild || temp;
      if (selected && selected.getAttribute('data-s9-type') === 'section') {
        selected.parentNode.insertBefore(section, selected.nextSibling);
      } else {
        document.body.appendChild(section);
      }
      clearSelection();
      window.parent.postMessage({ type: 's9:sectionInserted' }, '*');
    }

    if (d.type === 's9:addCss' && d.css) {
      var style = document.createElement('style');
      style.textContent = d.css;
      document.head.appendChild(style);
    }

    if (d.type === 's9:moveSection' && d.editKey && d.direction) {
      var sec = document.querySelector('[data-s9-edit="' + d.editKey + '"]');
      if (sec) {
        if (d.direction === 'up' && sec.previousElementSibling) {
          sec.parentNode.insertBefore(sec, sec.previousElementSibling);
        } else if (d.direction === 'down' && sec.nextElementSibling) {
          sec.parentNode.insertBefore(sec.nextElementSibling, sec);
        }
      }
    }
  });

  window.parent.postMessage({ type: 's9:ready' }, '*');
})();
`

export function buildEditorSrcDoc(html: string, css: string): string {
  return `<!doctype html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>${css}</style>
<style>${EDITOR_OVERLAY_CSS}</style>
</head><body>
${html}
<script>${EDITOR_SCRIPT}<` + `/script>
</body></html>`
}
