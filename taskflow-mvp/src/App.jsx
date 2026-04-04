import React, { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "taskflow_mvp_tasks";

const seedTasks = [
  {
    id: crypto.randomUUID(),
    title: "Подготовить ПР-04",
    description: "Сделать работающий веб-интерфейс MVP и проверить навигацию.",
    deadline: "2026-04-08",
    priority: "high",
    category: "Учеба",
    status: "new",
    createdAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    title: "Проверить соответствие ПР-02",
    description: "Сверить wireframes и реализованные экраны.",
    deadline: "2026-04-09",
    priority: "medium",
    category: "Документы",
    status: "in_progress",
    createdAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    title: "Добавить тестовые записи",
    description: "Подготовить минимум 3 записи для демонстрации работы формы.",
    deadline: "2026-04-10",
    priority: "low",
    category: "MVP",
    status: "done",
    createdAt: new Date().toISOString(),
  },
];

const emptyForm = {
  title: "",
  description: "",
  deadline: "",
  priority: "medium",
  category: "",
};

function priorityLabel(priority) {
  if (priority === "high") return "High";
  if (priority === "low") return "Low";
  return "Medium";
}

function statusLabel(status) {
  if (status === "done") return "Done";
  if (status === "in_progress") return "In progress";
  return "New";
}

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [route, setRoute] = useState({ page: "dashboard", taskId: null });
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setTasks(JSON.parse(saved));
    } else {
      setTasks(seedTasks);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seedTasks));
    }
  }, []);

  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }
  }, [tasks]);

  const currentTask = useMemo(
    () => tasks.find((task) => task.id === route.taskId) || null,
    [tasks, route.taskId]
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        task.description.toLowerCase().includes(search.toLowerCase()) ||
        task.category.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = filterStatus === "all" || task.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [tasks, search, filterStatus]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.status === "done").length;
    const inProgress = tasks.filter((task) => task.status === "in_progress").length;
    const score = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, inProgress, score };
  }, [tasks]);

  function goToDashboard() {
    setRoute({ page: "dashboard", taskId: null });
  }

  function goToCreate() {
    setForm(emptyForm);
    setErrors({});
    setRoute({ page: "create", taskId: null });
  }

  function goToTask(taskId) {
    setRoute({ page: "task", taskId });
  }

  function validateForm() {
    const nextErrors = {};
    if (!form.title.trim()) nextErrors.title = "Введите название задачи";
    if (!form.deadline) nextErrors.deadline = "Укажите дедлайн";
    if (!form.category.trim()) nextErrors.category = "Укажите категорию";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleCreateTask() {
    if (!validateForm()) return;

    const newTask = {
      id: crypto.randomUUID(),
      ...form,
      status: "new",
      createdAt: new Date().toISOString(),
    };

    const nextTasks = [newTask, ...tasks];
    setTasks(nextTasks);
    setForm(emptyForm);
    setRoute({ page: "task", taskId: newTask.id });
  }

  function markAsDone(taskId) {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, status: "done" } : task
      )
    );
  }

  function deleteTask(taskId) {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
    goToDashboard();
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <p style={styles.kicker}>Веб-интерфейс MVP</p>
            <h1 style={styles.h1}>TaskFlow — интеллектуальный планировщик задач</h1>
            <p style={styles.subtitle}>
              React-приложение для ПР-04. Реализованы 3 ключевых экрана:
              список задач, создание задачи и просмотр задачи.
            </p>
          </div>
          <div style={styles.nav}>
            <button style={styles.secondaryBtn} onClick={goToDashboard}>
              Главная
            </button>
            <button style={styles.secondaryBtn} onClick={goToCreate}>
              Создать задачу
            </button>
          </div>
        </header>

        <section style={styles.statsGrid}>
          <StatCard title="Всего задач" value={stats.total} />
          <StatCard title="Выполнено" value={stats.completed} />
          <StatCard title="В работе" value={stats.inProgress} />
          <StatCard title="Productivity score" value={`${stats.score}%`} />
        </section>

        {route.page === "dashboard" && (
          <div style={styles.mainGrid}>
            <section style={styles.card}>
              <div style={styles.sectionHead}>
                <div>
                  <h2 style={styles.h2}>Список задач</h2>
                  <p style={styles.muted}>Экран 1. Основной dashboard продукта</p>
                </div>
                <button style={styles.primaryBtn} onClick={goToCreate}>
                  + Добавить задачу
                </button>
              </div>

              <div style={styles.filters}>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Поиск по названию, описанию или категории"
                  style={styles.input}
                />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={styles.input}
                >
                  <option value="all">Все статусы</option>
                  <option value="new">New</option>
                  <option value="in_progress">In progress</option>
                  <option value="done">Done</option>
                </select>
              </div>

              <div style={{ display: "grid", gap: 16 }}>
                {filteredTasks.length === 0 ? (
                  <div style={styles.empty}>
                    Задачи не найдены. Создай первую запись через форму.
                  </div>
                ) : (
                  filteredTasks.map((task) => (
                    <article key={task.id} style={styles.taskCard}>
                      <div style={styles.taskTop}>
                        <div style={{ flex: 1 }}>
                          <div style={styles.titleRow}>
                            <h3 style={styles.taskTitle}>{task.title}</h3>
                            <Badge>{statusLabel(task.status)}</Badge>
                          </div>
                          <p style={styles.taskDescription}>{task.description}</p>
                          <div style={styles.metaRow}>
                            <span>Дедлайн: {task.deadline}</span>
                            <span>Приоритет: {priorityLabel(task.priority)}</span>
                            <span>Категория: {task.category}</span>
                          </div>
                        </div>
                        <div style={styles.actionRow}>
                          <button
                            style={styles.secondaryBtn}
                            onClick={() => goToTask(task.id)}
                          >
                            Открыть
                          </button>
                            {task.status !== "done" && (
                              <button
                                style={styles.secondaryBtn}
                                onClick={() => markAsDone(task.id)}
                              >
                                Выполнить
                              </button>
                            )}
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>

            <aside style={styles.card}>
              <h2 style={styles.h2}>О проекте</h2>
              <p style={styles.sidebarText}>
                Этот MVP основан на предыдущих работах: wireframes из ПР-02 и
                сущности данных из ПР-03. Форма создания задачи использует поля
                title, description, deadline, priority и category.
              </p>
              <div style={styles.infoList}>
                <InfoRow label="Экран 1" value="Dashboard / список задач" />
                <InfoRow label="Экран 2" value="Создание задачи" />
                <InfoRow label="Экран 3" value="Просмотр задачи" />
                <InfoRow label="Хранилище" value="localStorage" />
                <InfoRow label="Навигация" value="Внутри React-приложения" />
              </div>
            </aside>
          </div>
        )}

        {route.page === "create" && (
          <section style={{ ...styles.card, maxWidth: 900, margin: "0 auto" }}>
            <div style={styles.sectionHead}>
              <div>
                <h2 style={styles.h2}>Создание задачи</h2>
                <p style={styles.muted}>Экран 2. Форма сбора данных</p>
              </div>
              <button style={styles.secondaryBtn} onClick={goToDashboard}>
                ← Назад
              </button>
            </div>

            <div style={{ display: "grid", gap: 20 }}>
              <Field label="Название задачи" error={errors.title}>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  style={styles.input}
                  placeholder="Например: Подготовить отчет"
                />
              </Field>

              <Field label="Описание">
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  style={{ ...styles.input, minHeight: 120, resize: "vertical" }}
                  placeholder="Опиши задачу подробнее"
                />
              </Field>

              <div style={styles.twoCol}>
                <Field label="Дедлайн" error={errors.deadline}>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                    style={styles.input}
                  />
                </Field>

                <Field label="Приоритет">
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    style={styles.input}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </Field>
              </div>

              <Field label="Категория" error={errors.category}>
                <input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  style={styles.input}
                  placeholder="Учеба, работа, личное"
                />
              </Field>

              <div style={styles.actionRow}>
                <button style={styles.primaryBtn} onClick={handleCreateTask}>
                  Сохранить задачу
                </button>
                <button
                  style={styles.secondaryBtn}
                  onClick={() => setForm(emptyForm)}
                >
                  Очистить форму
                </button>
              </div>
            </div>
          </section>
        )}

        {route.page === "task" && currentTask && (
          <section style={{ ...styles.card, maxWidth: 1000, margin: "0 auto" }}>
            <div style={styles.sectionHead}>
              <div>
                <p style={styles.muted}>Экран 3. Просмотр задачи</p>
                <h2 style={styles.h2}>{currentTask.title}</h2>
              </div>
              <div style={styles.actionRow}>
                <button style={styles.secondaryBtn} onClick={goToDashboard}>
                  ← К списку
                </button>
                {currentTask.status !== "done" && (
                  <button
                    style={styles.primaryBtn}
                    onClick={() => markAsDone(currentTask.id)}
                  >
                    Отметить выполненной
                  </button>
                )}
                <button
                  style={styles.secondaryBtn}
                  onClick={() => deleteTask(currentTask.id)}
                >
                  Удалить
                </button>
              </div>
            </div>

            <div style={styles.mainGrid}>
              <div style={styles.innerCard}>
                <h3 style={styles.h3}>Описание задачи</h3>
                <p style={styles.taskDescription}>
                  {currentTask.description || "Описание не указано."}
                </p>
              </div>

              <div style={styles.innerCard}>
                <h3 style={styles.h3}>Параметры</h3>
                <div style={styles.infoList}>
                  <InfoRow label="Статус" value={statusLabel(currentTask.status)} />
                  <InfoRow label="Дедлайн" value={currentTask.deadline || "—"} />
                  <InfoRow
                    label="Приоритет"
                    value={priorityLabel(currentTask.priority)}
                  />
                  <InfoRow label="Категория" value={currentTask.category || "—"} />
                  <InfoRow
                    label="Создана"
                    value={new Date(currentTask.createdAt).toLocaleString("ru-RU")}
                  />
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div style={styles.statCard}>
      <p style={styles.muted}>{title}</p>
      <p style={styles.statValue}>{value}</p>
    </div>
  );
}

function Badge({ children }) {
  return <span style={styles.badge}>{children}</span>;
}

function Field({ label, children, error }) {
  return (
    <label style={{ display: "block" }}>
      <span style={styles.label}>{label}</span>
      {children}
      {error && <span style={styles.error}>{error}</span>}
    </label>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={styles.infoRow}>
      <span style={{ color: "#64748b" }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    color: "#0f172a",
    fontFamily: "Inter, Arial, sans-serif",
  },
  container: {
    maxWidth: 1280,
    margin: "0 auto",
    padding: 24,
  },
  header: {
    background: "#ffffff",
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    boxShadow: "0 2px 10px rgba(15, 23, 42, 0.06)",
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
  },
  kicker: {
    margin: "0 0 8px",
    fontSize: 12,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.2em",
    fontWeight: 700,
  },
  h1: {
    margin: 0,
    fontSize: 32,
    lineHeight: 1.2,
  },
  h2: {
    margin: 0,
    fontSize: 28,
  },
  h3: {
    marginTop: 0,
    fontSize: 20,
  },
  subtitle: {
    marginTop: 10,
    maxWidth: 760,
    color: "#475569",
    lineHeight: 1.6,
  },
  nav: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "flex-start",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    background: "#ffffff",
    borderRadius: 24,
    padding: 20,
    boxShadow: "0 2px 10px rgba(15, 23, 42, 0.06)",
  },
  statValue: {
    margin: "8px 0 0",
    fontSize: 32,
    fontWeight: 800,
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.25fr) minmax(280px, 0.75fr)",
    gap: 24,
  },
  card: {
    background: "#ffffff",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 2px 10px rgba(15, 23, 42, 0.06)",
  },
  innerCard: {
    border: "1px solid #e2e8f0",
    borderRadius: 24,
    padding: 20,
  },
  sectionHead: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  muted: {
    margin: 0,
    color: "#64748b",
    fontSize: 14,
  },
  filters: {
    display: "grid",
    gridTemplateColumns: "1fr 220px",
    gap: 12,
    marginBottom: 20,
  },
  input: {
    width: "100%",
    border: "1px solid #cbd5e1",
    borderRadius: 18,
    padding: "14px 16px",
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box",
    background: "#fff",
  },
  primaryBtn: {
    border: "none",
    background: "#0f172a",
    color: "#fff",
    borderRadius: 18,
    padding: "12px 16px",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
  },
  secondaryBtn: {
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#0f172a",
    borderRadius: 18,
    padding: "12px 16px",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 500,
  },
  taskCard: {
    border: "1px solid #e2e8f0",
    borderRadius: 20,
    padding: 16,
  },
  taskTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
  },
  titleRow: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  taskTitle: {
    margin: 0,
    fontSize: 20,
  },
  taskDescription: {
    margin: "0 0 12px",
    color: "#475569",
    lineHeight: 1.6,
  },
  metaRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    color: "#64748b",
    fontSize: 14,
  },
  actionRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  badge: {
    background: "#f1f5f9",
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#475569",
    fontWeight: 700,
  },
  label: {
    display: "block",
    marginBottom: 8,
    fontSize: 14,
    fontWeight: 600,
    color: "#334155",
  },
  error: {
    display: "block",
    marginTop: 8,
    color: "#ef4444",
    fontSize: 14,
  },
  infoList: {
    display: "grid",
    gap: 12,
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    background: "#f8fafc",
    padding: "12px 14px",
    borderRadius: 16,
    fontSize: 14,
  },
  empty: {
    border: "1px dashed #cbd5e1",
    borderRadius: 20,
    padding: 32,
    textAlign: "center",
    color: "#64748b",
  },
  sidebarText: {
    color: "#475569",
    lineHeight: 1.6,
    fontSize: 14,
    marginTop: 12,
    marginBottom: 16,
  },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20,
  },
};