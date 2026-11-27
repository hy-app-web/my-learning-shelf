const app = document.querySelector('#app');
const dateFormatter = new Intl.DateTimeFormat('sv-SE', {timeZone:'Asia/Tokyo', year:'numeric', month:'2-digit', day:'2-digit'});
const start = Date.UTC(2026, 10, 27);
const dayMs = 86400000;
const releaseDays = 16;
const today = () => Math.max(0, Math.floor((Date.parse(dateFormatter.format(new Date())) - start) / dayMs));
const dateLabel = day => new Intl.DateTimeFormat('ja-JP', {timeZone:'UTC', month:'long', day:'numeric'}).format(start + day * dayMs);
const key = 'my-learning-shelf-read-v1';
let progress = new Set();
let canSave = true;
try { progress = new Set(JSON.parse(localStorage.getItem(key) || '[]')); } catch { canSave = false; }
const catalog = categories.map((category, c) => ({
  title: category.title,
  lessons: category.lessons.map(([title, body], i) => ({id:'lesson-' + (c+1) + '-' + (i+1), title, body, category:category.title, day:i*2 + Number(c>=3)}))
}));
const all = catalog.flatMap(category => category.lessons);
function element(tag, text, cls) {
  const el = document.createElement(tag);
  if (text) el.textContent = text;
  if (cls) el.className = cls;
  return el;
}
function list(lessons, current) {
  const ul = element('ul');
  for (const lesson of lessons) {
    const li = element('li');
    const open = lesson.day <= current;
    const row = element(open ? 'button' : 'div', '', open ? 'row' : 'row planned');
    row.append(element('span', lesson.title), element('span', open ? (progress.has(lesson.id) ? '✓ 既読' : '未読 ›') : dateLabel(lesson.day) + '予定', 'badge'));
    if (open) row.addEventListener('click', () => { location.hash = lesson.id; });
    li.append(row);
    ul.append(li);
  }
  return ul;
}
function render() {
  const current = today();
  const lesson = all.find(item => '#' + item.id === location.hash && item.day <= current);
  app.replaceChildren();
  if (lesson) {
    const back = element('a', '‹ 目次に戻る', 'back');
    back.href = '#';
    const article = element('article');
    article.append(element('p', lesson.category + ' · ' + dateLabel(lesson.day), 'muted'), element('h1', lesson.title));
    const sentences = lesson.body.match(/[^。]+。?/g) || [lesson.body];
    article.append(element('p', sentences.slice(0,-1).join('')), element('p', sentences.at(-1)));
    const read = element('button', progress.has(lesson.id) ? '✓ 既読にしました' : '読み終えた');
    read.className = 'action';
    read.setAttribute('aria-pressed', String(progress.has(lesson.id)));
    read.addEventListener('click', () => {
      if (progress.has(lesson.id)) progress.delete(lesson.id);
      else progress.add(lesson.id);
      try { localStorage.setItem(key, JSON.stringify([...progress])); } catch { canSave = false; }
      render();
      document.querySelector('.action').focus();
    });
    article.append(read);
    if (!canSave) article.append(element('p', 'このブラウザでは既読を次回まで保存できません。', 'muted'));
    app.append(back, article);
    return;
  }
  const header = element('header');
  header.append(element('h1', '自分だけの教科書'), element('p', progress.size + ' / 48 テーマを読了', 'muted'));
  app.append(header);
  const latest = Math.min(current, releaseDays - 1);
  const daily = element('section', '', 'today');
  daily.append(element('h2', current === latest ? '今日の３本' : '最後に追加された３本'), element('p', dateLabel(latest), 'muted'), list(all.filter(item=>item.day===latest), current));
  app.append(daily, element('h2', '全テーマ'));
  for (const category of catalog) {
    const group = element('section', '', 'category');
    group.append(element('h3', category.title), list(category.lessons,current));
    app.append(group);
  }
  app.append(element('footer', '教材は日本時間の日付が変わると公開されます。既読はこの端末のブラウザに保存されます。'));
}
window.addEventListener('hashchange', () => { render(); window.scrollTo(0,0); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
setInterval(() => { if (!document.hidden && lastDay !== today()) { lastDay = today(); render(); } }, 60000);
let lastDay = today();
render();
