(() => {
  const filters = [...document.querySelectorAll('[data-filter]')];
  const search = document.querySelector('#project-search');
  const sort = document.querySelector('#project-sort');
  const list = document.querySelector('#archive-list');
  if (!list) return;
  const items = [...list.querySelectorAll('.archive-item')];
  const count = document.querySelector('#result-count');
  const more = document.querySelector('#load-more');
  const empty = document.querySelector('#empty-state');
  const size = 18;
  let limit = size;
  const parameters = new URLSearchParams(location.search);
  let category = filters.some(button => button.dataset.filter === parameters.get('discipline')) ? parameters.get('discipline') : 'all';
  search.value = parameters.get('q') || '';
  if ([...sort.options].some(option => option.value === parameters.get('sort'))) sort.value = parameters.get('sort');
  filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === category)));
  function remember() {
    const url = new URL(location.href);
    const values = {q:search.value.trim(), discipline:category === 'all' ? '' : category, sort:sort.value === 'index' ? '' : sort.value};
    Object.entries(values).forEach(([key,value]) => value ? url.searchParams.set(key,value) : url.searchParams.delete(key));
    history.replaceState(null, '', url);
  }
  function render(reset = false) {
    if (reset) limit = size;
    const term = (search.value || '').toLocaleLowerCase().trim();
    const matched = items.filter(el => (category === 'all' || el.dataset.categories.split(' ').includes(category)) && (el.dataset.search || '').includes(term));
    matched.sort((a,b) => {
      if (sort.value === 'az') return a.dataset.title.localeCompare(b.dataset.title);
      if (sort.value === 'za') return b.dataset.title.localeCompare(a.dataset.title);
      if (sort.value === 'media') return Number(b.dataset.media) - Number(a.dataset.media) || Number(a.dataset.order) - Number(b.dataset.order);
      return Number(a.dataset.order) - Number(b.dataset.order);
    });
    items.forEach(el => el.hidden = true);
    matched.forEach((el,index) => {list.append(el); el.hidden = index >= limit;});
    count.textContent = `${matched.length} ${matched.length === 1 ? 'case study' : 'case studies'} · Showing ${Math.min(limit, matched.length)}`;
    more.hidden = limit >= matched.length;
    empty.hidden = matched.length > 0;
    remember();
  }
  filters.forEach(button => button.addEventListener('click', () => {
    category = button.dataset.filter;
    filters.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    render(true);
  }));
  search.addEventListener('input', () => render(true));
  sort.addEventListener('change', () => render(true));
  more.addEventListener('click', () => {
    const oldLimit = limit;
    limit += size;
    render();
    const shown = [...list.querySelectorAll('.archive-item:not([hidden])')];
    shown[oldLimit]?.querySelector('a')?.focus({preventScroll:true});
  });
  render();
})();
