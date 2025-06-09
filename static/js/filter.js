document.addEventListener('DOMContentLoaded', () => {
  const jumpPopup = document.createElement('div');
  jumpPopup.id = 'jump-popup';
  Object.assign(jumpPopup.style, {
    position: 'absolute',
    display: 'none',
    zIndex: 2000,
    padding: '.25rem',
    background: '#fff',
    border: '1px solid #ccc',
    borderRadius: '.25rem',
    boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
  });
  document.body.appendChild(jumpPopup);

  const jumpInput = document.createElement('input');
  Object.assign(jumpInput, { type: 'number', min: '1', placeholder: '№' });
  Object.assign(jumpInput.style, {
    width: '4ch',
    padding: '.25rem',
    fontSize: '.875rem',
    textAlign: 'center',
    border: '1px solid #ced4da',
    borderRadius: '.25rem',
    outline: 'none',
    MozAppearance: 'textfield'
  });
  jumpPopup.appendChild(jumpInput);

  document.addEventListener('click', e => {
    if (!jumpPopup.contains(e.target) && !e.target.closest('.gap-item')) {
      jumpPopup.style.display = 'none';
    }
  });

  jumpInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const totalPages = Math.ceil(lastTotalCount / pageSize);
      let p = parseInt(jumpInput.value, 10) || currentPage;
      p = Math.min(Math.max(1, p), totalPages);
      fetchCashflow(p);
      jumpPopup.style.display = 'none';
    }
    if (e.key === 'Escape') {
      jumpPopup.style.display = 'none';
    }
  });

  function showPopup(anchor) {
    const rect = anchor.getBoundingClientRect();
    jumpPopup.style.display = 'block';
    jumpPopup.style.visibility = 'hidden';
    const popupRect = jumpPopup.getBoundingClientRect();
    let top = rect.top - popupRect.height - 5;
    if (top < 0) top = rect.bottom + 5;
    let left = rect.left + rect.width / 2 - popupRect.width / 2;
    left = Math.max(5, Math.min(left, window.innerWidth - popupRect.width - 5));
    Object.assign(jumpPopup.style, {
      top: `${top}px`,
      left: `${left}px`,
      visibility: 'visible'
    });
    jumpInput.value = '';
    jumpInput.focus();
  }

  axios.defaults.xsrfCookieName = 'csrftoken';
  axios.defaults.xsrfHeaderName = 'X-CSRFToken';

  const fpFrom = flatpickr('#date_from', { dateFormat: 'Y-m-d' });
  const fpTo = flatpickr('#date_to',   { dateFormat: 'Y-m-d' });

  const endpoints = {
    status:'/api/status/',
    kind:'/api/kind/',
    category:'/api/category/',
    subcategory:catId => `/api/subcategory/?category=${catId}`,
    cashflow:'/api/cashflow/',
    cashflowDetail:id  => `/api/cashflow/${id}/`
  };

  function loadSelect(id, url, params = {}) {
    return axios.get(url, { params })
      .then(({ data }) => {
        const sel = document.getElementById(id);
        if (!sel) return;
        sel.innerHTML = '<option value="">—</option>';
        data.forEach(o => sel.add(new Option(o.name, o.id)));
      })
      .catch(err => console.error(`Ошибка загрузки ${id}:`, err));
  }

  loadSelect('status_filter',   endpoints.status);
  loadSelect('kind_filter',     endpoints.kind);
  loadSelect('category_filter', endpoints.category);
  document.getElementById('category_filter')
    ?.addEventListener('change', e => {
      loadSelect('subcategory_filter', endpoints.subcategory(e.target.value));
    });

  let currentPage = 1;
  const pageSize = 50;
  let lastTotalCount = 0;

  function formatRub(v) {
    return Number(v)
      .toLocaleString('ru-RU', { minimumFractionDigits: 0 })
      + ' ₽';
  }

  function ensurePaginationContainer() {
    let container = document.getElementById('pagination_container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'pagination_container';
      const wrap = document.querySelector('#cashflow_table').closest('.table-responsive');
      wrap.parentNode.insertBefore(container, wrap.nextSibling);
    }
    let nav = container.querySelector('nav[aria-label="Page navigation"]');
    if (!nav) {
      nav = document.createElement('nav');
      nav.setAttribute('aria-label', 'Page navigation');
      const ul = document.createElement('ul');
      ul.className = 'pagination justify-content-center my-2';
      nav.appendChild(ul);
      container.appendChild(nav);
    }
    return nav;
  }

  function createPageItem(page, label, isActive, isDisabled) {
    const li = document.createElement('li');
    li.className = 'page-item';
    if (isActive)   li.classList.add('active');
    if (isDisabled) li.classList.add('disabled');
    const a = document.createElement('a');
    a.className = 'page-link';
    a.href = '#';
    a.dataset.page = page;
    a.textContent = label;
    li.appendChild(a);
    return li;
  }

  function renderPagination(totalCount) {
    lastTotalCount = totalCount;
    const totalPages = Math.ceil(totalCount / pageSize);
    const delta = 2;
    const range = [];
    for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) {
      range.push(i);
    }

    const pages = [];
    if (range[0] > 1) {
      pages.push(1);
      if (range[0] > 2) pages.push('gap');
    }
    pages.push(...range);
    if (range[range.length - 1] < totalPages) {
      if (range[range.length - 1] < totalPages - 1) pages.push('gap');
      pages.push(totalPages);
    }

    const nav = ensurePaginationContainer();
    const ul  = nav.querySelector('ul.pagination');
    ul.innerHTML = '';

    ul.appendChild(createPageItem(currentPage - 1, '«', false, currentPage === 1));

    pages.forEach(p => {
      if (p === 'gap') {
        const li = document.createElement('li');
        li.className = 'page-item gap-item';
        const a = document.createElement('a');
        a.className = 'page-link';
        a.href = '#';
        a.innerHTML = '<i class="material-icons">search</i>';
        li.appendChild(a);
        li.addEventListener('click', e => {
          e.stopPropagation();
          showPopup(a);
        });
        ul.appendChild(li);
      } else {
        ul.appendChild(createPageItem(p, p, p === currentPage, false));
      }
    });

    ul.appendChild(createPageItem(currentPage + 1, '»', false, currentPage === totalPages));

    ul.querySelectorAll('li.page-item:not(.gap-item) a.page-link')
      .forEach(a => {
        a.addEventListener('click', e => {
          e.preventDefault();
          const page = +a.dataset.page;
          if (page >= 1 && page <= totalPages) {
            fetchCashflow(page);
          }
        });
      });
  }

  function fetchCashflow(page = 1) {
    currentPage = page;
    const getVal = id => document.getElementById(id)?.value || '';
    axios.get(endpoints.cashflow, {
      params: {
        page,
        page_size: pageSize,
        date_from: getVal('date_from'),
        date_to:   getVal('date_to'),
        status:    getVal('status_filter'),
        type:      getVal('kind_filter'),
        category:  getVal('category_filter'),
        subcategory: getVal('subcategory_filter'),
      }
    })
    .then(({ data }) => {
      renderTable(data.results);
      renderPagination(data.count);
    })
    .catch(err => console.error('Ошибка загрузки ДДС:', err));
  }

  function renderTable(items) {
    const tbody = document.querySelector('#cashflow_table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    items.forEach(it => {
      tbody.insertAdjacentHTML('beforeend', `
        <tr data-id="${it.id}">
          <td>${it.date}</td>
          <td class="text-end">${formatRub(it.amount)}</td>
          <td>${it.status_name || it.status}</td>
          <td>${it.type_name   || it.type}</td>
          <td>${it.category_name || it.category}</td>
          <td>${it.subcategory_name || it.subcategory}</td>
          <td>${it.comment || ''}</td>
          <td class="text-center">
            <button class="btn btn-link edit-record" data-id="${it.id}" title="Редактировать">
              <i class="material-icons">edit</i>
            </button>
            <button class="btn btn-link text-danger delete-record" data-id="${it.id}" title="Удалить">
              <i class="material-icons">delete</i>
            </button>
          </td>
        </tr>`);
    });

    document.querySelectorAll('.delete-record').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        const id = btn.dataset.id;

        Swal.fire({
          title: 'Вы уверены?',
          text: "Запись будет окончательно удалена!",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Да, удалить',
          cancelButtonText: 'Отмена',
          reverseButtons: true,
          focusCancel: true,
        }).then(result => {
          if (result.isConfirmed) {
            axios.delete(endpoints.cashflowDetail(id))
              .then(() => {
                Swal.fire('Удалено!', 'Запись успешно удалена.', 'success')
                  .then(() => fetchCashflow(currentPage));
              })
              .catch(err => {
                Swal.fire('Ошибка!', err.response?.data?.detail || err.message, 'error');
              });
          }
        });
      });
    });

    document.querySelectorAll('.edit-record').forEach(btn => {
      btn.addEventListener('click', () => openEditModal(btn.dataset.id));
    });
  }

  function openEditModal(id) {
    axios.get(endpoints.cashflowDetail(id))
      .then(({ data }) => {
        document.getElementById('modal_id').value = data.id;
        document.getElementById('modal_date').value = data.date;
        document.getElementById('modal_amount').value = data.amount;
        document.getElementById('modal_comment').value = data.comment || '';

        loadSelect('modal_status', endpoints.status)
          .then(() => document.getElementById('modal_status').value = data.status);

        loadSelect('modal_type', endpoints.kind)
          .then(() => document.getElementById('modal_type').value = data.type);

        loadSelect('modal_category', endpoints.category)
          .then(() => {
            document.getElementById('modal_category').value = data.category;
            return loadSelect('modal_subcategory', endpoints.subcategory(data.category));
          })
          .then(() => document.getElementById('modal_subcategory').value = data.subcategory);

        new bootstrap.Modal(document.getElementById('cashflowModal')).show();
      })
      .catch(err => console.error('Ошибка загрузки для редактирования:', err));
  }

  document.getElementById('modal_category')
    ?.addEventListener('change', e => {
      loadSelect('modal_subcategory', endpoints.subcategory(e.target.value));
    });

  document.getElementById('cashflowForm')
    ?.addEventListener('submit', e => {
      e.preventDefault();
      const id = document.getElementById('modal_id').value;
      const payload = {
        date: document.getElementById('modal_date').value,
        amount: document.getElementById('modal_amount').value,
        status: document.getElementById('modal_status').value,
        type: document.getElementById('modal_type').value,
        category: document.getElementById('modal_category').value,
        subcategory: document.getElementById('modal_subcategory').value,
        comment: document.getElementById('modal_comment').value,
      };
      axios.put(endpoints.cashflowDetail(id), payload)
        .then(() => {
          fetchCashflow(currentPage);
          bootstrap.Modal.getInstance(document.getElementById('cashflowModal')).hide();
        })
        .catch(err => console.error('Ошибка сохранения изменений:', err));
    });

  document.getElementById('apply_filters')
    ?.addEventListener('click', () => fetchCashflow(1));

  document.getElementById('reset_filters')
    ?.addEventListener('click', () => {
      fpFrom.clear();
      fpTo.clear();
      ['status_filter','kind_filter','category_filter','subcategory_filter']
        .forEach(id => document.getElementById(id).value = '');
      loadSelect('status_filter',   endpoints.status);
      loadSelect('kind_filter',     endpoints.kind);
      loadSelect('category_filter', endpoints.category);
      document.getElementById('subcategory_filter').innerHTML = '<option value="">—</option>';
      fetchCashflow(1);
    });

  fetchCashflow(1);
});
