// Помощник по вублинам — логика вкладок, чекбоксов, localStorage
// Комментарии по-русски, чистый JS без сборщиков

(function(){
  // Проверяем что данные загружены
  if(typeof MSM_DATA === 'undefined'){
    console.error('MSM_DATA не найден — проверь data.js');
    return;
  }

  const wublins = MSM_DATA.wublins;
  const islands = MSM_DATA.islands;

  // Утилита: безопасный localStorage
  const STORAGE_KEY = 'msm-wublin-helper-v1';
  function loadStore(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return {};
      return JSON.parse(raw);
    }catch(e){
      return {};
    }
  }
  function saveStore(obj){
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    }catch(e){}
  }
  let store = loadStore();

  // Ключ чекбокса: islandIndex + имя монстра-родителя
  function checkboxKey(islandIdx, monsterName){
    return islandIdx + '::' + monsterName;
  }
  function isChecked(islandIdx, monsterName){
    return !!store[checkboxKey(islandIdx, monsterName)];
  }
  function setChecked(islandIdx, monsterName, val){
    store[checkboxKey(islandIdx, monsterName)] = val;
    saveStore(store);
  }

  // Иконка: если есть img/mon_<en>.png — показываем, иначе скрываем
  function iconPath(enName){
    if(!enName) return '';
    return 'img/mon_' + enName.toLowerCase() + '.png';
  }
  function createIcon(enName, alt){
    const img = document.createElement('img');
    img.className = 'icon';
    img.alt = alt || '';
    img.loading = 'lazy';
    img.src = iconPath(enName);
    // если файла нет — скрываем иконку, приложение работает текстом — это норма
    img.onerror = function(){ img.classList.add('icon-hidden'); img.style.display='none'; };
    return img;
  }

  // Поиск вублина по номеру
  function findWublinByN(n){
    return wublins.find(function(w){ return w.n === n; });
  }
  // Поиск en имени по ru (для иконки)
  function findEnByRu(ru){
    const w = wublins.find(function(x){ return x.ru === ru; });
    return w ? w.en : '';
  }

  // Получить все источники яиц для вублина n: список {islandIdx, islandRu, eggs}
  function getSourcesForWublin(n){
    const res = [];
    islands.forEach(function(island, idx){
      const block = island.blocks.find(function(b){ return b.w === n; });
      if(block){
        res.push({
          islandIdx: idx,
          islandRu: island.ru,
          block: block
        });
      }
    });
    return res;
  }

  // ---------- Вкладка: Порядок ----------
  function renderOrder(){
    const container = document.getElementById('order-list');
    if(!container) return;
    container.innerHTML = '';

    wublins
      .slice()
      .sort(function(a,b){ return a.n - b.n; })
      .forEach(function(w){
        const row = document.createElement('div');
        row.className = 'card wublin-row';
        row.dataset.n = w.n;

        // Заголовок: номер + имя + иконка
        const title = document.createElement('div');
        title.className = 'card-title';
        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.textContent = w.n;
        const nameSpan = document.createElement('span');
        nameSpan.textContent = w.ru;
        title.appendChild(badge);
        title.appendChild(nameSpan);
        // иконка если есть
        const ic = createIcon(w.en, w.ru);
        // иконка маленькая, вставим после имени если загрузится
        title.appendChild(ic);
        // бейдж для Зинта
        if(w.n === 19){
          const zbadge = document.createElement('span');
          zbadge.className = 'badge-zynth';
          zbadge.textContent = 'уже разбужен (3 шт)';
          zbadge.style.marginLeft = 'auto';
          title.appendChild(zbadge);
        }

        // Мета: цена статуи, окно яиц, размер
        const meta = document.createElement('div');
        meta.className = 'card-meta';
        const statue = document.createElement('span');
        statue.innerHTML = 'статуя: <strong class="accent">'+ w.statue +' монет</strong>';
        const win = document.createElement('span');
        win.innerHTML = 'окно: <strong class="accent">'+ w.win +' дн.</strong>';
        const size = document.createElement('span');
        size.textContent = 'размер: ' + w.size[0] + '×' + w.size[1];
        meta.appendChild(statue);
        meta.appendChild(win);
        meta.appendChild(size);

        // Плюс линия
        const plus = document.createElement('div');
        plus.className = 'plus-line';
        // формат: + от / + кому
        const fromPill = document.createElement('span');
        fromPill.className = 'pill';
        fromPill.textContent = '+ от ' + w.plus_from;
        const arrow = document.createElement('span');
        arrow.textContent = '→';
        arrow.style.color = 'var(--accent)';
        arrow.style.fontWeight = '800';
        const toPill = document.createElement('span');
        toPill.className = 'pill';
        toPill.textContent = '+ кому ' + w.plus_to;
        // Для Зинта поясним бейдж уже в заголовке, но дублируем
        plus.appendChild(fromPill);
        plus.appendChild(arrow);
        plus.appendChild(toPill);

        row.appendChild(title);
        row.appendChild(meta);
        row.appendChild(plus);

        // Раскрывашка: какие яйца нужны
        const expand = document.createElement('div');
        expand.className = 'expand';
        const h4 = document.createElement('h4');
        h4.textContent = 'Какие яйца нужны:';
        expand.appendChild(h4);

        const sources = getSourcesForWublin(w.n);
        if(sources.length === 0){
          const empty = document.createElement('div');
          empty.className = 'egg-line';
          empty.textContent = 'Нет данных по островам — все яйца можно zap-ить из питомника любого природного острова.';
          expand.appendChild(empty);
        } else {
          sources.forEach(function(src){
            const islandWrap = document.createElement('div');
            islandWrap.className = 'expand-island';
            const islandTitle = document.createElement('div');
            islandTitle.className = 'expand-island-title';
            const dot = document.createElement('span');
            dot.className = 'dot';
            islandTitle.appendChild(dot);
            const t = document.createElement('span');
            t.textContent = src.islandRu;
            islandTitle.appendChild(t);
            islandWrap.appendChild(islandTitle);

            src.block.eggs.forEach(function(eg, idx){
              const line = document.createElement('div');
              line.className = 'egg-line' + (idx===0 ? ' egg-line-main' : '');
              // формат: ЯЙЦО = РОДИТЕЛЬ1 + РОДИТЕЛЬ2 · время
              // яйцо может быть русским (Избалолист и т.д.)
              const eggName = eg.egg;
              const p1 = eg.p[0];
              const p2 = eg.p[1];
              const time = eg.t;
              // подсветка главного рецепта
              if(idx===0){
                line.innerHTML = '<span class="egg-egg">'+ escapeHtml(eggName) +'</span> = '+ escapeHtml(p1) +' + '+ escapeHtml(p2) +' · '+ escapeHtml(time) +' <span style="color:var(--accent);font-size:12px;margin-left:6px">★ самый быстрый</span>';
              } else {
                line.textContent = eggName + ' = ' + p1 + ' + ' + p2 + ' · ' + time;
              }
              islandWrap.appendChild(line);
            });
            expand.appendChild(islandWrap);
          });
          const hint = document.createElement('div');
          hint.className = 'small muted';
          hint.style.marginTop = '6px';
          hint.textContent = 'Тап ещё раз чтобы свернуть. Первый рецепт в блоке — самый быстрый.';
          expand.appendChild(hint);
        }

        row.appendChild(expand);

        // Клик по строке раскрывает
        row.addEventListener('click', function(e){
          // чтобы клик по чекбоксам внутри не триггерил (но тут их нет)
          row.classList.toggle('open');
        });

        container.appendChild(row);
      });
  }

  function escapeHtml(s){
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // ---------- Вкладка: Острова ----------
  let activeIsland = 0;

  function renderIslandSwitcher(){
    const switcher = document.getElementById('island-switcher');
    if(!switcher) return;
    switcher.innerHTML = '';
    islands.forEach(function(island, idx){
      const btn = document.createElement('button');
      btn.className = 'island-btn' + (idx===activeIsland ? ' active' : '');
      btn.textContent = island.ru;
      btn.dataset.idx = idx;
      btn.addEventListener('click', function(){
        activeIsland = idx;
        // обновить активный класс
        switcher.querySelectorAll('.island-btn').forEach(function(b){ b.classList.remove('active'); });
        btn.classList.add('active');
        renderIslandContent();
      });
      switcher.appendChild(btn);
    });
  }

  function renderIslandContent(){
    const content = document.getElementById('island-content');
    if(!content) return;
    content.innerHTML = '';
    const island = islands[activeIsland];
    if(!island) return;

    // Сортируем блоки по w номеру
    const blocks = island.blocks.slice().sort(function(a,b){ return a.w - b.w; });

    blocks.forEach(function(block){
      const wublin = findWublinByN(block.w);
      const blockCard = document.createElement('div');
      blockCard.className = 'island-block';

      const header = document.createElement('div');
      header.className = 'island-block-header';
      const num = document.createElement('span');
      num.className = 'num';
      num.textContent = block.w;
      const name = document.createElement('span');
      name.className = 'name';
      name.textContent = block.ru;
      header.appendChild(num);
      header.appendChild(name);
      // иконка вублина
      if(wublin){
        const ic = createIcon(wublin.en, block.ru);
        header.appendChild(ic);
      }

      blockCard.appendChild(header);

      const recipeList = document.createElement('div');
      recipeList.className = 'recipe-list';

      block.eggs.forEach(function(eg, eggIdx){
        const recipe = document.createElement('div');
        const isMain = eggIdx===0;
        recipe.className = 'recipe' + (isMain ? ' main' : '');
        // Проверка готовности: оба родителя отмечены
        const p1 = eg.p[0];
        const p2 = eg.p[1];
        const ready = isChecked(activeIsland, p1) && isChecked(activeIsland, p2);
        if(ready) recipe.classList.add('ready');

        const line = document.createElement('div');
        line.className = 'recipe-line';
        // Крупный формат для главного
        if(isMain){
          line.innerHTML = '<span class="egg">'+ escapeHtml(eg.egg) +'</span> = '+ escapeHtml(p1) +' + '+ escapeHtml(p2) +' <span class="time">· '+ escapeHtml(eg.t) +'</span>';
        } else {
          line.innerHTML = escapeHtml(eg.egg) +' = '+ escapeHtml(p1) +' + '+ escapeHtml(p2) +' <span class="time">· '+ escapeHtml(eg.t) +'</span>';
        }

        const checks = document.createElement('div');
        checks.className = 'recipe-checks';

        // чекбокс для каждого родителя
        [p1,p2].forEach(function(parentName){
          const label = document.createElement('label');
          label.className = 'check';
          // добавим класс ready если отмечен
          if(isChecked(activeIsland, parentName)){
            label.classList.add('ready');
          }
          const cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.checked = isChecked(activeIsland, parentName);
          cb.setAttribute('aria-label', 'есть на острове: ' + parentName);

          // обработка изменения — обновляет store и перерисовывает весь остров
          cb.addEventListener('change', function(e){
            e.stopPropagation();
            setChecked(activeIsland, parentName, cb.checked);
            // перерисуем текущую островную вкладку чтобы подсветка обновилась
            // но сохраняем скролл
            const scrollY = window.scrollY;
            renderIslandContent();
            window.scrollTo(0, scrollY);
          });
          // чтобы клик по лейблу не всплывал и не скроллил лишнее
          label.addEventListener('click', function(e){
            e.stopPropagation();
          });

          const txt = document.createElement('span');
          txt.textContent = parentName + ' — есть';

          label.appendChild(cb);
          label.appendChild(txt);
          checks.appendChild(label);
        });

        const hint = document.createElement('div');
        hint.className = 'hint-ready';
        hint.innerHTML = '<span class="dot"></span> можно выводить сейчас';

        recipe.appendChild(line);
        recipe.appendChild(checks);
        recipe.appendChild(hint);

        recipeList.appendChild(recipe);
      });

      blockCard.appendChild(recipeList);
      content.appendChild(blockCard);
    });

    // подсказка внизу
    const foot = document.createElement('div');
    foot.className = 'card';
    foot.style.fontSize = '13px';
    foot.style.color = 'var(--muted)';
    foot.style.lineHeight = '1.4';
    foot.innerHTML = 'Отмечай чекбоксы «есть на острове» для монстров, которые уже живут у тебя. Строка подсветится зелёным, когда оба родителя есть — значит рецепт можно пробовать прямо сейчас. Состояние сохраняется в браузере (localStorage) и переживает перезагрузку.';
    content.appendChild(foot);
  }

  // ---------- Вкладка: Цепочка + ----------
  function renderChain(){
    const container = document.getElementById('chain-list');
    if(!container) return;
    container.innerHTML = '';

    // Построим цикл начиная с Брампа (1) следуя plus_to
    // Это покрывает всех 19 ровно один раз если данные корректны
    const byRu = {};
    wublins.forEach(function(w){ byRu[w.ru] = w; });

    const chainOrder = [];
    const visited = new Set();
    let cur = wublins.find(function(w){ return w.n===1; }) || wublins[0];
    for(let i=0;i<wublins.length;i++){
      if(!cur || visited.has(cur.ru)) break;
      chainOrder.push(cur);
      visited.add(cur.ru);
      const nextRu = cur.plus_to;
      cur = byRu[nextRu];
    }
    // если цепочка неполная (разрыв), добавим оставшихся
    if(chainOrder.length < wublins.length){
      wublins.forEach(function(w){
        if(!visited.has(w.ru)) chainOrder.push(w);
      });
    }

    chainOrder.forEach(function(w, idx){
      const item = document.createElement('div');
      item.className = 'chain-item';
      const num = document.createElement('div');
      num.className = 'chain-num';
      const dot = document.createElement('span');
      dot.className = 'dot';
      num.appendChild(dot);
      const numText = document.createElement('span');
      numText.textContent = (idx+1) + ' из 19 · цикл';
      num.appendChild(numText);

      const main = document.createElement('div');
      main.className = 'chain-main';
      const nameFrom = document.createElement('span');
      nameFrom.className = 'name';
      nameFrom.textContent = w.ru;
      const arrow = document.createElement('span');
      arrow.className = 'arrow';
      arrow.textContent = '→';
      const pill = document.createElement('span');
      pill.className = 'pill-plus';
      pill.textContent = 'даёт +';
      const nameTo = document.createElement('span');
      nameTo.className = 'name';
      nameTo.textContent = w.plus_to;
      // иконки если есть
      const icFrom = createIcon(w.en, w.ru);
      icFrom.style.width='28px';icFrom.style.height='28px';icFrom.style.borderRadius='7px';
      const toWublin = byRu[w.plus_to];
      const icTo = toWublin ? createIcon(toWublin.en, toWublin.ru) : null;
      if(icTo){ icTo.style.width='28px';icTo.style.height='28px';icTo.style.borderRadius='7px'; }

      main.appendChild(icFrom);
      main.appendChild(nameFrom);
      main.appendChild(arrow);
      main.appendChild(pill);
      main.appendChild(arrow.cloneNode(true));
      if(icTo) main.appendChild(icTo);
      main.appendChild(nameTo);

      // доп строка: кто даёт этому
      const sub = document.createElement('div');
      sub.className = 'small muted';
      sub.style.fontSize='12px';
      sub.textContent = '«' + w.ru + '» получает + от «' + w.plus_from + '»';

      item.appendChild(num);
      item.appendChild(main);
      item.appendChild(sub);

      // замыкание цикла последний → первый
      if(idx === chainOrder.length-1){
        const close = document.createElement('div');
        close.className = 'small muted';
        close.style.marginTop='6px';
        close.style.textAlign='center';
        close.style.fontWeight='700';
        close.style.color='var(--accent)';
        close.textContent = '↺ цикл замыкается: ' + w.plus_to + ' → даёт + → ' + chainOrder[0].ru;
        item.appendChild(close);
      }

      container.appendChild(item);
    });

    // пояснение
    const expl = document.createElement('div');
    expl.className = 'card';
    expl.style.fontSize='13px';
    expl.style.lineHeight='1.5';
    expl.style.color='var(--muted)';
    expl.innerHTML = 'Как использовать: поставь дающего «+» рядом с получателем на острове Вублинов — выступления станут чаще. Например, <strong style="color:var(--text)">Фличвурм → даёт + → Брамп</strong> значит ставь Фличвурма вплотную к Брампу.';
    container.appendChild(expl);
  }

  // ---------- Навигация по вкладкам ----------
  function initTabs(){
    const btns = document.querySelectorAll('.tab-btn');
    const tabs = document.querySelectorAll('.tab');
    btns.forEach(function(btn){
      btn.addEventListener('click', function(){
        const target = btn.dataset.tab;
        btns.forEach(function(b){
          b.classList.remove('active');
          b.setAttribute('aria-selected','false');
        });
        tabs.forEach(function(t){ t.classList.remove('active'); });
        btn.classList.add('active');
        btn.setAttribute('aria-selected','true');
        const tabEl = document.getElementById('tab-' + target);
        if(tabEl) tabEl.classList.add('active');
        window.scrollTo({top:0, behavior:'smooth'});
      });
    });
  }

  // ---------- Инициализация ----------
  document.addEventListener('DOMContentLoaded', function(){
    renderOrder();
    renderIslandSwitcher();
    renderIslandContent();
    renderChain();
    initTabs();
    // проверка что нет горизонтального скролла — логируем в консоль для приёмки
    console.log('MSM Wublin Helper запущен: вублинов', wublins.length, 'островов', islands.length);
  });

})();
