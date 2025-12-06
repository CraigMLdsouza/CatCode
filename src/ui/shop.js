// src/ui/shop.js

export function initShop({ skins, hud, services, engine }) {
  const btnToggle = document.getElementById('shop-toggle');
  const panel = document.getElementById('shop-panel');
  const btnClose = document.getElementById('shop-close');
  const listEl = document.getElementById('shop-list');
  const tabCat = document.getElementById('shop-tab-cat');
  const tabArena = document.getElementById('shop-tab-arena');

  if (!btnToggle || !panel || !btnClose || !listEl) {
    console.warn('Shop: missing DOM elements');
    return;
  }

  let currentTab = 'cat';

  function setTab(tab) {
    currentTab = tab;
    if (tab === 'cat') {
      tabCat.style.background = '#282a36';
      tabArena.style.background = '#050509';
      renderCatSkins();
    } else {
      tabCat.style.background = '#050509';
      tabArena.style.background = '#282a36';
      renderArenaSkins();
    }
  }

  function open() {
    panel.style.display = 'flex';
    setTab(currentTab);
  }

  function close() {
    panel.style.display = 'none';
  }

  btnToggle.addEventListener('click', () => {
    if (panel.style.display === 'flex') close();
    else open();
  });

  btnClose.addEventListener('click', close);
  tabCat.addEventListener('click', () => setTab('cat'));
  tabArena.addEventListener('click', () => setTab('arena'));

  function renderCatSkins() {
    const catSkins = skins.getCatSkins();
    listEl.innerHTML = '';

    catSkins.forEach((skin) => {
      const unlocked = skins.isUnlockedCat(skin.id);
      const equipped = skins.getEquippedCatSkin().id === skin.id;

      const item = document.createElement('div');
      item.style.borderRadius = '4px';
      item.style.border = '1px solid #222';
      item.style.padding = '4px 6px';
      item.style.marginBottom = '4px';
      item.style.background = equipped ? 'rgba(80,250,123,0.08)' : 'rgba(0,0,0,0.4)';

      item.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-weight:600;">${skin.name}</div>
            <div style="font-size:10px; color:#bbb;">${skin.description}</div>
          </div>
          <div style="text-align:right; font-size:11px;">
            ${skin.price > 0 ? `${skin.price} 🪙` : '<span style="color:#50fa7b;">Owned</span>'}
          </div>
        </div>
      `;

      const btn = document.createElement('button');
      btn.style.marginTop = '3px';
      btn.style.fontSize = '11px';
      btn.style.padding = '2px 6px';
      btn.style.borderRadius = '4px';
      btn.style.cursor = 'pointer';
      btn.style.border = '1px solid #44475a';
      btn.style.background = unlocked ? '#282a36' : '#1a1a2e';
      btn.style.color = '#f8f8f2';

      if (equipped) {
        btn.textContent = 'Equipped ✓';
        btn.disabled = true;
        btn.style.opacity = '0.7';
      } else if (!unlocked && skin.price > 0) {
        btn.textContent = 'Unlock & Equip';
      } else {
        btn.textContent = 'Equip';
      }

      btn.addEventListener('click', () => {
        const coins = services.coins || 0;

        if (!unlocked && skin.price > 0) {
          if (coins < skin.price) {
            services.editor?.printOutput(`Not enough coins for ${skin.name}.`, 'error');
            return;
          }
          services.coins = coins - skin.price;
          hud?.setCoins(services.coins);
          skins.unlockCat(skin.id);
        }

        skins.equipCat(skin.id);

        // apply immediately
        const catSkin = skins.getEquippedCatSkin();
        if (services.cat && services.cat.mesh) {
          import('../game/catModel.js').then(({ applyCatSkinToModel }) => {
            applyCatSkinToModel(services.cat.mesh, catSkin);
          });
        }

        // small feedback
        services.editor?.printOutput(`Equipped cat skin: ${skin.name}`, 'success');

        renderCatSkins();
      });

      item.appendChild(btn);
      listEl.appendChild(item);
    });
  }

  function renderArenaSkins() {
    const arenaSkins = skins.getArenaSkins();
    listEl.innerHTML = '';

    arenaSkins.forEach((skin) => {
      const unlocked = skins.isUnlockedArena(skin.id);
      const equipped = skins.getEquippedArenaSkin().id === skin.id;

      const item = document.createElement('div');
      item.style.borderRadius = '4px';
      item.style.border = '1px solid #222';
      item.style.padding = '4px 6px';
      item.style.marginBottom = '4px';
      item.style.background = equipped ? 'rgba(189,147,249,0.1)' : 'rgba(0,0,0,0.4)';

      item.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-weight:600;">${skin.name}</div>
            <div style="font-size:10px; color:#bbb;">${skin.description}</div>
          </div>
          <div style="text-align:right; font-size:11px;">
            ${skin.price > 0 ? `${skin.price} 🪙` : '<span style="color:#50fa7b;">Owned</span>'}
          </div>
        </div>
      `;

      const btn = document.createElement('button');
      btn.style.marginTop = '3px';
      btn.style.fontSize = '11px';
      btn.style.padding = '2px 6px';
      btn.style.borderRadius = '4px';
      btn.style.cursor = 'pointer';
      btn.style.border = '1px solid #44475a';
      btn.style.background = unlocked ? '#282a36' : '#1a1a2e';
      btn.style.color = '#f8f8f2';

      if (equipped) {
        btn.textContent = 'Equipped ✓';
        btn.disabled = true;
        btn.style.opacity = '0.7';
      } else if (!unlocked && skin.price > 0) {
        btn.textContent = 'Unlock & Equip';
      } else {
        btn.textContent = 'Equip';
      }

      btn.addEventListener('click', () => {
        const coins = services.coins || 0;

        if (!unlocked && skin.price > 0) {
          if (coins < skin.price) {
            services.editor?.printOutput(`Not enough coins for ${skin.name}.`, 'error');
            return;
          }
          services.coins = coins - skin.price;
          hud?.setCoins(services.coins);
          skins.unlockArena(skin.id);
        }

        skins.equipArena(skin.id);
        services.editor?.printOutput(`Equipped arena skin: ${skin.name}`, 'success');

        // Arena skin will be applied next time a level builds
        // (levels call createGround/createArrayBlocks with current arena skin)
        renderArenaSkins();
      });

      item.appendChild(btn);
      listEl.appendChild(item);
    });
  }

  // initialize tab
  setTab('cat');
}
