export type TokenKind =
  | "NUMBER"
  | "STRING"
  | "IDENT"
  | "PLUS"
  | "MINUS"
  | "STAR"
  | "SLASH"
  | "CARET"
  | "LPAREN"
  | "RPAREN"
  | "COMMA"
  | "EQ"
  | "NE"
  | "LT"
  | "GT"
  | "LE"
  | "GE"
  | "AMP"
  | "COLON"
  | "BANG"
  | "EOF";

export interface Token {
  readonly kind: TokenKind;
  readonly lexeme: string;
}

export class LexError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LexError";
  }
}

function isDigit(ch: string): boolean {
  return ch >= "0" && ch <= "9";
}

function isAlpha(ch: string): boolean {
  return (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || ch === "_";
}

function isAlphaNumeric(ch: string): boolean {
  return isAlpha(ch) || isDigit(ch);
}

export function tokenizeFormula(input: string): Token[] {
  const source = input.startsWith("=") ? input.slice(1) : input;
  const tokens: Token[] = [];
  let i = 0;

  while (i < source.length) {
    const ch = source[i];
    if (ch === undefined) {
      break;
    }

    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
      i += 1;
      continue;
    }

    if (ch === "+") {
      tokens.push({ kind: "PLUS", lexeme: ch });
      i += 1;
      continue;
    }
    if (ch === "-") {
      tokens.push({ kind: "MINUS", lexeme: ch });
      i += 1;
      continue;
    }
    if (ch === "*") {
      tokens.push({ kind: "STAR", lexeme: ch });
      i += 1;
      continue;
    }
    if (ch === "/") {
      tokens.push({ kind: "SLASH", lexeme: ch });
      i += 1;
      continue;
    }
    if (ch === "^") {
      tokens.push({ kind: "CARET", lexeme: ch });
      i += 1;
      continue;
    }
    if (ch === "&") {
      tokens.push({ kind: "AMP", lexeme: ch });
      i += 1;
      continue;
    }
    if (ch === ":") {
      tokens.push({ kind: "COLON", lexeme: ch });
      i += 1;
      continue;
    }
    if (ch === "!") {
      tokens.push({ kind: "BANG", lexeme: ch });
      i += 1;
      continue;
    }
    if (ch === "(") {
      tokens.push({ kind: "LPAREN", lexeme: ch });
      i += 1;
      continue;
    }
    if (ch === ")") {
      tokens.push({ kind: "RPAREN", lexeme: ch });
      i += 1;
      continue;
    }
    if (ch === ",") {
      tokens.push({ kind: "COMMA", lexeme: ch });
      i += 1;
      continue;
    }

    if (ch === "=") {
      tokens.push({ kind: "EQ", lexeme: ch });
      i += 1;
      continue;
    }
    if (ch === "<") {
      const next = source[i + 1];
      if (next === "=") {
        tokens.push({ kind: "LE", lexeme: "<=" });
        i += 2;
        continue;
      }
      if (next === ">") {
        tokens.push({ kind: "NE", lexeme: "<>" });
        i += 2;
        continue;
      }
      tokens.push({ kind: "LT", lexeme: "<" });
      i += 1;
      continue;
    }
    if (ch === ">") {
      const next = source[i + 1];
      if (next === "=") {
        tokens.push({ kind: "GE", lexeme: ">=" });
        i += 2;
        continue;
      }
      tokens.push({ kind: "GT", lexeme: ">" });
      i += 1;
      continue;
    }

    if (isDigit(ch) || (ch === "." && isDigit(source[i + 1] ?? ""))) {
      const start = i;
      if (ch !== ".") {
        i += 1;
        while (isDigit(source[i] ?? "")) {
          i += 1;
        }
      }
      if (source[i] === ".") {
        i += 1;
        while (isDigit(source[i] ?? "")) {
          i += 1;
        }
      }
      tokens.push({
        kind: "NUMBER",
        lexeme: source.slice(start, i),
      });
      continue;
    }

    if (ch === '"') {
      const start = i;
      i += 1;
      while (i < source.length && source[i] !== '"') {
        i += 1;
      }
      if (source[i] !== '"') {
        throw new LexError("Unterminated string literal");
      }
      i += 1;
      tokens.push({
        kind: "STRING",
        lexeme: source.slice(start, i),
      });
      continue;
    }

    if (isAlpha(ch)) {
      const start = i;
      i += 1;
      while (isAlphaNumeric(source[i] ?? "")) {
        i += 1;
      }
      tokens.push({
        kind: "IDENT",
        lexeme: source.slice(start, i),
      });
      continue;
    }

    throw new LexError(`Unexpected character: ${ch}`);
  }

  tokens.push({ kind: "EOF", lexeme: "" });
  return tokens;
}
