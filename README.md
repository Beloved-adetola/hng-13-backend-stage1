# String Analyzer Service


Full implementation for the Stage 1 task: a RESTful API that analyzes strings and stores their computed properties.


## Features / Endpoints


1. `POST /strings`
- Create & analyze a string.
- Request body: `{ "value": "string to analyze" }`
- Success: `201 Created`. Response body matches spec (id = sha256_hash).
- Errors: `409 Conflict` (already exists), `400 Bad Request` (missing), `422 Unprocessable Entity` (wrong type).


2. `GET /strings/{string_value}`
- Fetch a specific string by its exact value (URL-encoded).
- Success: `200 OK` with object.
- Error: `404 Not Found`.


3. `GET /strings` with filters
- Query params: `is_palindrome` (true/false), `min_length`, `max_length`, `word_count`, `contains_character` (single char).
- Success: `200 OK` with `{ data, count, filters_applied }`.
- Error: `400 Bad Request` for invalid query parameters.


4. `GET /strings/filter-by-natural-language?query=...`
- Very small rule-based NL parser for the example queries in the task.
- Success: `200 OK` with `{ data, count, interpreted_query }`.
- Error: `400 Bad Request` when unparseable, `422 Unprocessable Entity` when parsed but filters conflict.


5. `DELETE /strings/{string_value}`
- Delete a stored string by exact value.
- Success: `204 No Content`.
- Error: `404 Not Found`.


## Design notes


- **DB**: `better-sqlite3` used for a single-file DB (`data.db`).
- **Duplicate detection**: SHA-256 used as primary key. Duplicate strings return `409`.
- **Palindrome detection**: case-insensitive and ignores whitespace. Punctuation is NOT stripped by default (explicit decision).
- **Character frequency**: counts characters exactly as they appear (case-sensitive).
- **Natural language parser**: rule-based heuristics to satisfy the example queries. It will return `422` for contradictory filters (e.g., min_length > max_length) and `400` when it cannot parse.


## Setup & Run locally


1. Ensure Node 18+ installed.
2. Clone this repo.
3. `npm install`
4. `npm start`
5. Server will listen on `PORT` or `3000` by default.
