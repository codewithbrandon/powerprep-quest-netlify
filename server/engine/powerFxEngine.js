const { tokenize, parse, evaluate, evalTable } = require('./exprEngine');

const POWERFX_FUNCTIONS = {
  FILTER: (args, env) => {
    const table = evalTable(args[0], env);
    const cond = args[1];
    return table.filter((row) => evaluate(cond, { ...env, row }));
  },
  LOOKUP: (args, env) => {
    const table = evalTable(args[0], env);
    const cond = args[1];
    const row = table.find((r) => evaluate(cond, { ...env, row: r }));
    if (!row) return null;
    if (args[2]) return evaluate(args[2], { ...env, row });
    return row;
  },
  PATCH: (args, env) => {
    if (args[0].type !== 'Ident') throw new Error('Patch expects a data source as its first argument');
    const tableName = args[0].name;
    const table = env.tables[tableName];
    const base = evaluate(args[1], env);
    const updates = evaluate(args[2], env);
    const merged = { ...(base || {}), ...updates };
    if (base) {
      const idx = table.indexOf(base);
      if (idx >= 0) table[idx] = merged;
      else table.push(merged);
    } else {
      table.push(merged);
    }
    return merged;
  },
  COLLECT: (args, env) => {
    if (args[0].type !== 'Ident') throw new Error('Collect expects a data source as its first argument');
    const tableName = args[0].name;
    const record = evaluate(args[1], env);
    env.tables[tableName].push(record);
    return record;
  },
  UPDATEIF: (args, env) => {
    const table = evalTable(args[0], env);
    const cond = args[1];
    const updatesAst = args[2];
    let count = 0;
    table.forEach((row) => {
      if (evaluate(cond, { ...env, row })) {
        const updates = evaluate(updatesAst, { ...env, row });
        Object.assign(row, updates);
        count += 1;
      }
    });
    return count;
  },
  REMOVEIF: (args, env) => {
    const tableName = args[0].name;
    const table = env.tables[tableName];
    const cond = args[1];
    const remaining = table.filter((row) => !evaluate(cond, { ...env, row }));
    env.tables[tableName] = remaining;
    return remaining.length;
  },
  COUNTROWS: (args, env) => evalTable(args[0], env).length,
  COUNTIF: (args, env) => {
    const table = evalTable(args[0], env);
    const cond = args[1];
    return table.filter((row) => evaluate(cond, { ...env, row })).length;
  },
  SUM: (args, env) => {
    const table = evalTable(args[0], env);
    const exprAst = args[1];
    return table.reduce((s, row) => s + Number(evaluate(exprAst, { ...env, row }) || 0), 0);
  },
  SORT: (args, env) => {
    const table = [...evalTable(args[0], env)];
    const exprAst = args[1];
    table.sort((a, b) => evaluate(exprAst, { ...env, row: a }) > evaluate(exprAst, { ...env, row: b }) ? 1 : -1);
    return table;
  },
  IF: (args, env) => (evaluate(args[0], env) ? evaluate(args[1], env) : args[2] ? evaluate(args[2], env) : false),
  ISBLANK: (args, env) => {
    const v = evaluate(args[0], env);
    return v === null || v === undefined || v === '';
  },
  NOT: (args, env) => !evaluate(args[0], env),
};

function runPowerFx(code, mockTables) {
  try {
    const tokens = tokenize(code);
    const ast = parse(tokens);
    const tables = {};
    for (const [name, rows] of Object.entries(mockTables)) {
      tables[name] = JSON.parse(JSON.stringify(rows));
    }
    const env = { tables, row: null, vars: {}, functions: POWERFX_FUNCTIONS };
    const result = evaluate(ast, env);
    return { success: true, result, tables };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = { runPowerFx };
