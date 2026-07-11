# poll-it.live — Coding Agent Skill

Create and manage real-time audience polls programmatically via the Wix Data REST API.

## Authentication

All write operations require a Wix API key. Pass it as a header:

```
Authorization: IST.{your-api-key}
```

Get your API key from the [Wix Dashboard](https://manage.wix.com/) → Settings → API Keys.

Your **site ID** is required in the URL path. Find it in your Wix project's `wix.config.json`.

## Base URL

```
https://www.wixapis.com/wix-data/v2/items
```

## Collections

| Collection | ID |
|---|---|
| Sessions | `PollSessions` |
| Questions | `PollQuestions` |
| Votes | `PollVotes` |

## Schemas

### PollSessions

| Field | Type | Description |
|---|---|---|
| `title` | string | Session display name |
| `code` | string | 6-letter uppercase join code (e.g. `BQCYUH`) |
| `status` | string | `draft`, `live`, or `ended` |
| `activeQuestionId` | string | ID of the currently active question |
| `activeIndex` | number | Index of the active question (0-based) |

### PollQuestions

| Field | Type | Description |
|---|---|---|
| `sessionId` | string | Parent session ID |
| `prompt` | string | The question text |
| `type` | string | `tf` (true/false), `mc` (multiple choice), or `scale` (1-5) |
| `options` | string | JSON-encoded array of option labels |
| `order` | number | Display order (0-based) |

### PollVotes

| Field | Type | Description |
|---|---|---|
| `sessionId` | string | Parent session ID |
| `questionId` | string | Parent question ID |
| `choice` | string | The selected option label (must match an entry in the question's options) |
| `voterId` | string | Unique voter identifier (any string, e.g. UUID) |

## Operations

### 1. Create a session

```bash
curl -X POST "https://www.wixapis.com/wix-data/v2/items" \
  -H "Authorization: IST.{api-key}" \
  -H "wix-site-id: {site-id}" \
  -H "Content-Type: application/json" \
  -d '{
    "dataCollectionId": "PollSessions",
    "dataItem": {
      "data": {
        "title": "Team Retro Q3",
        "code": "RET3QA",
        "status": "draft",
        "activeQuestionId": "",
        "activeIndex": 0
      }
    }
  }'
```

The response includes `dataItem.id` — use this as the `sessionId` for questions.

### 2. Add questions

```bash
curl -X POST "https://www.wixapis.com/wix-data/v2/items" \
  -H "Authorization: IST.{api-key}" \
  -H "wix-site-id: {site-id}" \
  -H "Content-Type: application/json" \
  -d '{
    "dataCollectionId": "PollQuestions",
    "dataItem": {
      "data": {
        "sessionId": "{session-id}",
        "prompt": "What went well this sprint?",
        "type": "mc",
        "options": "[\"Collaboration\",\"Delivery speed\",\"Code quality\",\"Communication\"]",
        "order": 0
      }
    }
  }'
```

**Option presets by type:**
- `tf` → `["True", "False"]`
- `mc` → any string array
- `scale` → `["1", "2", "3", "4", "5"]` (optionally add `"I don't know"`)

### 3. Go live

Update the session status and set the first active question:

```bash
curl -X PUT "https://www.wixapis.com/wix-data/v2/items/{session-item-id}" \
  -H "Authorization: IST.{api-key}" \
  -H "wix-site-id: {site-id}" \
  -H "Content-Type: application/json" \
  -d '{
    "dataCollectionId": "PollSessions",
    "dataItem": {
      "id": "{session-item-id}",
      "data": {
        "status": "live",
        "activeQuestionId": "{first-question-id}",
        "activeIndex": 0
      }
    }
  }'
```

### 4. Advance to next question

```bash
curl -X PUT "https://www.wixapis.com/wix-data/v2/items/{session-item-id}" \
  -H "Authorization: IST.{api-key}" \
  -H "wix-site-id: {site-id}" \
  -H "Content-Type: application/json" \
  -d '{
    "dataCollectionId": "PollSessions",
    "dataItem": {
      "id": "{session-item-id}",
      "data": {
        "activeQuestionId": "{next-question-id}",
        "activeIndex": 1
      }
    }
  }'
```

### 5. Cast a vote

```bash
curl -X POST "https://www.wixapis.com/wix-data/v2/items" \
  -H "Authorization: IST.{api-key}" \
  -H "wix-site-id: {site-id}" \
  -H "Content-Type: application/json" \
  -d '{
    "dataCollectionId": "PollVotes",
    "dataItem": {
      "data": {
        "sessionId": "{session-id}",
        "questionId": "{question-id}",
        "choice": "Collaboration",
        "voterId": "agent-001"
      }
    }
  }'
```

### 6. Read results

Query votes for a specific question:

```bash
curl -X POST "https://www.wixapis.com/wix-data/v2/items/query" \
  -H "Authorization: IST.{api-key}" \
  -H "wix-site-id: {site-id}" \
  -H "Content-Type: application/json" \
  -d '{
    "dataCollectionId": "PollVotes",
    "query": {
      "filter": {
        "sessionId": "{session-id}",
        "questionId": "{question-id}"
      }
    }
  }'
```

### 7. End session

```bash
curl -X PUT "https://www.wixapis.com/wix-data/v2/items/{session-item-id}" \
  -H "Authorization: IST.{api-key}" \
  -H "wix-site-id: {site-id}" \
  -H "Content-Type: application/json" \
  -d '{
    "dataCollectionId": "PollSessions",
    "dataItem": {
      "id": "{session-item-id}",
      "data": {
        "status": "ended"
      }
    }
  }'
```

## Full workflow example

```python
# Pseudocode for a coding agent

# 1. Create session
session = create_item("PollSessions", {
    "title": "Sprint Retro",
    "code": "SPR1NT",
    "status": "draft",
    "activeQuestionId": "",
    "activeIndex": 0
})

# 2. Add questions
q1 = create_item("PollQuestions", {
    "sessionId": session.id,
    "prompt": "How was the sprint?",
    "type": "scale",
    "options": '["1","2","3","4","5"]',
    "order": 0
})

q2 = create_item("PollQuestions", {
    "sessionId": session.id,
    "prompt": "Should we keep daily standups?",
    "type": "tf",
    "options": '["True","False"]',
    "order": 1
})

# 3. Go live with first question
update_item("PollSessions", session.id, {
    "status": "live",
    "activeQuestionId": q1.id,
    "activeIndex": 0
})

# Share link: https://poll-it.live/#/join/SPR1NT
# Present:   https://poll-it.live/#/present/SPR1NT

# 4. Advance to next question
update_item("PollSessions", session.id, {
    "activeQuestionId": q2.id,
    "activeIndex": 1
})

# 5. End session
update_item("PollSessions", session.id, {
    "status": "ended"
})

# 6. View results: https://poll-it.live/#/results/SPR1NT
```

## Join code rules

- 6 characters, uppercase
- Alphabet: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (no 0, O, 1, I to avoid confusion)
- Must be unique across active sessions

## URLs for sharing

| Purpose | URL |
|---|---|
| Voter join page | `https://poll-it.live/#/join/{CODE}` |
| Presenter view | `https://poll-it.live/#/present/{CODE}` |
| Results page | `https://poll-it.live/#/results/{CODE}` |

## Rate limits

Wix Data API allows ~200-500 requests/minute per collection. At 100+ concurrent voters polling every 3 seconds, the app optimizes by skipping redundant API calls when the active question hasn't changed.
