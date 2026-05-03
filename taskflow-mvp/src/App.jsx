import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, Clock, Plus, Search, Send, Trash2 } from 'lucide-react';
import { sendTaskToCrm } from './services/crm.js';

const STORAGE_KEY = 'taskflow-pr05-tasks';

const initialTasks = [
  {
    id: 'task-001',
    title: 'Подготовить ПР-05',
    description: 'Настроить CRM и проверить API-интеграцию с веб-интерфейсом.',
    deadline: '2026-04-15',
    priority: 'high',
    category: 'Учеба',
    status: 'new',
    createdAt: '2026-04-10T10:30:00.000Z',
    crmSyncStatus: 'pending',
    crmDealId: null
  },
  {
    id: 'task-002',
    title: 'Проверить соответствие ПР-03',
    description: 'Сверить поля Task с таблицей соответствия CRM.',
    deadline: '2026-04-16',
    priority: 'medium',
    category: 'Документы',
    status: 'in_progress',
    createdAt: '2026-04-10T12:10:00.000Z',
    crmSyncStatus: 'pending',
    crmDealId: null
  },
  {
    id: 'task-003',
    title: 'Добавить тестовые записи',
    description: 'Создать набор реалистичных задач для демонстрации работы CRM.',
    deadline: '2026-04-17',
    priority: 'low',
    category: 'MVP',
    status: 'done',
    createdAt: '2026-04-10T13:45:00.000Z',
    crmSyncStatus: 'pending',
    crmDealId: null
  }
];

const priorityLabels = {
  low: 'Low',
  medium: 'Medium',
  high: 'High'
};

const statusLabels = {
  new: 'New',
  in_progress: 'In progress',
  done: 'Done'
};

function loadTasks() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialTasks));
    return initialTasks;
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : initialTasks;
  } catch {
    return initialTasks;
  }
}

function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function createTaskId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `task-${Date.now()}`;
}

function formatDate(dateValue) {
  if (!dateValue) {
    return 'Не указан';
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString('ru-RU');
}

function formatDateTime(dateValue) {
  if (!dateValue) {
    return 'Не указана';
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleString('ru-RU');
}

function StatCard({ title, value }) {
  return (
    <div className="stat-card">
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}

function CrmBadge({ task }) {
  const crmEntityId = task.crmDealId || task.crmLeadId;

  if (task.crmSyncStatus === 'success') {
    return <span className="crm-badge crm-badge-success">CRM #{crmEntityId}</span>;
  }

  if (task.crmSyncStatus === 'error') {
    return <span className="crm-badge crm-badge-error">CRM error</span>;
  }

  if (task.crmSyncStatus === 'syncing') {
    return <span className="crm-badge crm-badge-syncing">CRM syncing</span>;
  }

  return <span className="crm-badge crm-badge-pending">CRM pending</span>;
}

function Header({ onHome, onCreate }) {
  return (
    <header className="hero-card">
      <div>
        <p className="eyebrow">ПР-05 · CRM API Integration</p>
        <h1>TaskFlow — интеллектуальный планировщик задач</h1>
        <p className="hero-text">
          React-приложение из ПР-04 дополнено отправкой задач в Bitrix24 CRM через serverless API.
        </p>
      </div>
      <nav>
        <button className="secondary-button" onClick={onHome}>Главная</button>
        <button className="primary-button" onClick={onCreate}>Создать задачу</button>
      </nav>
    </header>
  );
}

function Dashboard({ tasks, onCreate, onOpen, onDone, onDelete, onSendToCrm }) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesQuery = !normalizedQuery || [task.title, task.description, task.category]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });
  }, [query, statusFilter, tasks]);

  const doneTasks = tasks.filter((task) => task.status === 'done').length;
  const inProgressTasks = tasks.filter((task) => task.status === 'in_progress').length;
  const productivity = tasks.length === 0 ? 0 : Math.round((doneTasks / tasks.length) * 100);

  return (
    <main className="layout-grid">
      <section className="content-card full-width">
        <div className="stats-grid">
          <StatCard title="Всего задач" value={tasks.length} />
          <StatCard title="Выполнено" value={doneTasks} />
          <StatCard title="В работе" value={inProgressTasks} />
          <StatCard title="Productivity score" value={`${productivity}%`} />
        </div>
      </section>

      <section className="content-card task-list-card">
        <div className="section-header">
          <div>
            <p className="eyebrow">Этап 1</p>
            <h2>Список задач</h2>
          </div>
          <button className="primary-button" onClick={onCreate}>
            <Plus size={18} /> Добавить задачу
          </button>
        </div>

        <div className="toolbar">
          <label className="search-field">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Поиск по названию, описанию или категории"
            />
          </label>

          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">Все статусы</option>
            <option value="new">New</option>
            <option value="in_progress">In progress</option>
            <option value="done">Done</option>
          </select>
        </div>

        <div className="task-stack">
          {filteredTasks.map((task) => (
            <article className="task-card" key={task.id}>
              <div className="task-main">
                <div className="task-title-row">
                  <h3>{task.title}</h3>
                  <span className={`status-pill status-${task.status}`}>{statusLabels[task.status]}</span>
                  <CrmBadge task={task} />
                </div>
                <p>{task.description}</p>
                <div className="task-meta">
                  <span>Дедлайн: {formatDate(task.deadline)}</span>
                  <span>Приоритет: {priorityLabels[task.priority]}</span>
                  <span>Категория: {task.category}</span>
                </div>
                {task.crmSyncError && <p className="error-text">CRM: {task.crmSyncError}</p>}
              </div>

              <div className="task-actions">
                <button className="secondary-button" onClick={() => onOpen(task.id)}>Открыть</button>
                {task.status !== 'done' && (
                  <button className="secondary-button" onClick={() => onDone(task.id)}>Выполнить</button>
                )}
                <button className="secondary-button" onClick={() => onSendToCrm(task.id)}>
                  <Send size={16} /> CRM
                </button>
                <button className="danger-button" onClick={() => onDelete(task.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <aside className="content-card info-card">
        <p className="eyebrow">О проекте</p>
        <h2>Интеграция CRM</h2>
        <p>
          Каждая новая задача сохраняется в браузере и передается в Bitrix24 CRM как сделка через endpoint
          <code>/api/crm/create-deal</code>.
        </p>
        <ul>
          <li>Frontend: React + Vite</li>
          <li>Хранилище MVP: localStorage</li>
          <li>CRM: Bitrix24 Deal</li>
          <li>Интеграция: REST API через Vercel Functions</li>
        </ul>
      </aside>
    </main>
  );
}

function TaskForm({ onBack, onSave }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    deadline: '',
    priority: 'medium',
    category: ''
  });
  const [errors, setErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const validate = () => {
    const nextErrors = [];

    if (!form.title.trim()) {
      nextErrors.push('Название задачи обязательно.');
    }

    if (!form.deadline) {
      nextErrors.push('Дедлайн обязателен.');
    }

    if (!form.category.trim()) {
      nextErrors.push('Категория обязательна.');
    }

    return nextErrors;
  };

  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();

    if (nextErrors.length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors([]);
    setIsSubmitting(true);

    const task = {
      id: createTaskId(),
      title: form.title.trim(),
      description: form.description.trim(),
      deadline: form.deadline,
      priority: form.priority,
      category: form.category.trim(),
      status: 'new',
      createdAt: new Date().toISOString(),
      crmSyncStatus: 'pending',
      crmDealId: null
    };

    await onSave(task);
    setIsSubmitting(false);
  };

  return (
    <main className="content-card form-card">
      <button className="secondary-button back-button" onClick={onBack}>
        <ArrowLeft size={18} /> Назад
      </button>

      <p className="eyebrow">Этап 2</p>
      <h2>Создание задачи</h2>
      <p className="muted-text">После сохранения задача будет автоматически отправлена в CRM через API.</p>

      {errors.length > 0 && (
        <div className="error-box">
          {errors.map((error) => <p key={error}>{error}</p>)}
        </div>
      )}

      <form className="task-form" onSubmit={submit}>
        <label>
          Название задачи
          <input
            value={form.title}
            onChange={(event) => updateField('title', event.target.value)}
            placeholder="Например: Подготовить отчет"
          />
        </label>

        <label>
          Описание
          <textarea
            value={form.description}
            onChange={(event) => updateField('description', event.target.value)}
            placeholder="Опиши задачу подробнее"
            rows={6}
          />
        </label>

        <div className="form-row">
          <label>
            Дедлайн
            <input
              type="date"
              value={form.deadline}
              onChange={(event) => updateField('deadline', event.target.value)}
            />
          </label>

          <label>
            Приоритет
            <select value={form.priority} onChange={(event) => updateField('priority', event.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
        </div>

        <label>
          Категория
          <input
            value={form.category}
            onChange={(event) => updateField('category', event.target.value)}
            placeholder="Учеба, работа, личное"
          />
        </label>

        <div className="form-actions">
          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Clock size={18} /> : <Check size={18} />}
            {isSubmitting ? 'Сохранение...' : 'Сохранить задачу'}
          </button>
          <button className="secondary-button" type="button" onClick={() => setForm({ title: '', description: '', deadline: '', priority: 'medium', category: '' })}>
            Очистить форму
          </button>
        </div>
      </form>
    </main>
  );
}

function TaskDetails({ task, onBack, onDone, onDelete, onSendToCrm }) {
  if (!task) {
    return (
      <main className="content-card">
        <h2>Задача не найдена</h2>
        <button className="primary-button" onClick={onBack}>К списку</button>
      </main>
    );
  }

  return (
    <main className="content-card details-card">
      <div className="section-header">
        <div>
          <p className="eyebrow">Этап 3 · Просмотр задачи</p>
          <h2>{task.title}</h2>
        </div>
        <div className="details-actions">
          <button className="secondary-button" onClick={onBack}>
            <ArrowLeft size={18} /> К списку
          </button>
          {task.status !== 'done' && (
            <button className="primary-button" onClick={() => onDone(task.id)}>Отметить выполненной</button>
          )}
          <button className="secondary-button" onClick={() => onSendToCrm(task.id)}>
            <Send size={16} /> Отправить в CRM
          </button>
          <button className="danger-button" onClick={() => onDelete(task.id)}>Удалить</button>
        </div>
      </div>

      <div className="details-grid">
        <section className="description-box">
          <h3>Описание задачи</h3>
          <p>{task.description || 'Описание не указано.'}</p>
        </section>

        <section className="params-box">
          <h3>Параметры</h3>
          <dl>
            <div>
              <dt>Статус</dt>
              <dd>{statusLabels[task.status]}</dd>
            </div>
            <div>
              <dt>Дедлайн</dt>
              <dd>{formatDate(task.deadline)}</dd>
            </div>
            <div>
              <dt>Приоритет</dt>
              <dd>{priorityLabels[task.priority]}</dd>
            </div>
            <div>
              <dt>Категория</dt>
              <dd>{task.category}</dd>
            </div>
            <div>
              <dt>Создана</dt>
              <dd>{formatDateTime(task.createdAt)}</dd>
            </div>
            <div>
              <dt>CRM</dt>
              <dd><CrmBadge task={task} /></dd>
            </div>
            {task.crmDealId && (
              <div>
                <dt>ID сделки</dt>
                <dd>{task.crmDealId}</dd>
              </div>
            )}
          </dl>
          {task.crmSyncError && <p className="error-text">Ошибка CRM: {task.crmSyncError}</p>}
        </section>
      </div>
    </main>
  );
}

export default function App() {
  const [tasks, setTasks] = useState(loadTasks);
  const [screen, setScreen] = useState('dashboard');
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setToast(''), 4500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const updateTask = (taskId, updater) => {
    setTasks((currentTasks) => currentTasks.map((task) => (
      task.id === taskId ? { ...task, ...updater(task) } : task
    )));
  };

  const syncTaskToCrm = async (task) => {
    updateTask(task.id, () => ({ crmSyncStatus: 'syncing', crmSyncError: '' }));

    try {
      const result = await sendTaskToCrm(task);
      updateTask(task.id, () => ({
        crmSyncStatus: 'success',
        crmDealId: result.dealId,
        crmSyncError: '',
        crmLastSyncAt: new Date().toISOString()
      }));
      setToast(result.message || 'Задача успешно отправлена в CRM.');
    } catch (error) {
      updateTask(task.id, () => ({
        crmSyncStatus: 'error',
        crmSyncError: error.message,
        crmLastSyncAt: new Date().toISOString()
      }));
      setToast(error.message || 'Не удалось отправить задачу в CRM.');
    }
  };

  const sendToCrm = async (taskId) => {
    const task = tasks.find((item) => item.id === taskId);

    if (!task) {
      setToast('Задача не найдена.');
      return;
    }

    await syncTaskToCrm(task);
  };

  const saveTask = async (task) => {
    setTasks((currentTasks) => [task, ...currentTasks]);
    setSelectedTaskId(task.id);
    setScreen('details');

    window.setTimeout(() => {
      syncTaskToCrm(task);
    }, 100);
  };

  const markDone = (taskId) => {
    updateTask(taskId, () => ({ status: 'done' }));
    setToast('Задача отмечена выполненной.');
  };

  const deleteTask = (taskId) => {
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
    setToast('Задача удалена.');

    if (selectedTaskId === taskId) {
      setScreen('dashboard');
      setSelectedTaskId(null);
    }
  };

  const openTask = (taskId) => {
    setSelectedTaskId(taskId);
    setScreen('details');
  };

  const selectedTask = tasks.find((task) => task.id === selectedTaskId);

  return (
    <div className="app-shell">
      <Header onHome={() => setScreen('dashboard')} onCreate={() => setScreen('create')} />

      {screen === 'dashboard' && (
        <Dashboard
          tasks={tasks}
          onCreate={() => setScreen('create')}
          onOpen={openTask}
          onDone={markDone}
          onDelete={deleteTask}
          onSendToCrm={sendToCrm}
        />
      )}

      {screen === 'create' && (
        <TaskForm
          onBack={() => setScreen('dashboard')}
          onSave={saveTask}
        />
      )}

      {screen === 'details' && (
        <TaskDetails
          task={selectedTask}
          onBack={() => setScreen('dashboard')}
          onDone={markDone}
          onDelete={deleteTask}
          onSendToCrm={sendToCrm}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
