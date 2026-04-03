import {
  ast,
  type BinaryOperator,
  type Expr,
  type UnaryOperator,
} from "./ast.js";
import { type Token, type TokenKind, tokenizeFormula } from "./lexer.js";

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParseError";
  }
}

const COMPARISON_OP: Record<TokenKind, BinaryOperator | undefined> = {
  NUMBER: undefined,
  STRING: undefined,
  IDENT: undefined,
  PLUS: undefined,
  MINUS: undefined,
  STAR: undefined,
  SLASH: undefined,
  CARET: undefined,
  AMP: undefined,
  COLON: undefined,
  LPAREN: undefined,
  RPAREN: undefined,
  COMMA: undefined,
  EQ: "=",
  NE: "<>",
  LT: "<",
  GT: ">",
  LE: "<=",
  GE: ">=",
  EOF: undefined,
};

export function parseFormula(input: string): Expr {
  const tokens = tokenizeFormula(input);
  const parser = new Parser(tokens);
  const expr = parser.parseExpression();
  parser.expect("EOF", "Expected end of input");
  return expr;
}

class Parser {
  private readonly tokens: Token[];
  private cursor = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parseExpression(): Expr {
    return this.parseComparison();
  }

  expect(kind: TokenKind, message: string): Token {
    const token = this.current();
    if (token.kind !== kind) {
      throw new ParseError(message);
    }
    this.cursor += 1;
    return token;
  }

  private parseComparison(): Expr {
    let expr = this.parseConcat();
    while (true) {
      const token = this.current();
      const op = COMPARISON_OP[token.kind];
      if (op === undefined) {
        break;
      }
      this.cursor += 1;
      const right = this.parseConcat();
      expr = ast.binary(op, expr, right);
    }
    return expr;
  }

  /** 文本连接 &，优先级低于 + -，高于比较 */
  private parseConcat(): Expr {
    let expr = this.parseAdditive();
    while (this.current().kind === "AMP") {
      this.cursor += 1;
      const right = this.parseAdditive();
      expr = ast.binary("&", expr, right);
    }
    return expr;
  }

  private parseAdditive(): Expr {
    let expr = this.parseMultiplicative();
    while (true) {
      const token = this.current();
      if (token.kind !== "PLUS" && token.kind !== "MINUS") {
        break;
      }
      this.cursor += 1;
      const op: BinaryOperator = token.kind === "PLUS" ? "+" : "-";
      const right = this.parseMultiplicative();
      expr = ast.binary(op, expr, right);
    }
    return expr;
  }

  private parseMultiplicative(): Expr {
    let expr = this.parseExponent();
    while (true) {
      const token = this.current();
      if (token.kind !== "STAR" && token.kind !== "SLASH") {
        break;
      }
      this.cursor += 1;
      const op: BinaryOperator = token.kind === "STAR" ? "*" : "/";
      const right = this.parseExponent();
      expr = ast.binary(op, expr, right);
    }
    return expr;
  }

  /** 幂运算右结合：2^3^2 = 2^(3^2) */
  private parseExponent(): Expr {
    const left = this.parseUnary();
    if (this.current().kind !== "CARET") {
      return left;
    }
    this.cursor += 1;
    const right = this.parseExponent();
    return ast.binary("^", left, right);
  }

  private parseUnary(): Expr {
    const token = this.current();
    if (token.kind === "PLUS" || token.kind === "MINUS") {
      this.cursor += 1;
      const op: UnaryOperator = token.kind === "PLUS" ? "+" : "-";
      return ast.unary(op, this.parseUnary());
    }
    return this.parsePrimary();
  }

  private parsePrimary(): Expr {
    const token = this.current();

    if (token.kind === "NUMBER") {
      this.cursor += 1;
      return ast.num(Number(token.lexeme));
    }

    if (token.kind === "STRING") {
      this.cursor += 1;
      return ast.str(token.lexeme.slice(1, -1));
    }

    if (token.kind === "IDENT") {
      this.cursor += 1;
      const ident = token.lexeme.toUpperCase();
      if (this.match("COLON")) {
        const end = this.expect("IDENT", "Expected cell reference after ':'");
        return ast.range(ident, end.lexeme.toUpperCase());
      }
      if (this.match("LPAREN")) {
        const args: Expr[] = [];
        if (!this.match("RPAREN")) {
          do {
            args.push(this.parseExpression());
          } while (this.match("COMMA"));
          this.expect("RPAREN", "Expected ')' after function arguments");
        }
        return ast.call(ident, args);
      }
      if (ident === "TRUE") {
        return ast.bool(true);
      }
      if (ident === "FALSE") {
        return ast.bool(false);
      }
      return ast.cell(ident);
    }

    if (this.match("LPAREN")) {
      const expr = this.parseExpression();
      this.expect("RPAREN", "Expected ')' after expression");
      return expr;
    }

    throw new ParseError(`Unexpected token: ${token.kind}`);
  }

  private current(): Token {
    const token = this.tokens[this.cursor];
    if (token === undefined) {
      throw new ParseError("Unexpected end of token stream");
    }
    return token;
  }

  private match(kind: TokenKind): boolean {
    if (this.current().kind !== kind) {
      return false;
    }
    this.cursor += 1;
    return true;
  }
}
