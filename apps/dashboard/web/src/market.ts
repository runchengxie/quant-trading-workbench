import type { Market, StockData } from './types';
import { isUsInstrument } from './liveQuote.ts';

/** Resolve legacy snapshots that do not yet carry an explicit market field. */
export function marketOf(stock: Pick<StockData, 'code' | 'market'>): Market {
  if (stock.market) return stock.market;
  if (isUsInstrument(stock)) return 'US';
  if (/^(?:hk\d+|\d+\.hk)$/i.test(stock.code)) return 'HK';
  return 'CN';
}
