const { performance } = require('node:perf_hooks');

function clearNullsBaseline(obj) {
  if (typeof obj !== 'object' || obj instanceof Array) {
    return {};
  }
  return Object.keys(obj).reduce((newObj, key) => {
    const val = obj[key];
    if (val !== null) {
      newObj[key] = val;
    }
    return newObj;
  }, {});
}

function clearNullsOptimized(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return {};
  }

  const keys = Object.keys(obj);
  let hasNull = false;
  for (let i = 0; i < keys.length; i++) {
    if (obj[keys[i]] === null) {
      hasNull = true;
      break;
    }
  }
  if (!hasNull) return obj;

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

function makePayload(size, nullRatio = 0.3) {
  const obj = {};
  for (let i = 0; i < size; i++) {
    obj[`k${i}`] = Math.random() < nullRatio ? null : Math.random() < 0.5 ? i : `v${i}`;
  }
  return obj;
}

function bench(fn, label, iterations, payload) {
  // warmup
  for (let i = 0; i < 5; i++) fn(payload);
  const start = performance.now();
  for (let i = 0; i < iterations; i++) fn(payload);
  const end = performance.now();
  return { label, ms: end - start };
}

function run() {
  const iterations = 2_000;
  const payloadSize = 2_000;
  const payloadWithNulls = makePayload(payloadSize, 0.3);
  const payloadNoNulls = makePayload(payloadSize, 0);
  const runs = [];

  for (let i = 0; i < 5; i++) {
    runs.push(bench(clearNullsBaseline, 'baseline-null-heavy', iterations, payloadWithNulls));
    runs.push(bench(clearNullsOptimized, 'optimized-null-heavy', iterations, payloadWithNulls));
    runs.push(bench(clearNullsBaseline, 'baseline-no-null', iterations, payloadNoNulls));
    runs.push(bench(clearNullsOptimized, 'optimized-no-null', iterations, payloadNoNulls));
  }

  const avg = runs.reduce((acc, { label, ms }) => {
    if (!acc[label]) acc[label] = [];
    acc[label].push(ms);
    return acc;
  }, {});

  const summarize = (arr) => ({
    min: Math.min(...arr),
    max: Math.max(...arr),
    avg: arr.reduce((a, b) => a + b, 0) / arr.length,
  });

  console.log(`Iterations: ${iterations}, payload size: ${payloadSize}`);
  Object.entries(avg).forEach(([label, arr]) => {
    const stats = summarize(arr);
    console.log(`${label.padEnd(20)} min: ${stats.min.toFixed(2)} ms | max: ${stats.max.toFixed(2)} ms | avg: ${stats.avg.toFixed(2)} ms`);
  });
  const baseNull = summarize(avg['baseline-null-heavy']);
  const optNull = summarize(avg['optimized-null-heavy']);
  const baseNoNull = summarize(avg['baseline-no-null']);
  const optNoNull = summarize(avg['optimized-no-null']);
  console.log(`Speedup (null-heavy): ${(baseNull.avg / optNull.avg).toFixed(2)}x`);
  console.log(`Speedup (no-null): ${(baseNoNull.avg / optNoNull.avg).toFixed(2)}x`);
}

run();
