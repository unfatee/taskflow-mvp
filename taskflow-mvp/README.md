# TaskFlow CRM MVP - ПР-05

Проект является продолжением MVP из ПР-04: веб-интерфейс интеллектуального планировщика задач на React/Vite дополнен API-интеграцией с Bitrix24 CRM.

## Что реализовано

- Создание, просмотр, выполнение и удаление задач.
- Поиск по названию, описанию и категории.
- Фильтрация по статусу задачи.
- Хранение данных в `localStorage` для MVP-режима.
- API-интеграция с Bitrix24 CRM через serverless endpoint Vercel.
- Отправка задачи в CRM как **сделка** после создания задачи.
- Отображение статуса CRM-синхронизации в интерфейсе.

## Интеграция с Bitrix24

В проекте используется серверная функция:

```text
POST /api/crm/create-deal
```

Фронтенд отправляет данные задачи на этот endpoint, а серверная функция вызывает REST API Bitrix24 методом `crm.deal.add`.

### Поля Bitrix24

В код уже внесены реальные коды пользовательских полей сделки, полученные через `crm.deal.userfield.list`:

| Поле | Код |
|---|---|
| Описание задачи | `UF_CRM_1777804608701` |
| Дедлайн задачи | `UF_CRM_1777804782669` |
| Приоритет задачи | `UF_CRM_1777804868815` |
| Категория задачи | `UF_CRM_1777804887989` |
| Статус задачи | `UF_CRM_1777804927342` |
| Дата создания в приложении | `UF_CRM_1777804943652` |
| Источник заявки | `UF_CRM_1777804958149` |

Для списков используются ID значений Bitrix24:

- Приоритет: `High = 44`, `Medium = 46`, `Low = 48`.
- Статус: `new = 50`, `in_progress = 52`, `done = 54`.

### Переменные окружения Vercel

В Vercel Project Settings -> Environment Variables добавьте:

```text
BITRIX24_WEBHOOK_URL=https://your-domain.bitrix24.ru/rest/1/your_webhook_code/
CRM_MOCK_MODE=false
```

Webhook должен иметь право доступа **CRM**.

## Локальный запуск

```bash
npm install
npm run dev
```

Для проверки production-сборки:

```bash
npm run build
npm run preview
```

## Как работает поток данных

1. Пользователь создает задачу в форме веб-интерфейса.
2. Задача сохраняется в `localStorage`.
3. Фронтенд вызывает `sendTaskToCrm(task)`.
4. `sendTaskToCrm` отправляет POST-запрос на `/api/crm/create-deal`.
5. Serverless endpoint формирует payload для Bitrix24.
6. Bitrix24 создает сделку и возвращает ID.
7. В карточке задачи сохраняется `crmDealId` и статус синхронизации.

## Структура проекта

```text
api/crm/create-deal.js       - серверная интеграция с Bitrix24 API
src/services/crm.js          - клиентский сервис отправки задач в CRM
src/App.jsx                  - интерфейс MVP
src/main.jsx                 - точка входа React
src/styles.css               - стили интерфейса
.env.example                 - пример переменных окружения
```

## Автор

А.Г. Ефимов, КИ23-13Б.
