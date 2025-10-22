const express = require("express");
const bodyParser = require("body-parser");
const db = require("./db");
const analyzer = require("./analyzer");
const nlParser = require("./nlp-parser");

const app = express();
app.use(bodyParser.json());

db.init();

// POST /strings
app.post("/strings", (req, res) => {
  const { value } = req.body ?? {};
  if (value === undefined)
    return res.status(400).json({ error: 'missing "value" field' });
  if (typeof value !== "string")
    return res
      .status(422)
      .json({ error: 'Invalid data type for "value" must be a string' });

  const props = analyzer.analyze(value);
  const id = props.sha256_hash;

  // Check duplicate by id or by value
  const existing = db.getById(id) || db.getByValue(value);
  if (existing)
    return res
      .status(409)
      .json({ error: "String already exists in the system" });

  const created_at = new Date().toISOString();
  db.insertString(id, value, props, created_at);

  res.status(201).json({
    id,
    value,
    properties: props,
    created_at,
  });
});

// DELETE /strings/:value
app.delete("/strings/:value", (req, res) => {
  const value = req.params.value;
  const row = db.getByValue(value);
  if (!row) return res.status(404).json({ error: "Not Found" });
  db.deleteByValue(value);
  res.status(204).send();
});

// GET /strings with filtering
app.get("/strings", (req, res) => {
  const {
    is_palindrome,
    min_length,
    max_length,
    word_count,
    contains_character,
  } = req.query;
  // validation
  const filters = {};
  if (is_palindrome !== undefined) {
    if (is_palindrome !== "true" && is_palindrome !== "false")
      return res.status(400).json({
        error:
          "Invalid query parameter values or types. is_palindrome must be true/false",
      });
    filters.is_palindrome = is_palindrome === "true";
  }
  if (min_length !== undefined) {
    const n = parseInt(min_length, 10);
    if (Number.isNaN(n))
      return res.status(400).json({
        error:
          "Invalid query parameter values or types. min_length must be integer",
      });
    filters.min_length = n;
  }
  if (max_length !== undefined) {
    const n = parseInt(max_length, 10);
    if (Number.isNaN(n))
      return res.status(400).json({
        error:
          "Invalid query parameter values or types. max_length must be integer",
      });
    filters.max_length = n;
  }
  if (word_count !== undefined) {
    const n = parseInt(word_count, 10);
    if (Number.isNaN(n))
      return res.status(400).json({
        error:
          "Invalid query parameter values or types. word_count must be integer",
      });
    filters.word_count = n;
  }
  if (contains_character !== undefined) {
    if (
      typeof contains_character !== "string" ||
      contains_character.length !== 1
    )
      return res.status(400).json({
        error:
          "Invalid query parameter values or types. contains_character must be a single character",
      });
    filters.contains_character = contains_character;
  }

  let all = db.listAll();
  const filtered = all.filter((row) => {
    const p = row.properties;
    if (
      filters.is_palindrome !== undefined &&
      p.is_palindrome !== filters.is_palindrome
    )
      return false;
    if (filters.min_length !== undefined && p.length < filters.min_length)
      return false;
    if (filters.max_length !== undefined && p.length > filters.max_length)
      return false;
    if (filters.word_count !== undefined && p.word_count !== filters.word_count)
      return false;
    if (
      filters.contains_character !== undefined &&
      !Object.prototype.hasOwnProperty.call(
        p.character_frequency_map,
        filters.contains_character
      )
    )
      return false;
    return true;
  });

  res.json({
    data: filtered,
    count: filtered.length,
    filters_applied: filters,
  });
});

// GET /strings/filter-by-natural-language
app.get("/strings/filter-by-natural-language", (req, res) => {
  const query = req.query.query;
  if (!query) return res.status(400).json({ error: "missing query param" });

  try {
    const parsed = nlParser.parseNaturalLanguage(query);
    const filters = parsed.parsed_filters;
    let all = db.listAll();

    const filtered = all.filter((row) => {
      const p = row.properties;
      if (
        filters.is_palindrome !== undefined &&
        p.is_palindrome !== filters.is_palindrome
      )
        return false;
      if (filters.min_length !== undefined && p.length < filters.min_length)
        return false;
      if (filters.max_length !== undefined && p.length > filters.max_length)
        return false;
      if (
        filters.word_count !== undefined &&
        p.word_count !== filters.word_count
      )
        return false;
      if (
        filters.contains_character !== undefined &&
        !Object.prototype.hasOwnProperty.call(
          p.character_frequency_map,
          filters.contains_character
        )
      )
        return false;
      return true;
    });

    res.json({
      data: filtered,
      count: filtered.length,
      interpreted_query: parsed,
    });
  } catch (err) {
    if (err.code === 422)
      return res
        .status(422)
        .json({ error: "Query parsed but resulted in conflicting filters" });
    res.status(400).json({ error: "Unable to parse natural language query" });
  }
});

// GET /strings/:value
app.get("/strings/:value", (req, res) => {
  const value = req.params.value;
  const row = db.getByValue(value);
  if (!row) return res.status(404).json({ error: "Not Found" });
  res.json(row);
});

module.exports = app;
