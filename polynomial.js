const ohm = require('ohm-js');

const grammar = ohm.grammar(`Polynomial {
  Poly
    = Poly "+" term               -- add
    | Poly "-" term               -- subtract
    | "-" Poly                    -- negate
    | term
  term
    = coefficient "x^" exponent   -- coeff_var_exp
    | coefficient "x"             -- coeff_var
    | coefficient                 -- coeff
    | "x^" exponent               -- var_exp
    | "x"                         -- var
  coefficient
    = digit+ ("." digit+)?
  exponent
    = "-"? digit+
}`);

const semantics = grammar.createSemantics().addOperation('deriv', {
  Poly_add(p, op, t) {return `${p.deriv()}+${t.deriv()}`;},
  Poly_subtract(p, op, t) {return `${p.deriv()}-${t.deriv()}`;},
  Poly_negate(_, p) {return `-${p.deriv()}`;},
  term_coeff_var_exp(c, _, e) {return `${e.value * c.value}x^${e.value - 1}`;},
  term_coeff_var(c, _) {return `${c.value}`;},
  term_coeff(c) {return `0`;},
  term_var_exp(_, e) {return `${e.value}x^${e.value - 1}`;},
  term_var(_) {return `1`;},
}).addOperation('eval', {
  Poly_add(p, op, t) {return x => p.eval()(x) + t.eval()(x);},
  Poly_subtract(p, op, t) {return x => p.eval()(x) - t.eval()(x);},
  Poly_negate(_, p) {return x => -p.eval()(x);},
  term_coeff_var_exp(c, _, e) {return x => c.value * Math.pow(x, e.value);},
  term_coeff_var(c, _) {return x => c.value * x;},
  term_coeff(c) {return x => c.value;},
  term_var_exp(_, e) {return x => Math.pow(x, e.value);},
  term_var(_) {return x => x;},
}).addAttribute('value', {
  coefficient(whole, dot, fraction) {return +this.sourceString;},
  exponent(sign, magnitude) {return +this.sourceString;},
});

exports.derivative = poly => {
  let match = grammar.match(poly);
  if (!match.succeeded()) {
    throw new Error(match.message);
  }
  return semantics(match).deriv().replace(/--/g, '+').replace(/\+-/g, '-');
}

exports.evaluate = (poly, x) => {
  let match = grammar.match(poly);
  if (!match.succeeded()) {
    throw new Error(match.message);
  }
  return semantics(match).eval()(x);
}

if (!module.parent) {
  let func = process.argv[2];
  let match = grammar.match(process.argv[3]); //[3] is the polynomial
  if (match.succeeded()) {
    func == "eval" ? console.log(semantics(match).eval()(process.argv[4])) : console.log(semantics(match).deriv());
  } else {
    console.error(match.message);
    process.exitCode = 1;
  }
}
