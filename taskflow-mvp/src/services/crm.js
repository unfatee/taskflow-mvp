export async function sendTaskToCrm(task) {
  const response = await fetch('/api/crm/create-deal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ task })
  });

  const data = await response.json().catch(() => ({
    ok: false,
    message: 'CRM API вернул некорректный JSON.'
  }));

  if (!response.ok || !data.ok) {
    const error = new Error(data.message || 'Не удалось отправить задачу в CRM.');
    error.payload = data;
    throw error;
  }

  return data;
}
