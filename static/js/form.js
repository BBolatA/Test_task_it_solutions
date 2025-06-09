axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName  = 'X-CSRFToken';

axios.defaults.headers.common['Accept'] = 'application/json';

document.addEventListener('DOMContentLoaded', () => {
  const form        = document.getElementById('cashflow_form');
  const dateInput   = document.getElementById('date');
  const amountInput = document.getElementById('amount');
  const statusSel   = document.getElementById('status');
  const typeSel     = document.getElementById('type');
  const catSel      = document.getElementById('category');
  const subcatSel   = document.getElementById('subcategory');
  const commentTA   = document.getElementById('comment');

  const path= window.location.pathname;
  const isEdit= /\/\d+\/edit\/$/.test(path);
  const baseUrl= '/api/cashflow/';
  let objectId= null;

  if (isEdit) {
    objectId = path.match(/\/(\d+)\//)[1];
    axios.get(`${baseUrl}${objectId}/`)
      .then(({ data }) => {
        dateInput.value = data.date;
        amountInput.value = data.amount;
        statusSel.value = data.status.id;
        typeSel.value = data.type.id;
        catSel.value = data.category.id;
        loadSubcategories(data.category.id, data.subcategory.id);
        commentTA.value = data.comment;
      })
      .catch(e => console.error(e.response || e));
  } else {
    dateInput.value = new Date().toISOString().slice(0, 10);
    loadSubcategories('', null);
  }

  loadSelect(statusSel,'/api/status/');
  loadSelect(typeSel,'/api/kind/');
  loadSelect(catSel,'/api/category/');

  catSel.addEventListener('change', e => {
    loadSubcategories(e.target.value, null);
  });

  function loadSelect(elem, url) {
    axios.get(url)
      .then(({ data }) => {
        elem.innerHTML = '<option value="">—</option>';
        data.forEach(o => elem.add(new Option(o.name, o.id)));
      })
      .catch(e => console.error(e.response || e));
  }

  function loadSubcategories(catId, selectedId) {
    subcatSel.innerHTML = '<option value="">—</option>';
    if (!catId) return;
    axios.get(`/api/subcategory/?category=${catId}`)
      .then(({ data }) => {
        data.forEach(o => {
          const opt = new Option(o.name, o.id);
          if (o.id === selectedId) opt.selected = true;
          subcatSel.add(opt);
        });
      })
      .catch(e => console.error(e.response || e));
  }

  form.addEventListener('submit', e => {
    e.preventDefault();

    [amountInput, statusSel, typeSel, catSel, subcatSel].forEach(el => {
      el.classList.remove('is-invalid');
    });

    const errors = [];
    if (!dateInput.value) {
      errors.push('Дата не указана');
      dateInput.classList.add('is-invalid');
    }
    if (!amountInput.value || +amountInput.value <= 0) {
      errors.push('Сумма должна быть больше 0');
      amountInput.classList.add('is-invalid');
    }
    if (!statusSel.value) {
      errors.push('Не выбран статус');
      statusSel.classList.add('is-invalid');
    }
    if (!typeSel.value) {
      errors.push('Не выбран тип');
      typeSel.classList.add('is-invalid');
    }
    if (!catSel.value) {
      errors.push('Не выбрана категория');
      catSel.classList.add('is-invalid');
    }
    if (!subcatSel.value) {
      errors.push('Не выбрана подкатегория');
      subcatSel.classList.add('is-invalid');
    }

    if (errors.length) {
      return Swal.fire({
        icon: 'error',
        title: 'Проблемы с заполнением',
        html: `<ul style="text-align:left;margin:0;padding-left:1.2em;">` +
              errors.map(msg => `<li>${msg}</li>`).join('') +
              `</ul>`
      });
    }

    const payload = {
      date: dateInput.value,
      amount: amountInput.value,
      status: statusSel.value,
      type: typeSel.value,
      category: catSel.value,
      subcategory: subcatSel.value,
      comment: commentTA.value,
    };

    const request = isEdit
      ? axios.put(`${baseUrl}${objectId}/`, payload)
      : axios.post(baseUrl, payload);

    request
      .then(() => {
        Swal.fire({
          icon: 'success',
          title: 'Сохранено',
          showConfirmButton: false,
          timer: 1500
        }).then(() => {
          window.location.href = '/';
        });
      })
      .catch(err => {
        console.error('Response data:', err.response?.data);
        const msg = err.response?.data
          ? JSON.stringify(err.response.data)
          : err.message;
        Swal.fire({
          icon: 'error',
          title: 'Ошибка при сохранении',
          text: msg
        });
      });
  });
});
