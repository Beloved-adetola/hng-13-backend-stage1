function parseNaturalLanguage(query) {
  if (!query || typeof query !== "string") throw new Error("invalid query");

  const q = query.toLowerCase().trim();
  const filters = {};

  if (q.includes("single word")) filters.word_count = 1;
  if (q.includes("palindrom") || q.includes("palindromic"))
    filters.is_palindrome = true;

  const longerThanMatch = q.match(/longer than (\d+)/);
  if (longerThanMatch) {
    const num = parseInt(longerThanMatch[1], 10);
    filters.min_length = num + 1;
  }

  const shorterThanMatch = q.match(/shorter than (\d+)/);
  if (shorterThanMatch) {
    const num = parseInt(shorterThanMatch[1], 10);
    filters.max_length = num - 1;
  }

  const containsMatch = q.match(/contain(?:s|ing)?(?: the)? letter ([a-z0-9])/);
  if (containsMatch) {
    filters.contains_character = containsMatch[1];
  }

  if (q.includes("first vowel")) {
    filters.contains_character = filters.contains_character || "a";
  }

  // detect impossible/conflicting filters
  if (
    filters.min_length &&
    filters.max_length &&
    filters.min_length > filters.max_length
  ) {
    const err = new Error("conflicting filters");
    err.code = 422;
    throw err;
  }

  if (Object.keys(filters).length === 0) {
    throw new Error("Unable to parse natural language query to filters");
  }

  return { original: query, parsed_filters: filters };
}

module.exports = { parseNaturalLanguage };
