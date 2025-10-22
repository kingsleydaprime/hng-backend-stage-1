// server.js
const express = require("express");
const crypto = require("crypto");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(bodyParser.json());
app.use(cors());

class Storage {
  constructor() {
    this.strings = new Map();
  }

  computeProperties(value) {
    const lower = value.toLowerCase();
    const hash = crypto.createHash("sha256").update(value).digest("hex");
    const freq = new Map();
    for (const char of value) {
      freq.set(char, (freq.get(char) || 0) + 1);
    }
    const unique = freq.size;
    const wordCount = value.trim().split(/\s+/).length;
    const reversed = value.split("").reverse().join("").toLowerCase();
    const isPal = lower === reversed;

    return {
      length: value.length,
      is_palindrome: isPal,
      unique_characters: unique,
      word_count: wordCount,
      sha256_hash: hash,
      character_frequency_map: Object.fromEntries(freq),
    };
  }

  create(value) {
    const props = this.computeProperties(value);
    if (this.strings.has(props.sha256_hash)) {
      throw new Error("String already exists");
    }
    const stored = {
      id: props.sha256_hash,
      value,
      properties: props,
      created_at: new Date().toISOString(),
    };
    this.strings.set(props.sha256_hash, stored);
    return stored;
  }

  get(hash) {
    return this.strings.get(hash);
  }

  delete(hash) {
    return this.strings.delete(hash);
  }

  list(filters) {
    const results = [];
    for (const stored of this.strings.values()) {
      let match = true;
      if (
        filters.is_palindrome !== undefined &&
        stored.properties.is_palindrome !== filters.is_palindrome
      ) {
        match = false;
      }
      if (
        filters.min_length !== undefined &&
        stored.properties.length < filters.min_length
      ) {
        match = false;
      }
      if (
        filters.max_length !== undefined &&
        stored.properties.length > filters.max_length
      ) {
        match = false;
      }
      if (
        filters.word_count !== undefined &&
        stored.properties.word_count !== filters.word_count
      ) {
        match = false;
      }
      if (filters.contains_character !== undefined) {
        const hasChar = Object.keys(
          stored.properties.character_frequency_map,
        ).includes(filters.contains_character);
        if (!hasChar) match = false;
      }
      if (match) results.push(stored);
    }
    return { data: results, count: results.length, filters_applied: filters };
  }
}

const storage = new Storage();

app.post("/strings", (req, res) => {
  try {
    const { value } = req.body;
    if (typeof value !== "string" || value === "") {
      return res
        .status(422)
        .json({ error: 'Invalid data type for "value" (must be string)' });
    }
    const stored = storage.create(value);
    res.status(201).json(stored);
  } catch (err) {
    if (err.message.includes("exists")) {
      return res
        .status(409)
        .json({ error: "String already exists in the system" });
    }
    res
      .status(400)
      .json({ error: 'Invalid request body or missing "value" field' });
  }
});

app.get("/strings/:value", (req, res) => {
  const { value } = req.params;
  const props = storage.computeProperties(value);
  const stored = storage.get(props.sha256_hash);
  if (!stored) {
    return res
      .status(404)
      .json({ error: "String does not exist in the system" });
  }
  res.json(stored);
});

app.get("/strings", (req, res) => {
  const {
    is_palindrome,
    min_length,
    max_length,
    word_count,
    contains_character,
  } = req.query;

  if (contains_character && contains_character.length !== 1) {
    return res
      .status(400)
      .json({ error: "Invalid query parameter values or types" });
  }

  const filters = {};
  if (is_palindrome !== undefined)
    filters.is_palindrome = is_palindrome === "true";
  if (min_length) filters.min_length = parseInt(min_length, 10);
  if (max_length) filters.max_length = parseInt(max_length, 10);
  if (word_count) filters.word_count = parseInt(word_count, 10);
  if (contains_character) filters.contains_character = contains_character;

  const result = storage.list(filters);
  res.json(result);
});

function parseNaturalQuery(query) {
  const lowerQuery = query.toLowerCase();
  const filters = {};

  if (lowerQuery.includes("palindromic") || lowerQuery.includes("palindrome")) {
    filters.is_palindrome = true;
  }

  if (lowerQuery.includes("single word") || lowerQuery.includes("one word")) {
    filters.word_count = 1;
  }

  const lengthMatch = lowerQuery.match(/longer than (\d+)|more than (\d+)/);
  if (lengthMatch) {
    const num = parseInt(lengthMatch[1] || lengthMatch[2], 10);
    filters.min_length = num + 1;
  }

  const charMatch = lowerQuery.match(/letter ([a-z])/);
  if (charMatch) {
    filters.contains_character = charMatch[1];
  }

  if (lowerQuery.includes("vowel")) {
    filters.contains_character = "a";
  }

  if (lowerQuery.includes("z")) {
    filters.contains_character = "z";
  }

  if (Object.keys(filters).length === 0) return null;

  if (
    filters.min_length &&
    filters.max_length &&
    filters.min_length > filters.max_length
  ) {
    throw new Error("Conflicting filters");
  }

  return filters;
}

app.get("/strings/filter-by-natural-language", (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res
      .status(400)
      .json({ error: "Unable to parse natural language query" });
  }

  try {
    const parsed = parseNaturalQuery(query);
    if (!parsed) {
      return res
        .status(400)
        .json({ error: "Unable to parse natural language query" });
    }
    const result = storage.list(parsed);
    res.json({
      ...result,
      interpreted_query: {
        original: query,
        parsed_filters: parsed,
      },
    });
  } catch (err) {
    res
      .status(422)
      .json({ error: "Query parsed but resulted in conflicting filters" });
  }
});

app.delete("/strings/:value", (req, res) => {
  const { value } = req.params;
  const props = storage.computeProperties(value);
  if (!storage.delete(props.sha256_hash)) {
    return res
      .status(404)
      .json({ error: "String does not exist in the system" });
  }
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
