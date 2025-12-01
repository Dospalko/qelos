export function clearNulls(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return {};
  }

  const keys = Object.keys(obj);
  let hasNull = false;

  // Fast path: check for nulls without cloning. Two passes but single keys allocation.
  for (let i = 0; i < keys.length; i++) {
    if (obj[keys[i]] === null) {
      hasNull = true;
      break;
    }
  }

  if (!hasNull) {
    return obj;
  }

  const result = {};
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const val = obj[key];
    if (val !== null) {
      result[key] = val;
    }
  }
  return result;
}


