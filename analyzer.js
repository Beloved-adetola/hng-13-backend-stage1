const crypto = require("crypto");

function sha256(str) {
  return crypto.createHash("sha256").update(str, "utf8").digest("hex");
}

function isPalindrome(str) {
  if (typeof str !== "string") return false;
  const normalized = str.replace(/\s+/g, "").toLowerCase();
  return normalized === normalized.split("").reverse().join("");
}

function charFrequencyMap(str) {
  const map = {};
  for (const ch of str) {
    map[ch] = (map[ch] || 0) + 1;
  }
  return map;
}

function analyze(value) {
  if (typeof value !== "string") throw new TypeError("value must be a string");

  const length = value.length;
  const is_palindrome = isPalindrome(value);
  const unique_characters = new Set(value).size;
  const word_count = value.trim() === "" ? 0 : value.trim().split(/\s+/).length;
  const sha = sha256(value);
  const character_frequency_map = charFrequencyMap(value);

  return {
    length,
    is_palindrome,
    unique_characters,
    word_count,
    sha256_hash: sha,
    character_frequency_map,
  };
}

module.exports = { analyze, sha256 };
