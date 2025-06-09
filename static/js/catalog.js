axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';

const resources = {
  status: '/api/status/',
  kind: '/api/kind/',
  category: '/api/category/',
  subcategory: '/api/subcategory/'
};

const kindsCache = {};
const categoriesCache = {};
let currentModel = null;

function showToast(message, type = 'danger', delay = 5000) {
  const toastId = 'toast-' + Date.now();
  const html = `
    <div id="${toastId}" class="toast align-items-center text-bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Закрыть"></button>
      </div>
    </div>`;
  document.getElementById('toast-container').insertAdjacentHTML('beforeend', html);
  const toastEl = document.getElementById(toastId);
  const bsToast = new bootstrap.Toast(toastEl, { delay });
  bsToast.show();
  toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}

function clearFormErrors() {
  const form = document.getElementById('catalogForm');
  form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
  form.querySelectorAll('.invalid-feedback').forEach(el => el.remove());
}

function showFormErrors(errors) {
  const form = document.getElementById('catalogForm');
  const fieldNames = { name: 'Название', type: 'Тип', category: 'Категория' };
  Object.entries(errors).forEach(([field, messages]) => {
    const input = form.elements[field];
    if (input) {
      input.classList.add('is-invalid');
      const feedback = document.createElement('div');
      feedback.className = 'invalid-feedback';
      feedback.innerHTML = messages.join('<br>');
      input.parentNode.appendChild(feedback);
    } else {
      showToast((fieldNames[field] || field) + ': ' + messages.join(', '), 'danger');
    }
  });
}

window.openModal = (model, id = null) => {
  currentModel = model;
  const modalEl = document.getElementById('catalogModal');
  const form = modalEl.querySelector('#catalogForm');
  if (!form) {
    console.error('Не найден form#catalogForm в модале');
    return;
  }
  const title = modalEl.querySelector('#catalogTitle');
  const typeFld = modalEl.querySelector('#parentTypeField');
  const catFld = modalEl.querySelector('#parentCategoryField');
  form.reset();
  clearFormErrors();
  form.querySelector('input[name="id"]').value = id || '';
  typeFld.style.display = 'none';
  catFld.style.display = 'none';
  const captions = {
    status: ['статус','статусов'],
    kind: ['тип','типов'],
    category: ['категорию','категорий'],
    subcategory: ['подкатегорию','подкатегорий']
  };
  const [single] = captions[model];
  title.textContent = id ? `Редактировать ${single}` : `Новый ${single}`;
  if (model === 'category') {
    typeFld.style.display = 'block';
    const sel = form.querySelector('select[name="type"]');
    sel.innerHTML = '<option value="">—</option>';
    Object.entries(kindsCache).forEach(([k, v]) => sel.add(new Option(v, k)));
  }
  if (model === 'subcategory') {
    catFld.style.display = 'block';
    const sel = form.querySelector('select[name="category"]');
    sel.innerHTML = '<option value="">—</option>';
    Object.entries(categoriesCache).forEach(([k, v]) => sel.add(new Option(v, k)));
  }
  if (id) {
    axios.get(resources[model] + id + '/')
      .then(({ data }) => {
        Object.entries(data).forEach(([k, v]) => {
          const fld = form.querySelector(`[name="${k}"]`);
          if (fld) fld.value = v;
        });
      })
      .catch(err => {
        showToast('Не удалось загрузить данные: ' + err.message, 'danger');
        console.error(err);
      });
  }
  new bootstrap.Modal(modalEl).show();
};

window.deleteItem = (model, id) => {
  Swal.fire({
    title: 'Вы уверены?',
    text: 'Вы действительно хотите удалить запись?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Да, удалить',
    cancelButtonText: 'Отмена'
  }).then((result) => {
    if (result.isConfirmed) {
      axios.delete(resources[model] + id + '/')
        .then(() => {
          loadTable(model);
          showToast('Удалено успешно', 'success');
        })
        .catch(err => {
          showToast('Ошибка при удалении: ' + err.message, 'danger');
          console.error(err);
        });
    }
  });
};

window.saveCatalog = () => {
  const form = document.getElementById('catalogForm');
  const fd = new FormData(form);
  const data = {};
  fd.forEach((v, k) => {
    if (!v) return;
    if (k === 'type' && currentModel !== 'category') return;
    if (k === 'category' && currentModel !== 'subcategory') return;
    data[k] = v;
  });
  clearFormErrors();
  const id = data.id;
  const url = resources[currentModel] + (id ? id + '/' : '');
  const method = id ? 'put' : 'post';
  axios[method](url, data)
    .then(() => {
      const modalEl = document.getElementById('catalogModal');
      bootstrap.Modal.getInstance(modalEl).hide();
      loadTable(currentModel);
      showToast('Сохранено успешно', 'success');
    })
    .catch(err => {
      const resp = err.response?.data;
      if (resp && typeof resp === 'object') showFormErrors(resp);
      else showToast(err.message, 'danger');
      console.error(err);
    });
};

document.addEventListener('DOMContentLoaded', () => {
  Promise.all([axios.get(resources.kind), axios.get(resources.category)])
    .then(([kindsRes, catsRes]) => {
      kindsRes.data.forEach(o => { kindsCache[o.id] = o.name; });
      catsRes.data.forEach(o => { categoriesCache[o.id] = o.name; });
      document.querySelectorAll('.btn-add')
        .forEach(btn => btn.addEventListener('click', () => openModal(btn.dataset.model)));
      const saveBtn = document.getElementById('saveCatalogBtn');
      if (saveBtn) saveBtn.addEventListener('click', saveCatalog);
      Object.keys(resources).forEach(loadTable);
    })
    .catch(err => {
      showToast('Не удалось инициализировать: ' + err.message, 'danger');
      console.error(err);
    });
});

function loadTable(model) {
  axios.get(resources[model])
    .then(({ data }) => {
      const tbody = document.querySelector(`#${model}_table tbody`);
      tbody.innerHTML = '';
      data.forEach(item => {
        const tr = document.createElement('tr');
        tr.classList.add('align-middle');
        tr.innerHTML = `<td>${item.name}</td>`;
        if (model === 'category') tr.innerHTML += `<td>${kindsCache[item.type] || ''}</td>`;
        if (model === 'subcategory') tr.innerHTML += `<td>${categoriesCache[item.category] || ''}</td>`;
        const td = document.createElement('td');
        td.classList.add('text-end');
        td.innerHTML = `
          <button class="btn btn-link p-1 me-2 btn-edit" data-model="${model}" data-id="${item.id}" title="Редактировать">
            <i class="material-icons fs-4 text-secondary">edit</i>
          </button>
          <button class="btn btn-link p-1 btn-delete" data-model="${model}" data-id="${item.id}" title="Удалить">
            <i class="material-icons fs-4 text-danger">delete</i>
          </button>
        `;
        tr.appendChild(td);
        tbody.appendChild(tr);
      });
      tbody.querySelectorAll('.btn-edit')
        .forEach(btn => btn.addEventListener('click', () => openModal(btn.dataset.model, btn.dataset.id)));
      tbody.querySelectorAll('.btn-delete')
        .forEach(btn => btn.addEventListener('click', () => deleteItem(btn.dataset.model, btn.dataset.id)));
    })
    .catch(err => {
      showToast('Не удалось загрузить список: ' + err.message, 'danger');
      console.error(err);
    });
}
