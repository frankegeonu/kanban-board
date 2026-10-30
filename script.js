'use strict';

const COLUMNS = ['todo', 'doing', 'done'];
const PRIORITY = { low: 'Bassa', medium: 'Media', high: 'Alta' };
const EMPTY = { todo: 'Nessuna attività', doing: 'Nulla in corso', done: 'Niente di completato' };

const $ = (s) => document.querySelector(s);
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

let user = null;       
let tasks = [];
let dragId = null;     
let editId = null;     
let mode = 'login';

async function hash(password, email) {
  const data = new TextEncoder().encode(email + ':' + password);
  if (!crypto.subtle) return btoa(email + password);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function showError(msg) {
  $('#auth-error').hidden = !msg;
  $('#auth-error').textContent = msg || '';
}

function setMode(newMode) {
  mode = newMode;
  const register = mode === 'register';
  $('#name-field').hidden = !register;
  $('#auth-subtitle').textContent = register ? 'Crea un account gratuito' : 'Accedi per vedere le tue attività';
  $('#auth-submit').textContent = register ? 'Crea account' : 'Accedi';
  $('#auth-switch').textContent = register ? 'Hai già un account? Accedi' : 'Non hai un account? Registrati';
  $('#password').autocomplete = register ? 'new-password' : 'current-password';
  showError('');
}

$('#auth-switch').addEventListener('click', () => setMode(mode === 'login' ? 'register' : 'login'));

$('#auth-form').addEventListener('submit', async e => {
  e.preventDefault();
  const email = $('#email').value.trim().toLowerCase();
  const password = $('#password').value;
  const name = $('#name').value.trim();

  if (!/^\S+@\S+\.\S+$/.test(email)) return showError('Inserisci un\'email valida.');
  if (password.length < 6) return showError('La password deve avere almeno 6 caratteri.');

  const users = read('kanban-users', {});
  const h = await hash(password, email);

  if (mode === 'register') {
    if (!name) return showError('Inserisci il tuo nome.');
    if (users[email]) return showError('Esiste già un account con questa email.');
    users[email] = { name, hash: h };
    write('kanban-users', users);
  } else if (!users[email] || users[email].hash !== h) {
    return showError('Email o password non corrette.');
  }

  e.target.reset();
  start({ email, name: users[email].name });
});

$('#guest-btn').addEventListener('click', () => start({ guest: true, name: 'Ospite' }));

$('#logout-btn').addEventListener('click', () => {
  localStorage.removeItem('kanban-session');
  user = null;
  tasks = [];
  $('#app-view').hidden = true;
  $('#auth-view').hidden = false;
  document.body.dataset.view = 'auth';
  setMode('login');
});


function tasksKey() {
  return user.guest ? 'kanban-tasks' : 'kanban-tasks:' + user.email;
}

function save() { write(tasksKey(), tasks); }

function start(u) {
  user = u;
  write('kanban-session', u.guest ? { guest: true } : { email: u.email });
  tasks = read(tasksKey(), []);
  $('#user-name').textContent = u.name;
  $('#auth-view').hidden = true;
  $('#app-view').hidden = false;
  document.body.dataset.view = 'app';
  render();
}


function render() {
  const q = $('#search').value.trim().toLowerCase();

  COLUMNS.forEach(col => {
    const list = document.getElementById(col);
    list.innerHTML = '';

    const colTasks = tasks.filter(t => t.column === col);
    const visible = colTasks.filter(t => (t.title + ' ' + (t.desc || '')).toLowerCase().includes(q));
    document.querySelector(`[data-count="${col}"]`).textContent = colTasks.length;

    visible.forEach(t => list.appendChild(createCard(t)));

    if (!visible.length) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = colTasks.length ? 'Nessun risultato' : EMPTY[col];
      list.appendChild(empty);
    }
  });
}

function createCard(task) {
  const card = $('#card-template').content.firstElementChild.cloneNode(true);
  card.dataset.id = task.id;
  card.dataset.priority = task.priority;
  card.dataset.column = task.column;

  card.querySelector('.badge').textContent = PRIORITY[task.priority];
  card.querySelector('.card-title').textContent = task.title;

  const desc = card.querySelector('.card-desc');
  if (task.desc) desc.textContent = task.desc; else desc.remove();

  const due = card.querySelector('.due');
  if (task.due) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const date = new Date(task.due + 'T00:00:00');
    due.textContent = '📅 ' + date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
    if (date < today && task.column !== 'done') due.classList.add('overdue');
  } else due.remove();

  card.querySelector('[data-action="edit"]').addEventListener('click', () => openDialog(task));
  card.querySelector('[data-action="delete"]').addEventListener('click', () => {
    tasks = tasks.filter(t => t.id !== task.id);
    save(); render();
  });
  card.addEventListener('dblclick', e => { if (!e.target.closest('button')) openDialog(task); });

  card.addEventListener('dragstart', e => {
    dragId = task.id;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
    setTimeout(() => card.classList.add('dragging'), 0);
  });
  card.addEventListener('dragend', () => {
    card.classList.remove('dragging');
    clearMarks();
    dragId = null;
  });

  return card;
}


function clearMarks() {
  document.querySelectorAll('.drag-over, .drop-before')
    .forEach(el => el.classList.remove('drag-over', 'drop-before'));
}


function cardAfter(list, y) {
  return [...list.querySelectorAll('.card:not(.dragging)')].find(c => {
    const r = c.getBoundingClientRect();
    return y < r.top + r.height / 2;
  }) || null;
}

function moveTask(id, column, beforeId) {
  const task = tasks.find(t => t.id === id);
  if (!task || id === beforeId) return;
  tasks = tasks.filter(t => t.id !== id);
  task.column = column;
  const i = beforeId ? tasks.findIndex(t => t.id === beforeId) : -1;
  if (i === -1) tasks.push(task); else tasks.splice(i, 0, task);
  save(); render();
}

document.querySelectorAll('.column').forEach(column => {
  const list = column.querySelector('.task-list');

  column.addEventListener('dragover', e => {
    if (!dragId) return;
    e.preventDefault();
    clearMarks();
    column.classList.add('drag-over');
    const next = cardAfter(list, e.clientY);
    if (next) next.classList.add('drop-before');
  });

  column.addEventListener('dragleave', e => {
    if (!column.contains(e.relatedTarget)) clearMarks();
  });

  column.addEventListener('drop', e => {
    e.preventDefault();
    const next = cardAfter(list, e.clientY);
    clearMarks();
    if (dragId) moveTask(dragId, column.dataset.column, next ? next.dataset.id : null);
  });
});


const dialog = $('#task-dialog');

function openDialog(task) {
  editId = task ? task.id : null;
  $('#dialog-title').textContent = task ? 'Modifica attività' : 'Nuova attività';
  $('#save-btn').textContent = task ? 'Salva' : 'Aggiungi';

  $('#task-title').value = task ? task.title : '';
  $('#task-desc').value = task ? task.desc || '' : '';
  $('#task-priority').value = task ? task.priority : 'medium';
  $('#task-due').value = task ? task.due || '' : '';
  $('#task-column').value = task ? task.column : 'todo';

  dialog.showModal();
  $('#task-title').focus();
}

$('#add-btn').addEventListener('click', () => openDialog());
$('#cancel-btn').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); }); // click fuori

$('#task-form').addEventListener('submit', e => {
  e.preventDefault();
  const data = {
    title: $('#task-title').value.trim(),
    desc: $('#task-desc').value.trim(),
    priority: $('#task-priority').value,
    due: $('#task-due').value,
    column: $('#task-column').value
  };
  if (!data.title) return;

  if (editId) Object.assign(tasks.find(t => t.id === editId), data);
  else tasks.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), ...data });

  save(); render();
  dialog.close();
});

$('#search').addEventListener('input', render);

(function init() {
  const s = read('kanban-session', null);
  if (s && s.guest) return start({ guest: true, name: 'Ospite' });
  if (s && s.email) {
    const u = read('kanban-users', {})[s.email];
    if (u) return start({ email: s.email, name: u.name });
  }
})();