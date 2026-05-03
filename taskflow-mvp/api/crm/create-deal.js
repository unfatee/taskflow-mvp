const json = (response, statusCode, payload) => {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.end(JSON.stringify(payload));
};

const readRequestBody = async (request) => {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(Buffer.from(chunk));
  }

  const body = Buffer.concat(chunks).toString('utf8');

  if (!body) {
    return {};
  }

  try {
    return JSON.parse(body);
  } catch (error) {
    const parseError = new Error('Некорректный JSON в теле запроса.');
    parseError.cause = error;
    throw parseError;
  }
};

const normalizeWebhookUrl = (url) => {
  if (!url) {
    return '';
  }

  const trimmed = url.trim().replace(/\/+$/, '');

  if (trimmed.endsWith('/crm.deal.add') || trimmed.endsWith('/crm.deal.add.json')) {
    return trimmed;
  }

  return `${trimmed}/crm.deal.add.json`;
};

const formatDate = (value) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toISOString().slice(0, 10);
};

const requireTaskFields = (task) => {
  const errors = [];

  if (!task || typeof task !== 'object') {
    errors.push('Объект task обязателен.');
    return errors;
  }

  if (!task.title || !String(task.title).trim()) {
    errors.push('Поле title обязательно.');
  }

  if (!task.deadline || !String(task.deadline).trim()) {
    errors.push('Поле deadline обязательно.');
  }

  if (!task.category || !String(task.category).trim()) {
    errors.push('Поле category обязательно.');
  }

  return errors;
};

const PRIORITY_ENUM_ID_BY_VALUE = {
  high: '44',
  medium: '46',
  low: '48'
};

const STATUS_ENUM_ID_BY_VALUE = {
  new: '50',
  in_progress: '52',
  done: '54'
};

const normalizePriority = (value) => {
  const normalized = String(value || 'medium').trim().toLowerCase();
  return PRIORITY_ENUM_ID_BY_VALUE[normalized] || PRIORITY_ENUM_ID_BY_VALUE.medium;
};

const normalizeStatus = (value) => {
  const normalized = String(value || 'new').trim().toLowerCase();
  return STATUS_ENUM_ID_BY_VALUE[normalized] || STATUS_ENUM_ID_BY_VALUE.new;
};

const buildDealPayload = (task) => {
  const title = String(task.title || 'Без названия').trim();
  const description = task.description || 'Описание не указано.';
  const deadline = formatDate(task.deadline);
  const priorityEnumId = normalizePriority(task.priority);
  const category = task.category || 'Без категории';
  const statusEnumId = normalizeStatus(task.status);
  const createdAt = formatDate(task.createdAt || new Date());
  const source = task.source || 'Web MVP / ПР-04';

  const comments = [
    `Описание задачи: ${description}`,
    `Дедлайн задачи: ${deadline || 'Не указан'}`,
    `Приоритет задачи: ${task.priority || 'medium'}`,
    `Категория задачи: ${category}`,
    `Статус задачи: ${task.status || 'new'}`,
    `ID задачи в веб-интерфейсе: ${task.id || 'Не указан'}`,
    `Дата создания в приложении: ${createdAt}`,
    `Источник заявки: ${source}`
  ].join('\n');

  return {
    fields: {
      TITLE: `TaskFlow: ${title}`,
      OPPORTUNITY: 0,
      CURRENCY_ID: 'RUB',
      COMMENTS: comments,
      ORIGINATOR_ID: 'taskflow-mvp-pr05',
      ORIGIN_ID: task.id || `task-${Date.now()}`,

      // Пользовательские поля сущности CRM_DEAL из портала Bitrix24.
      // Эти FIELD_NAME получены методом crm.deal.userfield.list.
      UF_CRM_1777804608701: description,
      UF_CRM_1777804782669: deadline,
      UF_CRM_1777804868815: priorityEnumId,
      UF_CRM_1777804887989: category,
      UF_CRM_1777804927342: statusEnumId,
      UF_CRM_1777804943652: createdAt,
      UF_CRM_1777804958149: source
    },
    params: {
      REGISTER_SONET_EVENT: 'Y'
    }
  };
};

const createMockDeal = (task) => ({
  result: Number(String(Date.now()).slice(-7)),
  mock: true,
  taskTitle: task.title,
  message: 'CRM_MOCK_MODE=true: тестовая сделка создана без обращения к Bitrix24.'
});

export default async function handler(request, response) {
  if (request.method === 'OPTIONS') {
    return json(response, 200, { ok: true });
  }

  if (request.method !== 'POST') {
    return json(response, 405, {
      ok: false,
      error: 'METHOD_NOT_ALLOWED',
      message: 'Endpoint поддерживает только POST-запросы.'
    });
  }

  try {
    const body = await readRequestBody(request);
    const task = body.task || body;
    const validationErrors = requireTaskFields(task);

    if (validationErrors.length > 0) {
      return json(response, 400, {
        ok: false,
        error: 'VALIDATION_ERROR',
        message: 'Не удалось отправить задачу в CRM из-за ошибок валидации.',
        details: validationErrors
      });
    }

    if (process.env.CRM_MOCK_MODE === 'true') {
      const mockDeal = createMockDeal(task);

      return json(response, 201, {
        ok: true,
        crm: 'bitrix24',
        entity: 'deal',
        dealId: mockDeal.result,
        mock: true,
        message: mockDeal.message,
        raw: mockDeal
      });
    }

    const webhookUrl = normalizeWebhookUrl(process.env.BITRIX24_WEBHOOK_URL);

    if (!webhookUrl) {
      return json(response, 500, {
        ok: false,
        error: 'BITRIX24_WEBHOOK_URL_MISSING',
        message: 'Не задана переменная окружения BITRIX24_WEBHOOK_URL.'
      });
    }

    const bitrixPayload = buildDealPayload(task);
    const bitrixResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bitrixPayload)
    });

    const bitrixText = await bitrixResponse.text();
    let bitrixData;

    try {
      bitrixData = JSON.parse(bitrixText);
    } catch {
      bitrixData = { raw: bitrixText };
    }

    if (!bitrixResponse.ok || bitrixData.error) {
      return json(response, 502, {
        ok: false,
        error: bitrixData.error || 'BITRIX24_REQUEST_FAILED',
        message: bitrixData.error_description || 'Bitrix24 вернул ошибку при создании сделки.',
        status: bitrixResponse.status,
        raw: bitrixData
      });
    }

    return json(response, 201, {
      ok: true,
      crm: 'bitrix24',
      entity: 'deal',
      dealId: bitrixData.result,
      mock: false,
      message: `Задача успешно отправлена в Bitrix24 CRM. ID сделки: ${bitrixData.result}`,
      raw: bitrixData
    });
  } catch (error) {
    return json(response, 500, {
      ok: false,
      error: 'CRM_INTEGRATION_ERROR',
      message: error.message || 'Неизвестная ошибка интеграции с CRM.'
    });
  }
}
