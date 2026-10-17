
/* AlgoEngine — mini interpreters for a French pseudocode DSL and a Python subset.
   Both parsers compile to the same AST, executed by one tree-walking interpreter. */
(function (global) {
  "use strict";

  // ---------- Errors ----------
  class RTError extends Error {
    constructor(message, line) {
      super(message);
      this.line = line || null;
    }
  }
  class ReturnSignal {
    constructor(value) { this.value = value; }
  }
  class BreakSignal {}
  class ContinueSignal {}
  // A live object created from a "class" definition — attrs is its own instance dictionary,
  // so each instantiation is independent (no shared/class-level state, kept simple on purpose).
  class Instance {
    constructor(className) { this.className = className; this.attrs = new Map(); }
  }

  // ---------- Shared line tokenizer ----------
  // Turns one logical line's content into a flat token array (no NEWLINE).
  const NAME_RE = /[A-Za-zÀ-ÖØ-öø-ÿ_][A-Za-zÀ-ÖØ-öø-ÿ0-9_]*/y;
  const NUM_RE = /\d+(\.\d+)?/y;

  function tokenizeLine(text, lineNo) {
    const toks = [];
    let i = 0;
    const n = text.length;
    while (i < n) {
      const c = text[i];
      if (c === " " || c === "\t") { i++; continue; }
      if (c === "#") break; // comment to end of line
      if (c === '"' || c === "'") {
        const quote = c;
        let j = i + 1;
        let s = "";
        while (j < n && text[j] !== quote) {
          if (text[j] === "\\" && j + 1 < n) {
            const nx = text[j + 1];
            if (nx === "n") s += "\n";
            else if (nx === "t") s += "\t";
            else s += nx;
            j += 2;
          } else {
            s += text[j];
            j++;
          }
        }
        if (j >= n) throw new RTError("Chaîne de caractères non fermée (guillemet manquant).", lineNo);
        toks.push({ type: "STRING", value: s, line: lineNo });
        i = j + 1;
        continue;
      }
      if (/\d/.test(c)) {
        NUM_RE.lastIndex = i;
        const m = NUM_RE.exec(text);
        toks.push({ type: "NUMBER", value: parseFloat(m[0]), line: lineNo });
        i += m[0].length;
        continue;
      }
      NAME_RE.lastIndex = i;
      const mName = NAME_RE.exec(text);
      if (mName && mName.index === i) {
        toks.push({ type: "NAME", value: mName[0], line: lineNo });
        i += mName[0].length;
        continue;
      }
      // multi-char operators
      const two = text.substr(i, 2);
      if (["==", "!=", "<=", ">=", "+=", "-=", "*=", "/=", "//", "**"].includes(two)) {
        toks.push({ type: "OP", value: two, line: lineNo });
        i += 2;
        continue;
      }
      if ("+-*/%()=,<>:.[]{}".includes(c)) {
        toks.push({ type: "OP", value: c, line: lineNo });
        i += 1;
        continue;
      }
      throw new RTError(`Caractère inattendu : "${c}"`, lineNo);
    }
    return toks;
  }

  // ---------- Python-mode tokenizer (indentation-sensitive) ----------
  function pyTokenize(source) {
    const rawLines = source.replace(/\r\n/g, "\n").split("\n");
    const tokens = [];
    const indentStack = [0];
    for (let li = 0; li < rawLines.length; li++) {
      const lineNo = li + 1;
      const line = rawLines[li];
      const stripped = line.replace(/^[ \t]*/, "");
      if (stripped.trim() === "" || stripped.trim().startsWith("#")) continue; // blank/comment-only line
      const leading = line.match(/^[ \t]*/)[0];
      const indent = leading.replace(/\t/g, "    ").length;
      const lineToks = tokenizeLine(stripped, lineNo);
      if (lineToks.length === 0) continue;
      if (indent > indentStack[indentStack.length - 1]) {
        indentStack.push(indent);
        tokens.push({ type: "INDENT", line: lineNo });
      } else {
        while (indent < indentStack[indentStack.length - 1]) {
          indentStack.pop();
          tokens.push({ type: "DEDENT", line: lineNo });
        }
        if (indent !== indentStack[indentStack.length - 1]) {
          throw new RTError(`Indentation incohérente à la ligne ${lineNo}.`, lineNo);
        }
      }
      tokens.push(...lineToks);
      tokens.push({ type: "NEWLINE", line: lineNo });
    }
    while (indentStack.length > 1) {
      indentStack.pop();
      tokens.push({ type: "DEDENT", line: rawLines.length });
    }
    tokens.push({ type: "EOF", line: rawLines.length });
    return tokens;
  }

  // ---------- Pseudo-mode tokenizer (flat, keyword-merging) ----------
  function pseudoTokenize(source) {
    const rawLines = source.replace(/\r\n/g, "\n").split("\n");
    let tokens = [];
    for (let li = 0; li < rawLines.length; li++) {
      const lineNo = li + 1;
      const line = rawLines[li];
      const lineToks = tokenizeLine(line, lineNo);
      if (lineToks.length === 0) continue;
      tokens.push(...lineToks, { type: "NEWLINE", line: lineNo });
    }
    // merge multi-word keywords (case-sensitive, expects UPPERCASE keywords)
    const isName = (t, v) => t && t.type === "NAME" && t.value === v;
    const merged = [];
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      const t2 = tokens[i + 1];
      if (isName(t, "TANT") && isName(t2, "QUE")) {
        merged.push({ type: "NAME", value: "TANTQUE", line: t.line });
        i++;
        continue;
      }
      if (isName(t, "SINON") && isName(t2, "SI")) {
        merged.push({ type: "NAME", value: "SINONSI", line: t.line });
        i++;
        continue;
      }
      merged.push(t);
    }
    tokens = merged;
    const merged2 = [];
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      const t2 = tokens[i + 1];
      if (isName(t, "FIN") && t2 && t2.type === "NAME" && ["SI", "POUR", "TANTQUE", "FONCTION"].includes(t2.value)) {
        merged2.push({ type: "NAME", value: "FIN" + t2.value, line: t.line });
        i++;
        continue;
      }
      merged2.push(t);
    }
    tokens = merged2;
    tokens.push({ type: "EOF", line: rawLines.length });
    return tokens;
  }

  // ---------- Base parser helpers (expression grammar shared) ----------
  class ParserBase {
    constructor(tokens) {
      this.toks = tokens;
      this.pos = 0;
    }
    peek(o = 0) { return this.toks[this.pos + o]; }
    at(type, value) {
      const t = this.peek();
      if (!t) return false;
      if (t.type !== type) return false;
      if (value !== undefined && t.value !== value) return false;
      return true;
    }
    atOp(v) { return this.at("OP", v); }
    atName(v) { return this.at("NAME", v); }
    advance() { return this.toks[this.pos++]; }
    expect(type, value, msg) {
      if (!this.at(type, value)) {
        const t = this.peek();
        throw new RTError(msg || `Erreur de syntaxe près de "${t ? (t.value ?? t.type) : "fin du code"}"`, t ? t.line : null);
      }
      return this.advance();
    }
    skipNewlines() { while (this.at("NEWLINE")) this.advance(); }

    // ---- expressions (precedence climbing) ----
    parseExpr() { return this.parseOr(); }
    parseOr() {
      let left = this.parseAnd();
      while (this.atName("or") || this.atName("OU")) {
        this.advance();
        const right = this.parseAnd();
        left = { type: "BoolOp", op: "or", left, right };
      }
      return left;
    }
    parseAnd() {
      let left = this.parseNot();
      while (this.atName("and") || this.atName("ET")) {
        this.advance();
        const right = this.parseNot();
        left = { type: "BoolOp", op: "and", left, right };
      }
      return left;
    }
    parseNot() {
      if (this.atName("not") || this.atName("NON")) {
        const t = this.advance();
        const operand = this.parseNot();
        return { type: "UnaryOp", op: "not", operand, line: t.line };
      }
      return this.parseCompare();
    }
    parseCompare() {
      let left = this.parseAdd();
      const ops = ["==", "!=", "<", ">", "<=", ">="];
      while (true) {
        if (this.peek() && this.peek().type === "OP" && ops.includes(this.peek().value)) {
          const op = this.advance().value;
          const right = this.parseAdd();
          left = { type: "Compare", op, left, right };
          continue;
        }
        if (this.atName("in") || this.atName("DANS")) {
          this.advance();
          const right = this.parseAdd();
          left = { type: "Compare", op: "in", left, right };
          continue;
        }
        if ((this.atName("not") || this.atName("NON")) && this.peek(1) && this.peek(1).type === "NAME" && (this.peek(1).value === "in" || this.peek(1).value === "DANS")) {
          this.advance(); this.advance();
          const right = this.parseAdd();
          left = { type: "Compare", op: "not in", left, right };
          continue;
        }
        break;
      }
      return left;
    }
    parseAdd() {
      let left = this.parseMul();
      while (this.atOp("+") || this.atOp("-")) {
        const op = this.advance().value;
        const right = this.parseMul();
        left = { type: "BinOp", op, left, right };
      }
      return left;
    }
    parseMul() {
      let left = this.parseUnary();
      while (this.atOp("*") || this.atOp("/") || this.atOp("//") || this.atOp("%")) {
        const op = this.advance().value;
        const right = this.parseUnary();
        left = { type: "BinOp", op, left, right };
      }
      return left;
    }
    parseUnary() {
      if (this.atOp("-")) {
        const t = this.advance();
        const operand = this.parseUnary();
        return { type: "UnaryOp", op: "-", operand, line: t.line };
      }
      return this.parsePow();
    }
    parsePow() {
      let left = this.parsePostfix();
      if (this.atOp("**")) {
        this.advance();
        const right = this.parseUnary(); // right-assoc
        left = { type: "BinOp", op: "**", left, right };
      }
      return left;
    }
    parsePostfix() {
      const node = this.parseAtom();
      return this.parsePostfixFrom(node);
    }
    // applies [index]/[a:b] and .method(args) postfix chains to an already-built node
    parsePostfixFrom(startNode) {
      let node = startNode;
      while (true) {
        if (this.atOp("[")) {
          const t = this.advance();
          let start = null, stop = null, isSlice = false;
          if (!this.atOp(":")) start = this.parseExpr();
          if (this.atOp(":")) {
            isSlice = true;
            this.advance();
            if (!this.atOp("]")) stop = this.parseExpr();
          }
          this.expect("OP", "]", "\"]\" attendu pour fermer l'indexation.");
          node = isSlice
            ? { type: "Slice", obj: node, start, stop, line: t.line }
            : { type: "Index", obj: node, index: start, line: t.line };
          continue;
        }
        if (this.atOp(".")) {
          this.advance();
          const nameTok = this.expect("NAME", undefined, "Nom attendu après \".\".");
          if (this.atOp("(")) {
            this.advance();
            const args = [];
            if (!this.atOp(")")) {
              args.push(this.parseExpr());
              while (this.atOp(",")) { this.advance(); args.push(this.parseExpr()); }
            }
            this.expect("OP", ")", "\")\" attendu après les arguments de la méthode.");
            node = { type: "MethodCall", obj: node, method: nameTok.value, args, line: nameTok.line };
          } else {
            node = { type: "Attr", obj: node, name: nameTok.value, line: nameTok.line };
          }
          continue;
        }
        break;
      }
      return node;
    }
    parseAtom() {
      const t = this.peek();
      if (!t) throw new RTError("Le code s'arrête de façon inattendue.", null);
      if (t.type === "NUMBER") { this.advance(); return { type: "Num", value: t.value, line: t.line }; }
      if (t.type === "STRING") { this.advance(); return { type: "Str", value: t.value, line: t.line }; }
      if (this.atOp("(")) {
        this.advance();
        const e = this.parseExpr();
        this.expect("OP", ")", "Parenthèse fermante \")\" attendue.");
        return e;
      }
      if (this.atOp("[")) {
        this.advance();
        if (this.atOp("]")) { this.advance(); return { type: "ListLit", items: [], line: t.line }; }
        const first = this.parseExpr();
        if (this.atName("for")) {
          this.advance();
          const varTok = this.expect("NAME", undefined, "Nom de variable attendu après \"for\".");
          this.expect("NAME", "in", "\"in\" attendu dans la compréhension de liste.");
          const iter = this.parseExpr();
          let cond = null;
          if (this.atName("if")) { this.advance(); cond = this.parseExpr(); }
          this.expect("OP", "]", "\"]\" attendu pour fermer la compréhension de liste.");
          return { type: "ListComp", expr: first, varName: varTok.value, iter, cond, line: t.line };
        }
        const items = [first];
        while (this.atOp(",")) { this.advance(); items.push(this.parseExpr()); }
        this.expect("OP", "]", "\"]\" attendu pour fermer la liste.");
        return { type: "ListLit", items, line: t.line };
      }
      if (this.atOp("{")) {
        this.advance();
        if (this.atOp("}")) { this.advance(); return { type: "DictLit", pairs: [], line: t.line }; }
        const k = this.parseExpr();
        this.expect("OP", ":", "\":\" attendu entre la clé et la valeur du dictionnaire.");
        const v = this.parseExpr();
        if (this.atName("for")) {
          this.advance();
          const varTok = this.expect("NAME", undefined, "Nom de variable attendu après \"for\".");
          this.expect("NAME", "in", "\"in\" attendu dans la compréhension de dictionnaire.");
          const iter = this.parseExpr();
          let cond = null;
          if (this.atName("if")) { this.advance(); cond = this.parseExpr(); }
          this.expect("OP", "}", "\"}\" attendu pour fermer la compréhension de dictionnaire.");
          return { type: "DictComp", keyExpr: k, valExpr: v, varName: varTok.value, iter, cond, line: t.line };
        }
        const pairs = [[k, v]];
        while (this.atOp(",")) {
          this.advance();
          const k2 = this.parseExpr();
          this.expect("OP", ":", "\":\" attendu entre la clé et la valeur du dictionnaire.");
          const v2 = this.parseExpr();
          pairs.push([k2, v2]);
        }
        this.expect("OP", "}", "\"}\" attendu pour fermer le dictionnaire.");
        return { type: "DictLit", pairs, line: t.line };
      }
      if (t.type === "NAME") {
        if (t.value === "True" || t.value === "VRAI") { this.advance(); return { type: "Bool", value: true, line: t.line }; }
        if (t.value === "False" || t.value === "FAUX") { this.advance(); return { type: "Bool", value: false, line: t.line }; }
        if (t.value === "None" || t.value === "RIEN") { this.advance(); return { type: "NoneLit", line: t.line }; }
        this.advance();
        let node = { type: "Name", name: t.value, line: t.line };
        if (this.atOp("(")) {
          this.advance();
          const args = [];
          if (!this.atOp(")")) {
            args.push(this.parseExpr());
            while (this.atOp(",")) { this.advance(); args.push(this.parseExpr()); }
          }
          this.expect("OP", ")", "Parenthèse fermante \")\" attendue après les arguments.");
          node = { type: "Call", callee: t.value, args, line: t.line };
        }
        return node;
      }
      throw new RTError(`Erreur de syntaxe près de "${t.value ?? t.type}"`, t.line);
    }
  }

  // ---------- Python parser ----------
  class PyParser extends ParserBase {
    parseProgram() {
      this.skipNewlines();
      const body = this.parseStmtList();
      return { type: "Program", body };
    }
    parseStmtList() {
      const stmts = [];
      this.skipNewlines();
      while (!this.at("EOF") && !this.at("DEDENT")) {
        stmts.push(this.parseStatement());
        this.skipNewlines();
      }
      return stmts;
    }
    parseBlock() {
      this.expect("NEWLINE", undefined, "Un retour à la ligne était attendu après \":\".");
      this.skipNewlines();
      this.expect("INDENT", undefined, "Le bloc doit être indenté après \":\".");
      const body = this.parseStmtList();
      this.expect("DEDENT", undefined, "Fin de bloc attendue (vérifie l'indentation).");
      return body;
    }
    parseStatement() {
      const t = this.peek();
      if (t.type === "NAME" && t.value === "if") return this.parseIf();
      if (t.type === "NAME" && t.value === "while") return this.parseWhile();
      if (t.type === "NAME" && t.value === "for") return this.parseFor();
      if (t.type === "NAME" && t.value === "def") return this.parseDef();
      if (t.type === "NAME" && t.value === "class") return this.parseClass();
      if (t.type === "NAME" && t.value === "break") {
        this.advance();
        this.expect("NEWLINE", undefined, "Retour à la ligne attendu après \"break\".");
        return { type: "Break", line: t.line };
      }
      if (t.type === "NAME" && t.value === "continue") {
        this.advance();
        this.expect("NEWLINE", undefined, "Retour à la ligne attendu après \"continue\".");
        return { type: "Continue", line: t.line };
      }
      if (t.type === "NAME" && t.value === "return") {
        this.advance();
        let value = null;
        if (!this.at("NEWLINE")) value = this.parseExpr();
        this.expect("NEWLINE", undefined, "Retour à la ligne attendu après \"return ...\".");
        return { type: "Return", value, line: t.line };
      }
      if (t.type === "NAME" && t.value === "try") return this.parseTry();
      // assignment or expression statement
      if (t.type === "NAME" && this.peek(1) && this.peek(1).type === "OP" &&
          ["=", "+=", "-=", "*=", "/="].includes(this.peek(1).value)) {
        const name = this.advance().value;
        const opTok = this.advance();
        const value = this.parseExpr();
        this.expect("NEWLINE", undefined, "Retour à la ligne attendu après l'affectation.");
        return { type: "Assign", name, value, op: opTok.value, line: t.line };
      }
      // indexed/attribute assignment: NAME[...] = expr or NAME.attr = expr (either can start the chain)
      if (t.type === "NAME" && this.peek(1) && this.peek(1).type === "OP" &&
          (this.peek(1).value === "[" || this.peek(1).value === ".")) {
        const savePos = this.pos;
        const nameTok = this.advance();
        const target = this.parsePostfixFrom({ type: "Name", name: nameTok.value, line: nameTok.line });
        if ((target.type === "Index" || target.type === "Attr") && this.peek() && this.peek().type === "OP" &&
            ["=", "+=", "-=", "*=", "/="].includes(this.peek().value)) {
          const opTok = this.advance();
          const value = this.parseExpr();
          this.expect("NEWLINE", undefined, "Retour à la ligne attendu après l'affectation.");
          if (target.type === "Index") return { type: "IndexAssign", target, value, op: opTok.value, line: t.line };
          return { type: "AttrAssign", target, value, op: opTok.value, line: t.line };
        }
        this.pos = savePos; // not an assignment after all — reparse as a normal expression below
      }
      const expr = this.parseExpr();
      this.expect("NEWLINE", undefined, "Retour à la ligne attendu.");
      if (expr.type === "Call" && expr.callee === "print") {
        return { type: "Print", args: expr.args, line: expr.line };
      }
      return { type: "ExprStmt", expr, line: expr.line };
    }
    parseClass() {
      const t = this.advance(); // 'class'
      const nameTok = this.expect("NAME", undefined, "Nom de classe attendu après class.");
      this.expect("OP", ":", "\":\" attendu après le nom de la classe.");
      const body = this.parseBlock();
      const methods = body.filter((s) => s.type === "FuncDef");
      if (methods.length !== body.length) {
        throw new RTError("Le corps d'une classe ne peut contenir que des méthodes (def ...).", t.line);
      }
      return { type: "ClassDef", name: nameTok.value, methods, line: t.line };
    }
    parseTry() {
      const t = this.advance(); // 'try'
      this.expect("OP", ":", "\":\" attendu après try.");
      const body = this.parseBlock();
      this.expect("NAME", "except", "\"except\" attendu après le bloc try (essaie try: ... except: ...).");
      let errVarName = null;
      if (!this.atOp(":")) {
        if (this.at("NAME")) this.advance(); // optional (ignored) exception type name
        if (this.at("NAME", "as")) {
          this.advance();
          errVarName = this.expect("NAME", undefined, "Nom de variable attendu après \"as\".").value;
        }
      }
      this.expect("OP", ":", "\":\" attendu après except.");
      const exceptBody = this.parseBlock();
      return { type: "Try", body, exceptBody, errVarName, line: t.line };
    }
    parseIf() {
      const t = this.advance(); // 'if'
      const cond = this.parseExpr();
      this.expect("OP", ":", "\":\" attendu après la condition du if.");
      const body = this.parseBlock();
      const branches = [{ cond, body }];
      let elseBody = null;
      while (this.at("NAME", "elif")) {
        this.advance();
        const c2 = this.parseExpr();
        this.expect("OP", ":", "\":\" attendu après elif.");
        const b2 = this.parseBlock();
        branches.push({ cond: c2, body: b2 });
      }
      if (this.at("NAME", "else")) {
        this.advance();
        this.expect("OP", ":", "\":\" attendu après else.");
        elseBody = this.parseBlock();
      }
      return { type: "If", branches, elseBody, line: t.line };
    }
    parseWhile() {
      const t = this.advance();
      const cond = this.parseExpr();
      this.expect("OP", ":", "\":\" attendu après la condition du while.");
      const body = this.parseBlock();
      return { type: "While", cond, body, line: t.line };
    }
    parseFor() {
      const t = this.advance(); // 'for'
      const nameTok = this.expect("NAME", undefined, "Nom de variable attendu après for.");
      if (!(this.at("NAME", "in"))) throw new RTError("\"in\" attendu dans la boucle for.", t.line);
      this.advance();
      if (this.at("NAME", "range")) {
        this.advance();
        this.expect("OP", "(", "\"(\" attendu après range.");
        const args = [];
        if (!this.atOp(")")) {
          args.push(this.parseExpr());
          while (this.atOp(",")) { this.advance(); args.push(this.parseExpr()); }
        }
        this.expect("OP", ")", "\")\" attendu pour fermer range(...).");
        this.expect("OP", ":", "\":\" attendu après range(...).");
        const body = this.parseBlock();
        let start, stop, step;
        if (args.length === 1) { start = { type: "Num", value: 0 }; stop = args[0]; step = { type: "Num", value: 1 }; }
        else if (args.length === 2) { start = args[0]; stop = args[1]; step = { type: "Num", value: 1 }; }
        else if (args.length === 3) { start = args[0]; stop = args[1]; step = args[2]; }
        else throw new RTError("range() accepte 1 à 3 arguments.", t.line);
        return { type: "ForRange", varName: nameTok.value, start, stop, step, body, line: t.line };
      }
      // generic: for x in <liste | texte | dictionnaire>:
      const iter = this.parseExpr();
      this.expect("OP", ":", "\":\" attendu après l'expression itérée.");
      const body = this.parseBlock();
      return { type: "ForEach", varName: nameTok.value, iter, body, line: t.line };
    }
    parseDef() {
      const t = this.advance(); // 'def'
      const nameTok = this.expect("NAME", undefined, "Nom de fonction attendu après def.");
      this.expect("OP", "(", "\"(\" attendu après le nom de la fonction.");
      const params = [];
      let varargName = null;
      const parseOneParam = () => {
        if (this.atOp("*")) {
          this.advance();
          varargName = this.expect("NAME", undefined, "Nom de paramètre attendu après \"*\".").value;
          return;
        }
        params.push(this.expect("NAME", undefined, "Nom de paramètre attendu.").value);
      };
      if (!this.atOp(")")) {
        parseOneParam();
        while (this.atOp(",")) { this.advance(); parseOneParam(); }
      }
      this.expect("OP", ")", "\")\" attendu après les paramètres.");
      this.expect("OP", ":", "\":\" attendu après def ...().");
      const body = this.parseBlock();
      return { type: "FuncDef", name: nameTok.value, params, varargName, body, line: t.line };
    }
  }

  // ---------- Pseudocode parser ----------
  class PseudoParser extends ParserBase {
    parseProgram() {
      this.skipNewlines();
      const body = [];
      while (!this.at("EOF")) {
        body.push(this.parseStatement());
        this.skipNewlines();
      }
      return { type: "Program", body };
    }
    parseStmtsUntil(...enders) {
      const stmts = [];
      this.skipNewlines();
      while (!this.at("EOF") && !enders.some((e) => this.atName(e))) {
        stmts.push(this.parseStatement());
        this.skipNewlines();
      }
      return stmts;
    }
    parseStatement() {
      const t = this.peek();
      if (t.type === "NAME" && t.value === "SI") return this.parseIf();
      if (t.type === "NAME" && t.value === "TANTQUE") return this.parseWhile();
      if (t.type === "NAME" && t.value === "POUR") return this.parseFor();
      if (t.type === "NAME" && t.value === "FONCTION") return this.parseDef();
      if (t.type === "NAME" && t.value === "RETOURNER") {
        this.advance();
        let value = null;
        if (!this.at("NEWLINE") && !this.at("EOF")) value = this.parseExpr();
        this.skipNewlines();
        return { type: "Return", value, line: t.line };
      }
      if (t.type === "NAME" && t.value === "VARIABLE") this.advance(); // optional declarative prefix
      const nt = this.peek();
      if (nt.type === "NAME" && this.peek(1) && this.peek(1).type === "OP" &&
          ["=", "+=", "-=", "*=", "/="].includes(this.peek(1).value)) {
        const name = this.advance().value;
        const opTok = this.advance();
        const value = this.parseExpr();
        this.skipNewlines();
        return { type: "Assign", name, value, op: opTok.value, line: nt.line };
      }
      const expr = this.parseExpr();
      this.skipNewlines();
      if (expr.type === "Call" && expr.callee === "AFFICHER") {
        return { type: "Print", args: expr.args, line: expr.line };
      }
      return { type: "ExprStmt", expr, line: expr.line };
    }
    parseIf() {
      const t = this.advance(); // SI
      const cond = this.parseExpr();
      this.expect("NAME", "ALORS", "\"ALORS\" attendu après la condition du SI.");
      const body = this.parseStmtsUntil("SINONSI", "SINON", "FINSI");
      const branches = [{ cond, body }];
      let elseBody = null;
      while (this.atName("SINONSI")) {
        this.advance();
        const c2 = this.parseExpr();
        this.expect("NAME", "ALORS", "\"ALORS\" attendu après SINON SI.");
        const b2 = this.parseStmtsUntil("SINONSI", "SINON", "FINSI");
        branches.push({ cond: c2, body: b2 });
      }
      if (this.atName("SINON")) {
        this.advance();
        elseBody = this.parseStmtsUntil("FINSI");
      }
      this.expect("NAME", "FINSI", "\"FIN SI\" attendu pour fermer le SI.");
      return { type: "If", branches, elseBody, line: t.line };
    }
    parseWhile() {
      const t = this.advance(); // TANTQUE
      const cond = this.parseExpr();
      const body = this.parseStmtsUntil("FINTANTQUE");
      this.expect("NAME", "FINTANTQUE", "\"FIN TANT QUE\" attendu.");
      return { type: "While", cond, body, line: t.line };
    }
    parseFor() {
      const t = this.advance(); // POUR
      const nameTok = this.expect("NAME", undefined, "Nom de variable attendu après POUR.");
      this.expect("NAME", "DE", "\"DE\" attendu (ex : POUR i DE 1 A 5).");
      const start = this.parseExpr();
      this.expect("NAME", "A", "\"A\" attendu (ex : POUR i DE 1 A 5).");
      const stop = this.parseExpr();
      let step = { type: "Num", value: 1 };
      if (this.atName("PAS")) { this.advance(); step = this.parseExpr(); }
      const body = this.parseStmtsUntil("FINPOUR");
      this.expect("NAME", "FINPOUR", "\"FIN POUR\" attendu.");
      // POUR i DE a A b is inclusive of b -> convert to exclusive stop for engine
      const stopExclusive = { type: "BinOp", op: "+", left: stop, right: { type: "Num", value: 1 } };
      const stepIsNeg = step.type === "Num" ? step.value < 0 : null;
      return { type: "ForRange", varName: nameTok.value, start, stop: stopExclusive, step, inclusive: true, line: t.line };
      // Note: body attached below via return replaced — see wrapper
    }
    parseDef() {
      const t = this.advance(); // FONCTION
      const nameTok = this.expect("NAME", undefined, "Nom de fonction attendu après FONCTION.");
      this.expect("OP", "(", "\"(\" attendu après le nom de la fonction.");
      const params = [];
      if (!this.atOp(")")) {
        params.push(this.expect("NAME", undefined, "Nom de paramètre attendu.").value);
        while (this.atOp(",")) { this.advance(); params.push(this.expect("NAME", undefined, "Nom de paramètre attendu.").value); }
      }
      this.expect("OP", ")", "\")\" attendu après les paramètres.");
      const body = this.parseStmtsUntil("FINFONCTION");
      this.expect("NAME", "FINFONCTION", "\"FIN FONCTION\" attendu.");
      return { type: "FuncDef", name: nameTok.value, params, body, line: t.line };
    }
  }
  // fix parseFor to actually attach body (rewritten cleanly)
  PseudoParser.prototype.parseFor = function () {
    const t = this.advance(); // POUR
    const nameTok = this.expect("NAME", undefined, "Nom de variable attendu après POUR.");
    this.expect("NAME", "DE", "\"DE\" attendu (ex : POUR i DE 1 A 5).");
    const start = this.parseExpr();
    this.expect("NAME", "A", "\"A\" attendu (ex : POUR i DE 1 A 5).");
    const stopIncl = this.parseExpr();
    let step = { type: "Num", value: 1 };
    if (this.atName("PAS")) { this.advance(); step = this.parseExpr(); }
    const body = this.parseStmtsUntil("FINPOUR");
    this.expect("NAME", "FINPOUR", "\"FIN POUR\" attendu.");
    const stop = { type: "BinOp", op: "+", left: stopIncl, right: { type: "Num", value: 1 } };
    return { type: "ForRange", varName: nameTok.value, start, stop, step, body, line: t.line };
  };

  // ---------- Environment ----------
  class Env {
    constructor(parent) { this.vars = new Map(); this.parent = parent || null; }
    get(name) {
      if (this.vars.has(name)) return this.vars.get(name);
      if (this.parent) return this.parent.get(name);
      return undefined;
    }
    has(name) {
      if (this.vars.has(name)) return true;
      if (this.parent) return this.parent.has(name);
      return false;
    }
    set(name, value) { this.vars.set(name, value); }
    // assign to nearest scope that already has it, else define locally
    assign(name, value) {
      let e = this;
      while (e) { if (e.vars.has(name)) { e.vars.set(name, value); return; } e = e.parent; }
      this.vars.set(name, value);
    }
  }

  // ---------- Value formatting ----------
  function fmt(v) {
    if (v === null || v === undefined) return "None";
    if (typeof v === "boolean") return v ? "True" : "False";
    if (typeof v === "number") {
      if (Number.isInteger(v)) return String(v);
      return String(Math.round(v * 1e10) / 1e10);
    }
    if (Array.isArray(v)) return "[" + v.map(reprVal).join(", ") + "]";
    if (v instanceof Map) return "{" + Array.from(v.entries()).map(([k, val]) => reprVal(k) + ": " + reprVal(val)).join(", ") + "}";
    if (v instanceof Instance) return "<" + v.className + ">";
    return String(v);
  }
  // like fmt(), but quotes strings — used for elements shown *inside* a list/dict, matching Python's repr()
  function reprVal(v) {
    if (typeof v === "string") return "'" + v.replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
    return fmt(v);
  }
  function truthy(v) {
    if (v === null || v === undefined) return false;
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v !== 0;
    if (typeof v === "string") return v.length > 0;
    return true;
  }
  // Deep-clone a runtime value for a trace snapshot: lists/dicts are mutable and shared by
  // reference, so without cloning, later mutations would retroactively change earlier trace entries.
  function cloneTraceVal(v) {
    if (Array.isArray(v)) return v.map(cloneTraceVal);
    if (v instanceof Map) return new Map(Array.from(v.entries()).map(([k, val]) => [k, cloneTraceVal(val)]));
    if (v instanceof Instance) {
      const clone = new Instance(v.className);
      v.attrs.forEach((val, k) => clone.attrs.set(k, cloneTraceVal(val)));
      return clone;
    }
    return v;
  }

  // ---------- Interpreter ----------
  class Interpreter {
    constructor(opts) {
      this.output = [];
      this.onPrint = (opts && opts.onPrint) || null;
      this.maxSteps = (opts && opts.maxSteps) || 200000;
      this.steps = 0;
      this.funcs = new Map();
      this.classes = new Map();
      this.files = new Map();
      this.callDepth = 0;
      this.maxCallDepth = 300;
      this.trace = (opts && opts.trace) ? [] : null;
      this.maxTraceLen = (opts && opts.maxTraceLen) || 400;
    }
    tick(line) {
      this.steps++;
      if (this.steps > this.maxSteps) {
        throw new RTError("Le programme met trop de temps à s'exécuter (boucle infinie ?). Vérifie ta condition d'arrêt.", line);
      }
    }
    run(ast) {
      const env = new Env(null);
      this.execBlock(ast.body, env);
      return env;
    }
    execBlock(stmts, env) {
      for (const s of stmts) this.execStmt(s, env);
    }
    // Recording a trace entry after each statement — including nested calls, since execStmt
    // recurses naturally through execBlock — gives a full step-by-step replay for "mode pas à pas".
    recordTrace(s, env) {
      if (!this.trace || this.trace.length >= this.maxTraceLen) return;
      const vars = {};
      const chain = [];
      let e = env;
      while (e) { chain.unshift(e); e = e.parent; }
      chain.forEach((scope) => { scope.vars.forEach((v, k) => { vars[k] = cloneTraceVal(v); }); });
      this.trace.push({
        line: s.line,
        type: s.type,
        vars,
        outputLen: this.output.length,
      });
    }
    execStmt(s, env) {
      this.tick(s.line);
      this.execStmtInner(s, env);
      if (this.trace) this.recordTrace(s, env);
    }
    execStmtInner(s, env) {
      switch (s.type) {
        case "Assign": {
          let value = this.evalExpr(s.value, env);
          if (s.op !== "=") {
            const cur = env.get(s.name);
            if (cur === undefined) throw new RTError(`La variable "${s.name}" n'existe pas encore.`, s.line);
            const base = { "+=": "+", "-=": "-", "*=": "*", "/=": "/" }[s.op];
            value = this.binOp(base, cur, value, s.line);
          }
          env.assign(s.name, value);
          return;
        }
        case "Print": {
          const parts = s.args.map((a) => fmt(this.evalExpr(a, env)));
          const line = parts.join(" ");
          this.output.push(line);
          if (this.onPrint) this.onPrint(line);
          return;
        }
        case "If": {
          for (const br of s.branches) {
            if (truthy(this.evalExpr(br.cond, env))) { this.execBlock(br.body, env); return; }
          }
          if (s.elseBody) this.execBlock(s.elseBody, env);
          return;
        }
        case "While": {
          while (truthy(this.evalExpr(s.cond, env))) {
            this.tick(s.line);
            try { this.execBlock(s.body, env); }
            catch (sig) {
              if (sig instanceof BreakSignal) break;
              if (sig instanceof ContinueSignal) continue;
              throw sig;
            }
          }
          return;
        }
        case "ForRange": {
          const start = this.evalExpr(s.start, env);
          const stop = this.evalExpr(s.stop, env);
          const step = this.evalExpr(s.step, env);
          if (typeof start !== "number" || typeof stop !== "number" || typeof step !== "number") {
            throw new RTError("Les bornes d'une boucle doivent être des nombres.", s.line);
          }
          if (step === 0) throw new RTError("Le pas d'une boucle ne peut pas être 0.", s.line);
          if (step > 0) {
            for (let i = start; i < stop; i += step) {
              this.tick(s.line);
              env.assign(s.varName, i);
              try { this.execBlock(s.body, env); }
              catch (sig) {
                if (sig instanceof BreakSignal) break;
                if (sig instanceof ContinueSignal) continue;
                throw sig;
              }
            }
          } else {
            for (let i = start; i > stop; i += step) {
              this.tick(s.line);
              env.assign(s.varName, i);
              try { this.execBlock(s.body, env); }
              catch (sig) {
                if (sig instanceof BreakSignal) break;
                if (sig instanceof ContinueSignal) continue;
                throw sig;
              }
            }
          }
          return;
        }
        case "ForEach": {
          const iterable = this.evalExpr(s.iter, env);
          let items;
          if (Array.isArray(iterable)) items = iterable.slice();
          else if (typeof iterable === "string") items = iterable.split("");
          else if (iterable instanceof Map) items = Array.from(iterable.keys());
          else throw new RTError("Cette valeur n'est pas parcourable avec for ... in ... (attendu : liste, texte ou dictionnaire).", s.line);
          for (const item of items) {
            this.tick(s.line);
            env.assign(s.varName, item);
            try { this.execBlock(s.body, env); }
            catch (sig) {
              if (sig instanceof BreakSignal) break;
              if (sig instanceof ContinueSignal) continue;
              throw sig;
            }
          }
          return;
        }
        case "Break": throw new BreakSignal();
        case "Continue": throw new ContinueSignal();
        case "IndexAssign": {
          const obj = this.evalExpr(s.target.obj, env);
          const idx = this.evalExpr(s.target.index, env);
          let value = this.evalExpr(s.value, env);
          if (s.op !== "=") {
            const cur = this.getIndexed(obj, idx, s.line);
            const base = { "+=": "+", "-=": "-", "*=": "*", "/=": "/" }[s.op];
            value = this.binOp(base, cur, value, s.line);
          }
          this.setIndexed(obj, idx, value, s.line);
          return;
        }
        case "AttrAssign": {
          const obj = this.evalExpr(s.target.obj, env);
          if (!(obj instanceof Instance)) throw new RTError(`Impossible de modifier un attribut sur cette valeur (ce n'est pas un objet).`, s.line);
          let value = this.evalExpr(s.value, env);
          if (s.op !== "=") {
            if (!obj.attrs.has(s.target.name)) throw new RTError(`L'attribut ".${s.target.name}" n'existe pas encore sur cet objet.`, s.line);
            const cur = obj.attrs.get(s.target.name);
            const base = { "+=": "+", "-=": "-", "*=": "*", "/=": "/" }[s.op];
            value = this.binOp(base, cur, value, s.line);
          }
          obj.attrs.set(s.target.name, value);
          return;
        }
        case "ClassDef": {
          this.classes.set(s.name, s);
          return;
        }
        case "Try": {
          try {
            this.execBlock(s.body, env);
          } catch (err) {
            if (err instanceof RTError) {
              if (s.errVarName) env.assign(s.errVarName, err.message);
              this.execBlock(s.exceptBody, env);
            } else {
              throw err; // ReturnSignal (and anything else) must keep propagating
            }
          }
          return;
        }
        case "FuncDef": {
          this.funcs.set(s.name, s);
          return;
        }
        case "Return": {
          const value = s.value ? this.evalExpr(s.value, env) : null;
          throw new ReturnSignal(value);
        }
        case "ExprStmt": {
          this.evalExpr(s.expr, env);
          return;
        }
        default:
          throw new RTError("Instruction inconnue.", s.line);
      }
    }
    getIndexed(obj, idx, line) {
      if (Array.isArray(obj)) {
        if (typeof idx !== "number" || !Number.isInteger(idx)) throw new RTError("L'index d'une liste doit être un nombre entier.", line);
        let i = idx; if (i < 0) i += obj.length;
        if (i < 0 || i >= obj.length) throw new RTError(`Index ${idx} hors limites (la liste a ${obj.length} élément(s)).`, line);
        return obj[i];
      }
      if (typeof obj === "string") {
        if (typeof idx !== "number" || !Number.isInteger(idx)) throw new RTError("L'index d'un texte doit être un nombre entier.", line);
        let i = idx; if (i < 0) i += obj.length;
        if (i < 0 || i >= obj.length) throw new RTError(`Index ${idx} hors limites (le texte a ${obj.length} caractère(s)).`, line);
        return obj[i];
      }
      if (obj instanceof Map) {
        if (!obj.has(idx)) throw new RTError(`La clé ${JSON.stringify(idx)} n'existe pas dans le dictionnaire.`, line);
        return obj.get(idx);
      }
      throw new RTError("Impossible d'indexer cette valeur (attendu : liste, texte ou dictionnaire).", line);
    }
    setIndexed(obj, idx, value, line) {
      if (Array.isArray(obj)) {
        if (typeof idx !== "number" || !Number.isInteger(idx)) throw new RTError("L'index d'une liste doit être un nombre entier.", line);
        let i = idx; if (i < 0) i += obj.length;
        if (i < 0 || i >= obj.length) throw new RTError(`Index ${idx} hors limites (la liste a ${obj.length} élément(s)) — utilise .append() pour ajouter un élément.`, line);
        obj[i] = value;
        return;
      }
      if (obj instanceof Map) { obj.set(idx, value); return; }
      throw new RTError("Impossible de modifier un élément de cette valeur (attendu : liste ou dictionnaire).", line);
    }
    binOp(op, l, r, line) {
      if (op === "+") {
        if (Array.isArray(l) || Array.isArray(r)) {
          if (!Array.isArray(l) || !Array.isArray(r)) throw new RTError("Impossible d'additionner une liste avec autre chose qu'une liste.", line);
          return l.concat(r);
        }
        if (typeof l === "string" || typeof r === "string") {
          if (typeof l === "number" || typeof r === "number") {
            throw new RTError(`Impossible d'additionner un texte et un nombre directement (utilise str() pour convertir).`, line);
          }
          return String(l) + String(r);
        }
        return l + r;
      }
      if (typeof l !== "number" || typeof r !== "number") {
        throw new RTError(`L'opérateur "${op}" attend des nombres.`, line);
      }
      switch (op) {
        case "-": return l - r;
        case "*": return l * r;
        case "/": if (r === 0) throw new RTError("Division par zéro.", line); return l / r;
        case "//": if (r === 0) throw new RTError("Division par zéro.", line); return Math.floor(l / r);
        case "%": if (r === 0) throw new RTError("Division par zéro (modulo).", line); return ((l % r) + r) % r;
        case "**": return Math.pow(l, r);
        default: throw new RTError(`Opérateur inconnu "${op}".`, line);
      }
    }
    evalExpr(e, env) {
      switch (e.type) {
        case "Num": return e.value;
        case "Str": return e.value;
        case "Bool": return e.value;
        case "NoneLit": return null;
        case "Name": {
          if (!env.has(e.name)) throw new RTError(`La variable "${e.name}" n'existe pas.`, e.line);
          return env.get(e.name);
        }
        case "UnaryOp": {
          const v = this.evalExpr(e.operand, env);
          if (e.op === "-") {
            if (typeof v !== "number") throw new RTError("Le signe \"-\" attend un nombre.", e.line);
            return -v;
          }
          if (e.op === "not") return !truthy(v);
          throw new RTError("Opérateur unaire inconnu.", e.line);
        }
        case "BinOp": {
          const l = this.evalExpr(e.left, env);
          const r = this.evalExpr(e.right, env);
          return this.binOp(e.op, l, r, e.line);
        }
        case "Compare": {
          if (e.op === "in" || e.op === "not in") {
            const l = this.evalExpr(e.left, env);
            const r = this.evalExpr(e.right, env);
            let result;
            if (Array.isArray(r)) result = r.some((x) => x === l);
            else if (typeof r === "string") {
              if (typeof l !== "string") throw new RTError('"in" sur du texte attend un texte à chercher.', e.line);
              result = r.includes(l);
            } else if (r instanceof Map) result = r.has(l);
            else throw new RTError('"in" ne fonctionne que sur une liste, un texte ou un dictionnaire.', e.line);
            return e.op === "in" ? result : !result;
          }
          const l = this.evalExpr(e.left, env);
          const r = this.evalExpr(e.right, env);
          switch (e.op) {
            case "==": return l === r;
            case "!=": return l !== r;
            case "<": return l < r;
            case ">": return l > r;
            case "<=": return l <= r;
            case ">=": return l >= r;
            default: throw new RTError("Comparateur inconnu.", e.line);
          }
        }
        case "BoolOp": {
          const l = this.evalExpr(e.left, env);
          if (e.op === "and") return truthy(l) ? this.evalExpr(e.right, env) : l;
          if (e.op === "or") return truthy(l) ? l : this.evalExpr(e.right, env);
          throw new RTError("Opérateur logique inconnu.", e.line);
        }
        case "Call": {
          return this.callFunc(e.callee, e.args.map((a) => this.evalExpr(a, env)), e.line);
        }
        case "ListLit": {
          return e.items.map((it) => this.evalExpr(it, env));
        }
        case "DictLit": {
          const m = new Map();
          for (const [k, v] of e.pairs) m.set(this.evalExpr(k, env), this.evalExpr(v, env));
          return m;
        }
        case "Index": {
          const obj = this.evalExpr(e.obj, env);
          const idx = this.evalExpr(e.index, env);
          return this.getIndexed(obj, idx, e.line);
        }
        case "Slice": {
          const obj = this.evalExpr(e.obj, env);
          const isList = Array.isArray(obj);
          const isStr = typeof obj === "string";
          if (!isList && !isStr) throw new RTError("Impossible de découper cette valeur (attendu : liste ou texte).", e.line);
          const len = obj.length;
          let start = e.start ? this.evalExpr(e.start, env) : 0;
          let stop = e.stop ? this.evalExpr(e.stop, env) : len;
          if (start < 0) start = Math.max(0, len + start);
          if (stop < 0) stop = Math.max(0, len + stop);
          start = Math.min(start, len);
          stop = Math.max(start, Math.min(stop, len));
          return isList ? obj.slice(start, stop) : obj.slice(start, stop);
        }
        case "MethodCall": {
          const obj = this.evalExpr(e.obj, env);
          const args = e.args.map((a) => this.evalExpr(a, env));
          return this.callMethod(obj, e.method, args, e.line);
        }
        case "Attr": {
          const obj = this.evalExpr(e.obj, env);
          if (!(obj instanceof Instance)) throw new RTError(`Impossible d'accéder à ".${e.name}" sur cette valeur (ce n'est pas un objet).`, e.line);
          if (!obj.attrs.has(e.name)) throw new RTError(`L'objet n'a pas (encore) d'attribut ".${e.name}".`, e.line);
          return obj.attrs.get(e.name);
        }
        case "ListComp": {
          const iterable = this.evalExpr(e.iter, env);
          let items;
          if (Array.isArray(iterable)) items = iterable;
          else if (typeof iterable === "string") items = iterable.split("");
          else if (iterable instanceof Map) items = Array.from(iterable.keys());
          else throw new RTError("Cette valeur n'est pas parcourable dans une compréhension (attendu : liste, texte ou dictionnaire).", e.line);
          const result = [];
          for (const item of items) {
            this.tick(e.line);
            env.assign(e.varName, item);
            if (e.cond && !truthy(this.evalExpr(e.cond, env))) continue;
            result.push(this.evalExpr(e.expr, env));
          }
          return result;
        }
        case "DictComp": {
          const iterable = this.evalExpr(e.iter, env);
          let items;
          if (Array.isArray(iterable)) items = iterable;
          else if (typeof iterable === "string") items = iterable.split("");
          else if (iterable instanceof Map) items = Array.from(iterable.keys());
          else throw new RTError("Cette valeur n'est pas parcourable dans une compréhension (attendu : liste, texte ou dictionnaire).", e.line);
          const result = new Map();
          for (const item of items) {
            this.tick(e.line);
            env.assign(e.varName, item);
            if (e.cond && !truthy(this.evalExpr(e.cond, env))) continue;
            result.set(this.evalExpr(e.keyExpr, env), this.evalExpr(e.valExpr, env));
          }
          return result;
        }
        default:
          throw new RTError("Expression inconnue.", e.line);
      }
    }
    callInstanceMethod(instance, methodName, args, line) {
      const cls = this.classes.get(instance.className);
      const m = cls && cls.methods.find((mm) => mm.name === methodName);
      if (!m) throw new RTError(`La classe "${instance.className}" n'a pas de méthode ".${methodName}()".`, line);
      const expected = Math.max(m.params.length - 1, 0);
      if (!m.varargName && expected !== args.length) {
        throw new RTError(`".${methodName}()" attend ${expected} argument(s), ${args.length} fourni(s).`, line);
      }
      if (m.varargName && args.length < expected) {
        throw new RTError(`".${methodName}()" attend au moins ${expected} argument(s), ${args.length} fourni(s).`, line);
      }
      this.callDepth++;
      if (this.callDepth > this.maxCallDepth) {
        this.callDepth--;
        throw new RTError("Trop d'appels de fonction imbriqués (récursion infinie ?).", line);
      }
      const local = new Env(null);
      local.set(m.params[0] || "self", instance);
      for (let i = 1; i < m.params.length; i++) local.set(m.params[i], args[i - 1]);
      if (m.varargName) local.set(m.varargName, args.slice(expected));
      try {
        this.execBlock(m.body, local);
        return null;
      } catch (sig) {
        if (sig instanceof ReturnSignal) return sig.value;
        throw sig;
      } finally {
        this.callDepth--;
      }
    }
    callMethod(obj, method, args, line) {
      if (obj instanceof Instance) return this.callInstanceMethod(obj, method, args, line);
      if (typeof obj === "string") {
        switch (method) {
          case "upper": return obj.toUpperCase();
          case "lower": return obj.toLowerCase();
          case "strip": return obj.trim();
          case "capitalize": return obj.length ? obj.charAt(0).toUpperCase() + obj.slice(1).toLowerCase() : obj;
          case "split": {
            if (!args.length || args[0] === null) return obj.trim() === "" ? [] : obj.trim().split(/\s+/);
            if (typeof args[0] !== "string" || args[0] === "") throw new RTError("split() attend un séparateur (texte non vide).", line);
            return obj.split(args[0]);
          }
          case "replace": {
            const [a, b] = args;
            if (typeof a !== "string" || typeof b !== "string") throw new RTError("replace() attend deux textes.", line);
            return obj.split(a).join(b);
          }
          case "join": {
            const list = args[0];
            if (!Array.isArray(list)) throw new RTError("join() attend une liste.", line);
            return list.map((x) => { if (typeof x !== "string") throw new RTError("join() attend une liste de textes (utilise str() pour convertir).", line); return x; }).join(obj);
          }
          case "startswith": return typeof args[0] === "string" && obj.startsWith(args[0]);
          case "endswith": return typeof args[0] === "string" && obj.endsWith(args[0]);
          case "count": {
            if (typeof args[0] !== "string" || args[0] === "") return 0;
            let c = 0, i = 0;
            while ((i = obj.indexOf(args[0], i)) !== -1) { c++; i += args[0].length; }
            return c;
          }
          case "find": return obj.indexOf(args[0]);
          default: throw new RTError(`Un texte n'a pas de méthode ".${method}()".`, line);
        }
      }
      if (Array.isArray(obj)) {
        switch (method) {
          case "append": obj.push(args[0]); return null;
          case "pop": {
            if (obj.length === 0) throw new RTError("Impossible de retirer un élément d'une liste vide.", line);
            let i = args.length ? args[0] : obj.length - 1;
            if (i < 0) i += obj.length;
            if (i < 0 || i >= obj.length) throw new RTError(`Index ${args[0]} hors limites.`, line);
            return obj.splice(i, 1)[0];
          }
          case "remove": {
            const i = obj.findIndex((x) => x === args[0]);
            if (i === -1) throw new RTError("Cette valeur n'est pas dans la liste.", line);
            obj.splice(i, 1);
            return null;
          }
          case "insert": {
            let i = args[0]; if (i < 0) i += obj.length;
            i = Math.max(0, Math.min(i, obj.length));
            obj.splice(i, 0, args[1]);
            return null;
          }
          case "sort": obj.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)); return null;
          case "reverse": obj.reverse(); return null;
          case "count": return obj.filter((x) => x === args[0]).length;
          case "index": {
            const i = obj.findIndex((x) => x === args[0]);
            if (i === -1) throw new RTError("Cette valeur n'est pas dans la liste.", line);
            return i;
          }
          default: throw new RTError(`Une liste n'a pas de méthode ".${method}()".`, line);
        }
      }
      if (obj instanceof Map) {
        switch (method) {
          case "get": return obj.has(args[0]) ? obj.get(args[0]) : (args.length > 1 ? args[1] : null);
          case "keys": return Array.from(obj.keys());
          case "values": return Array.from(obj.values());
          case "items": return Array.from(obj.entries()).map(([k, v]) => [k, v]);
          case "pop": {
            if (!obj.has(args[0])) { if (args.length > 1) return args[1]; throw new RTError("Cette clé n'existe pas dans le dictionnaire.", line); }
            const v = obj.get(args[0]);
            obj.delete(args[0]);
            return v;
          }
          default: throw new RTError(`Un dictionnaire n'a pas de méthode ".${method}()".`, line);
        }
      }
      throw new RTError("Cette valeur n'a pas de méthode.", line);
    }
    callFunc(name, args, line) {
      const asList = (a) => (a.length === 1 && Array.isArray(a[0]) ? a[0] : a);
      const builtins = {
        len: (a) => {
          const v = a[0];
          if (typeof v === "string") return v.length;
          if (Array.isArray(v)) return v.length;
          if (v instanceof Map) return v.size;
          throw new RTError("len() attend du texte, une liste ou un dictionnaire.", line);
        },
        str: (a) => fmt(a[0]),
        int: (a) => {
          const v = a[0];
          if (typeof v === "number") return Math.trunc(v);
          if (typeof v === "boolean") return v ? 1 : 0;
          if (typeof v === "string") {
            const s = v.trim();
            if (!/^[+-]?\d+$/.test(s)) throw new RTError(`Impossible de convertir "${v}" en nombre entier.`, line);
            return parseInt(s, 10);
          }
          throw new RTError("int() attend du texte ou un nombre.", line);
        },
        float: (a) => {
          const v = a[0];
          if (typeof v === "number") return v;
          if (typeof v === "boolean") return v ? 1 : 0;
          if (typeof v === "string") {
            const s = v.trim();
            if (!/^[+-]?\d+(\.\d+)?$/.test(s)) throw new RTError(`Impossible de convertir "${v}" en nombre.`, line);
            return parseFloat(s);
          }
          throw new RTError("float() attend du texte ou un nombre.", line);
        },
        abs: (a) => Math.abs(a[0]),
        max: (a) => { const list = asList(a); if (!list.length) throw new RTError("max() attend au moins une valeur.", line); return list.reduce((m, x) => (x > m ? x : m)); },
        min: (a) => { const list = asList(a); if (!list.length) throw new RTError("min() attend au moins une valeur.", line); return list.reduce((m, x) => (x < m ? x : m)); },
        sum: (a) => {
          const list = asList(a);
          return list.reduce((s, x) => { if (typeof x !== "number") throw new RTError("sum() attend une liste de nombres.", line); return s + x; }, 0);
        },
        sorted: (a) => {
          if (!Array.isArray(a[0])) throw new RTError("sorted() attend une liste.", line);
          return a[0].slice().sort((x, y) => (x < y ? -1 : x > y ? 1 : 0));
        },
        round: (a) => (a.length > 1 ? Number(a[0].toFixed(a[1])) : Math.round(a[0])),
        // range() as a plain callable (in addition to the "for x in range(...):" fast path already
        // handled structurally by the parser) — needed so range() also works inside comprehensions,
        // list(range(...)), sum(range(...)), etc. Materialized eagerly as a list, unlike real Python.
        range: (a) => {
          let start = 0, stop, step = 1;
          if (a.length === 1) { stop = a[0]; }
          else if (a.length === 2) { start = a[0]; stop = a[1]; }
          else if (a.length === 3) { start = a[0]; stop = a[1]; step = a[2]; }
          else throw new RTError("range() accepte 1 à 3 arguments.", line);
          if (typeof start !== "number" || typeof stop !== "number" || typeof step !== "number") {
            throw new RTError("range() attend des nombres.", line);
          }
          if (step === 0) throw new RTError("Le pas de range() ne peut pas être 0.", line);
          const out = [];
          if (step > 0) { for (let i = start; i < stop; i += step) out.push(i); }
          else { for (let i = start; i > stop; i += step) out.push(i); }
          return out;
        },
        list: (a) => {
          const v = a[0];
          if (Array.isArray(v)) return v.slice();
          if (typeof v === "string") return v.split("");
          if (v instanceof Map) return Array.from(v.keys());
          throw new RTError("list() attend une liste, un texte ou un dictionnaire.", line);
        },
        // ---- simulated virtual filesystem (scoped to this one execution — see the "Fichiers" lesson) ----
        write_file: (a) => {
          const [nom, contenu] = a;
          if (typeof nom !== "string") throw new RTError("write_file() attend un nom de fichier (texte) en premier argument.", line);
          if (typeof contenu !== "string") throw new RTError("write_file() attend le contenu à écrire (texte) en second argument.", line);
          this.files.set(nom, contenu);
          return null;
        },
        read_file: (a) => {
          const [nom] = a;
          if (typeof nom !== "string") throw new RTError("read_file() attend un nom de fichier (texte).", line);
          if (!this.files.has(nom)) throw new RTError(`Le fichier "${nom}" n'existe pas — utilise write_file() pour le créer d'abord.`, line);
          return this.files.get(nom);
        },
        file_exists: (a) => this.files.has(a[0]),
      };
      if (builtins[name]) return builtins[name](args);
      if (this.classes.has(name)) return this.instantiate(name, args, line);
      const fn = this.funcs.get(name);
      if (!fn) throw new RTError(`La fonction "${name}" n'est pas définie.`, line);
      const expected = fn.params.length;
      if (!fn.varargName && expected !== args.length) {
        throw new RTError(`"${name}" attend ${expected} argument(s), ${args.length} fourni(s).`, line);
      }
      if (fn.varargName && args.length < expected) {
        throw new RTError(`"${name}" attend au moins ${expected} argument(s), ${args.length} fourni(s).`, line);
      }
      this.callDepth++;
      if (this.callDepth > this.maxCallDepth) {
        this.callDepth--;
        throw new RTError("Trop d'appels de fonction imbriqués (récursion infinie ?).", line);
      }
      const local = new Env(null); // functions do not close over caller locals; globals via this.funcs only
      fn.params.forEach((p, i) => local.set(p, args[i]));
      if (fn.varargName) local.set(fn.varargName, args.slice(expected));
      try {
        this.execBlock(fn.body, local);
        return null;
      } catch (sig) {
        if (sig instanceof ReturnSignal) return sig.value;
        throw sig;
      } finally {
        this.callDepth--;
      }
    }
    // creates a new instance of a user-defined class, running __init__ (if any) with self bound to it
    instantiate(className, args, line) {
      const cls = this.classes.get(className);
      const inst = new Instance(className);
      const initM = cls.methods.find((m) => m.name === "__init__");
      if (!initM) {
        if (args.length > 0) throw new RTError(`La classe "${className}" n'a pas de constructeur __init__ acceptant des arguments.`, line);
        return inst;
      }
      const expected = Math.max(initM.params.length - 1, 0);
      if (!initM.varargName && expected !== args.length) {
        throw new RTError(`"${className}(...)" attend ${expected} argument(s), ${args.length} fourni(s).`, line);
      }
      if (initM.varargName && args.length < expected) {
        throw new RTError(`"${className}(...)" attend au moins ${expected} argument(s), ${args.length} fourni(s).`, line);
      }
      this.callDepth++;
      if (this.callDepth > this.maxCallDepth) {
        this.callDepth--;
        throw new RTError("Trop d'appels de fonction imbriqués (récursion infinie ?).", line);
      }
      const local = new Env(null);
      local.set(initM.params[0] || "self", inst);
      for (let i = 1; i < initM.params.length; i++) local.set(initM.params[i], args[i - 1]);
      if (initM.varargName) local.set(initM.varargName, args.slice(expected));
      try {
        this.execBlock(initM.body, local);
      } catch (sig) {
        if (!(sig instanceof ReturnSignal)) throw sig;
      } finally {
        this.callDepth--;
      }
      return inst;
    }
  }

  // ---------- Public API ----------
  function runProgram(ast, opts) {
    const interp = new Interpreter(opts);
    try {
      const env = interp.run(ast);
      const globals = {};
      for (const [k, v] of env.vars.entries()) globals[k] = v;
      return { success: true, output: interp.output, globals, error: null, trace: interp.trace };
    } catch (err) {
      if (err instanceof ReturnSignal) {
        return { success: true, output: interp.output, globals: {}, error: null, trace: interp.trace };
      }
      const msg = err instanceof RTError ? err.message : ("Erreur interne : " + err.message);
      return { success: false, output: interp.output, globals: {}, error: { message: msg, line: err.line || null }, trace: interp.trace };
    }
  }

  function runPython(source, opts) {
    try {
      const toks = pyTokenize(source);
      const ast = new PyParser(toks).parseProgram();
      return runProgram(ast, opts);
    } catch (err) {
      const msg = err instanceof RTError ? err.message : ("Erreur : " + err.message);
      return { success: false, output: [], globals: {}, error: { message: msg, line: err.line || null } };
    }
  }
  function runPseudo(source, opts) {
    try {
      const toks = pseudoTokenize(source);
      const ast = new PseudoParser(toks).parseProgram();
      return runProgram(ast, opts);
    } catch (err) {
      const msg = err instanceof RTError ? err.message : ("Erreur : " + err.message);
      return { success: false, output: [], globals: {}, error: { message: msg, line: err.line || null } };
    }
  }

  const AlgoEngine = { runPython, runPseudo, fmt };
  if (typeof module !== "undefined" && module.exports) module.exports = AlgoEngine;
  else global.AlgoEngine = AlgoEngine;
})(typeof window !== "undefined" ? window : globalThis);
