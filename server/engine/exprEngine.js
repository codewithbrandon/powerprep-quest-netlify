// Minimal tokenizer + recursive-descent parser + evaluator shared by the
// DAX and Power Fx playground engines. It understands a *subset* of each
// language sufficient to simulate the curated challenges in this app:
// function calls, Table[Column] / bare-field / ThisRecord.Field references,
// record literals `{ A: 1, B: "x" }`, arithmetic, comparison and logical ops.

function tokenize(src) {
  const tokens = [];
  let i = 0;
  const n = src.length;
  const twoChar = ['<>', '>=', '<=', '&&', '||'];
  while (i < n) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === '"') {
      let j = i + 1;
      let str = '';
      while (j < n && src[j] !== '"') {
        if (src[j] === '\\' && src[j + 1] === '"') { str += '"'; j += 2; continue; }
        str += src[j];
        j++;
      }
      tokens.push({ type: 'STRING', value: str });
      i = j + 1;
      continue;
    }
    if (/[0-9]/.test(c)) {
      let j = i;
      let num = '';
      while (j < n && /[0-9.]/.test(src[j])) { num += src[j]; j++; }
      tokens.push({ type: 'NUMBER', value: parseFloat(num) });
      i = j;
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      let j = i;
      let id = '';
      while (j < n && /[A-Za-z0-9_]/.test(src[j])) { id += src[j]; j++; }
      tokens.push({ type: 'IDENT', value: id });
      i = j;
      continue;
    }
    const two = src.slice(i, i + 2);
    if (twoChar.includes(two)) {
      tokens.push({ type: 'OP', value: two });
      i += 2;
      continue;
    }
    if ('()[]{},:.+-*/=><!'.includes(c)) {
      tokens.push({ type: 'OP', value: c });
      i++;
      continue;
    }
    throw new Error(`Unexpected character '${c}' at position ${i}`);
  }
  tokens.push({ type: 'EOF', value: null });
  return tokens;
}

function parse(tokens) {
  let pos = 0;
  const peek = () => tokens[pos];
  const advance = () => tokens[pos++];
  const expectOp = (op) => {
    const t = advance();
    if (t.type !== 'OP' || t.value !== op) {
      throw new Error(`Expected '${op}' but found '${t.value}'`);
    }
  };
  const isWord = (t, word) => t.type === 'IDENT' && t.value.toLowerCase() === word;

  function parseExpr() { return parseOr(); }

  function parseOr() {
    let left = parseAnd();
    while ((peek().type === 'OP' && peek().value === '||') || isWord(peek(), 'or')) {
      advance();
      const right = parseAnd();
      left = { type: 'Bin', op: '||', left, right };
    }
    return left;
  }

  function parseAnd() {
    let left = parseNot();
    while ((peek().type === 'OP' && peek().value === '&&') || isWord(peek(), 'and')) {
      advance();
      const right = parseNot();
      left = { type: 'Bin', op: '&&', left, right };
    }
    return left;
  }

  function parseNot() {
    if ((peek().type === 'OP' && peek().value === '!') || isWord(peek(), 'not')) {
      advance();
      return { type: 'Not', value: parseComparison() };
    }
    return parseComparison();
  }

  function parseComparison() {
    let left = parseAdditive();
    const t = peek();
    const cmpOps = ['=', '<>', '>=', '<=', '>', '<'];
    if (t.type === 'OP' && cmpOps.includes(t.value)) {
      advance();
      const right = parseAdditive();
      left = { type: 'Bin', op: t.value, left, right };
    }
    return left;
  }

  function parseAdditive() {
    let left = parseTerm();
    while (peek().type === 'OP' && (peek().value === '+' || peek().value === '-')) {
      const op = advance().value;
      const right = parseTerm();
      left = { type: 'Bin', op, left, right };
    }
    return left;
  }

  function parseTerm() {
    let left = parseUnary();
    while (peek().type === 'OP' && (peek().value === '*' || peek().value === '/')) {
      const op = advance().value;
      const right = parseUnary();
      left = { type: 'Bin', op, left, right };
    }
    return left;
  }

  function parseUnary() {
    if (peek().type === 'OP' && peek().value === '-') {
      advance();
      return { type: 'Neg', value: parsePostfix() };
    }
    return parsePostfix();
  }

  function parsePostfix() {
    let node = parsePrimary();
    while (peek().type === 'OP' && peek().value === '.') {
      advance();
      const field = advance();
      if (field.type !== 'IDENT') throw new Error('Expected field name after .');
      node = { type: 'Field', obj: node, field: field.value };
    }
    return node;
  }

  function parseArgs() {
    const args = [];
    if (peek().type === 'OP' && peek().value === ')') return args;
    args.push(parseExpr());
    while (peek().type === 'OP' && peek().value === ',') {
      advance();
      args.push(parseExpr());
    }
    return args;
  }

  function parseRecordLiteral() {
    const pairs = [];
    if (peek().type === 'OP' && peek().value === '}') { advance(); return { type: 'Record', pairs }; }
    while (true) {
      const key = advance();
      if (key.type !== 'IDENT') throw new Error('Expected field name in record literal');
      expectOp(':');
      const value = parseExpr();
      pairs.push({ key: key.value, value });
      if (peek().type === 'OP' && peek().value === ',') { advance(); continue; }
      break;
    }
    expectOp('}');
    return { type: 'Record', pairs };
  }

  function parsePrimary() {
    const t = peek();
    if (t.type === 'NUMBER') { advance(); return { type: 'Num', value: t.value }; }
    if (t.type === 'STRING') { advance(); return { type: 'Str', value: t.value }; }
    if (t.type === 'OP' && t.value === '(') {
      advance();
      const e = parseExpr();
      expectOp(')');
      return e;
    }
    if (t.type === 'OP' && t.value === '{') {
      advance();
      return parseRecordLiteral();
    }
    if (t.type === 'IDENT') {
      const lower = t.value.toLowerCase();
      if (lower === 'true') { advance(); return { type: 'Bool', value: true }; }
      if (lower === 'false') { advance(); return { type: 'Bool', value: false }; }
      if (lower === 'blank') { advance(); return { type: 'Null' }; }
      advance();
      const name = t.value;
      // Table[Column] reference
      if (peek().type === 'OP' && peek().value === '[') {
        advance();
        const col = advance();
        if (col.type !== 'IDENT') throw new Error('Expected column name inside [ ]');
        expectOp(']');
        return { type: 'ColumnRef', table: name, col: col.value };
      }
      // Function call
      if (peek().type === 'OP' && peek().value === '(') {
        advance();
        const args = parseArgs();
        expectOp(')');
        return { type: 'Call', name, args };
      }
      return { type: 'Ident', name };
    }
    throw new Error(`Unexpected token '${t.value}'`);
  }

  const result = parseExpr();
  if (peek().type !== 'EOF') throw new Error(`Unexpected trailing input near '${peek().value}'`);
  return result;
}

function evaluate(node, env) {
  switch (node.type) {
    case 'Num': return node.value;
    case 'Str': return node.value;
    case 'Bool': return node.value;
    case 'Null': return null;
    case 'Neg': return -evaluate(node.value, env);
    case 'Not': return !evaluate(node.value, env);
    case 'Record': {
      const obj = {};
      for (const { key, value } of node.pairs) obj[key] = evaluate(value, env);
      return obj;
    }
    case 'ColumnRef': {
      if (env.row && node.col in env.row) return env.row[node.col];
      throw new Error(`${node.table}[${node.col}] used outside of a row context (wrap it in SUMX/FILTER or use SUM/AVERAGE)`);
    }
    case 'Field': {
      const obj = evaluate(node.obj, env);
      if (obj == null) return null;
      return obj[node.field];
    }
    case 'Ident': {
      if (node.name === 'ThisRecord') {
        if (!env.row) throw new Error('ThisRecord used outside of a row context');
        return env.row;
      }
      if (env.row && node.name in env.row) return env.row[node.name];
      if (env.tables && node.name in env.tables) return env.tables[node.name];
      if (env.vars && node.name in env.vars) return env.vars[node.name];
      throw new Error(`Unknown identifier '${node.name}'`);
    }
    case 'Bin': {
      if (node.op === '&&') return evaluate(node.left, env) && evaluate(node.right, env);
      if (node.op === '||') return evaluate(node.left, env) || evaluate(node.right, env);
      const l = evaluate(node.left, env);
      const r = evaluate(node.right, env);
      switch (node.op) {
        case '=': return l === r;
        case '<>': return l !== r;
        case '>': return l > r;
        case '<': return l < r;
        case '>=': return l >= r;
        case '<=': return l <= r;
        case '+': return l + r;
        case '-': return l - r;
        case '*': return l * r;
        case '/': return l / r;
        default: throw new Error(`Unsupported operator '${node.op}'`);
      }
    }
    case 'Call': {
      const fnName = node.name.toUpperCase();
      const fn = env.functions[fnName] || env.functions[node.name];
      if (!fn) throw new Error(`Unknown function '${node.name}'`);
      return fn(node.args, env);
    }
    default:
      throw new Error(`Cannot evaluate node type '${node.type}'`);
  }
}

function evalTable(node, env) {
  if (node.type === 'Ident' && env.tables && node.name in env.tables) {
    return env.tables[node.name];
  }
  const result = evaluate(node, env);
  if (!Array.isArray(result)) throw new Error('Expected a table expression here');
  return result;
}

function run(code, env) {
  const tokens = tokenize(code);
  const ast = parse(tokens);
  return evaluate(ast, env);
}

module.exports = { tokenize, parse, evaluate, evalTable, run };
