import Handlebars from 'handlebars';
import { formatCurrency } from './formatting/currency';
import { formatDate } from './formatting/date';
import { formatNumber } from './formatting/number';
import { uppercase, lowercase } from './formatting/text';
import { eq, neq } from './comparison/equality';
import { and, or, not } from './comparison/logical';
import { gt, gte, lt, lte } from './comparison/conditions';
import { join } from './collections/join';
import { length } from './collections/length';
import { lookup, add } from './collections/lookup';

export function registerAllHelpers(hbs: typeof Handlebars): void {
  hbs.registerHelper('formatCurrency', formatCurrency);
  hbs.registerHelper('formatDate', formatDate);
  hbs.registerHelper('formatNumber', formatNumber);
  hbs.registerHelper('uppercase', uppercase);
  hbs.registerHelper('lowercase', lowercase);
  hbs.registerHelper('eq', eq);
  hbs.registerHelper('neq', neq);
  hbs.registerHelper('and', and);
  hbs.registerHelper('or', or);
  hbs.registerHelper('not', not);
  hbs.registerHelper('gt', gt);
  hbs.registerHelper('gte', gte);
  hbs.registerHelper('lt', lt);
  hbs.registerHelper('lte', lte);
  hbs.registerHelper('join', join);
  hbs.registerHelper('length', length);
  hbs.registerHelper('lookup', lookup);
  hbs.registerHelper('add', add);
}
