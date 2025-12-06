// src/ui/menu.js
// Level select / problem browser UI for CatCode.

export function initMenu({ levelManager, levelRegistry, terminal, hud }) {
  const toggleBtn = document.getElementById('level-select-toggle');
  const panel = document.getElementById('level-select-panel');
  const closeBtn = document.getElementById('level-select-close');
  const searchInput = document.getElementById('level-search');
  const listEl = document.getElementById('level-list');

  if (!toggleBtn || !panel || !closeBtn || !searchInput || !listEl) {
    console.error('Menu UI elements missing from DOM.');
    return;
  }

  let currentFilter = '';

  function renderList() {
    const filter = currentFilter.toLowerCase();
    listEl.innerHTML = '';

    const currentMeta = levelManager.getCurrentMeta?.() || null;

    const items = levelRegistry.filter((entry) => {
      if (!filter) return true;
      const hay = [
        entry.title || '',
        entry.id || '',
        (entry.tags || []).join(' '),
        entry.difficulty || '',
        entry.mode || ''
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(filter);
    });

    if (items.length === 0) {
      const empty = document.createElement('div');
      empty.textContent = 'No levels match your search.';
      empty.style.opacity = '0.7';
      empty.style.fontSize = '11px';
      listEl.appendChild(empty);
      return;
    }

    items.forEach((entry) => {
      const card = document.createElement('div');
      const isActive = currentMeta && currentMeta.id === entry.id;

      card.style.padding = '6px 6px';
      card.style.marginBottom = '4px';
      card.style.borderRadius = '4px';
      card.style.cursor = 'pointer';
      card.style.border = isActive ? '1px solid #50fa7b' : '1px solid #222';
      card.style.background = isActive ? 'rgba(80,250,123,0.08)' : 'rgba(15,15,30,0.9)';

      card.innerHTML = `
        <div style="font-weight:600; font-size:12px; margin-bottom:2px;">
          ${entry.title || entry.id}
        </div>
        <div style="font-size:11px; opacity:0.9; margin-bottom:2px;">
          ${entry.description || ''}
        </div>
        <div style="font-size:10px; opacity:0.7;">
          ${entry.difficulty ? `Difficulty: ${entry.difficulty}` : ''}
          ${entry.mode ? ` · Mode: ${entry.mode}` : ''}
        </div>
        <div style="font-size:10px; opacity:0.7; margin-top:2px;">
          ${(entry.tags || []).map((t) => `#${t}`).join(' ')}
        </div>
      `;

      card.addEventListener('click', () => {
        if (currentMeta && currentMeta.id === entry.id) {
          // Already on this level
          if (terminal) terminal.log(`Already playing: ${entry.title || entry.id}`);
          return;
        }

        levelManager.loadLevelById(entry.id);

        if (terminal) {
          terminal.system(`Switched to level: ${entry.title || entry.id}`);
        }

        if (hud && entry.title) {
          hud.setLevelTitle(entry.title);
        }

        // Re-render list to update active highlight
        renderList();

        // Optional: close the panel after selecting
        panel.style.display = 'none';
      });

      listEl.appendChild(card);
    });
  }

  function openPanel() {
    panel.style.display = 'flex';
    panel.style.flexDirection = 'column';
    renderList();
    searchInput.focus();
  }

  function closePanel() {
    panel.style.display = 'none';
  }

  toggleBtn.addEventListener('click', () => {
    if (panel.style.display === 'none' || panel.style.display === '') {
      openPanel();
    } else {
      closePanel();
    }
  });

  closeBtn.addEventListener('click', () => {
    closePanel();
  });

  searchInput.addEventListener('input', () => {
    currentFilter = searchInput.value;
    renderList();
  });

  // Initial render (so panel is ready when first opened)
  renderList();
}
