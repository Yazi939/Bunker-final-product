import type { FuelTransaction } from '../types/electron';

export interface FuelBalances {
  baseBalance: number;
  bunkerBalance: number;
}

export interface FuelStats {
  baseBalance: number;
  bunkerBalance: number;
  rawBaseBalance: number;
  rawBunkerBalance: number;
  baseAdjustment: number;
  bunkerAdjustment: number;
  avgPurchasePrice: number;
  profit: number;
  frozenCost: number;
}

interface BalanceState {
  baseBalance: number;
  bunkerBalance: number;
}

export function applyFuelBalanceEffect(
  transactionType: string,
  volume: number,
  balance: BalanceState,
): BalanceState {
  const safeVolume = Number(volume) || 0;
  switch (transactionType) {
    case 'purchase':
      return { ...balance, baseBalance: balance.baseBalance + safeVolume };
    case 'sale':
      return { ...balance, bunkerBalance: balance.bunkerBalance - safeVolume };
    case 'bunker_sale':
    case 'drain':
      return { ...balance, baseBalance: balance.baseBalance - safeVolume };
    case 'base_to_bunker':
      return {
        baseBalance: balance.baseBalance - safeVolume,
        bunkerBalance: balance.bunkerBalance + safeVolume,
      };
    case 'bunker_to_base':
      return {
        baseBalance: balance.baseBalance + safeVolume,
        bunkerBalance: balance.bunkerBalance - safeVolume,
      };
    default:
      return balance;
  }
}

export function clampFuelBalances(raw: BalanceState) {
  const baseBalance = Math.max(raw.baseBalance, 0);
  const bunkerBalance = Math.max(raw.bunkerBalance, 0);

  return {
    rawBaseBalance: raw.baseBalance,
    rawBunkerBalance: raw.bunkerBalance,
    baseBalance,
    bunkerBalance,
    baseAdjustment: baseBalance - raw.baseBalance,
    bunkerAdjustment: bunkerBalance - raw.bunkerBalance,
  };
}

/**
 * Рассчитывает остатки топлива на базе и бункеровщике по всем транзакциям
 */
export function calculateFuelBalances(transactions: FuelTransaction[]): FuelBalances {
  let raw = { baseBalance: 0, bunkerBalance: 0 };
  for (const t of transactions) {
    if (t.frozen) continue; // не учитывать замороженные
    raw = applyFuelBalanceEffect(t.type, t.volume || 0, raw);
  }
  const { baseBalance, bunkerBalance } = clampFuelBalances(raw);

  return { baseBalance, bunkerBalance };
}

/**
 * Полная статистика по топливу: прибыль, замороженные средства, средняя закупочная цена
 */
export function calculateFuelStats(transactions: FuelTransaction[]): FuelStats {
  let totalPurchased = 0;
  let totalSoldFromBase = 0;
  let totalSoldFromBunker = 0;
  let totalPurchaseCost = 0;
  let totalSaleIncome = 0;
  let raw = { baseBalance: 0, bunkerBalance: 0 };

  for (const t of transactions) {
    if (t.frozen) continue;
    const volume = t.volume || 0;
    const totalCost = t.totalCost || 0;
    raw = applyFuelBalanceEffect(t.type, volume, raw);
    switch (t.type) {
      case 'purchase':
        totalPurchased += volume;
        totalPurchaseCost += totalCost;
        break;
      case 'sale':
        totalSoldFromBunker += volume;
        totalSaleIncome += totalCost;
        break;
      case 'bunker_sale':
        totalSoldFromBase += volume;
        totalSaleIncome += totalCost;
        break;
      default:
        break;
    }
  }

  const {
    baseBalance,
    bunkerBalance,
    rawBaseBalance,
    rawBunkerBalance,
    baseAdjustment,
    bunkerAdjustment,
  } = clampFuelBalances(raw);
  const avgPurchasePrice = totalPurchased > 0 ? totalPurchaseCost / totalPurchased : 0;
  const totalSold = totalSoldFromBase + totalSoldFromBunker;
  const soldCost = totalSold * avgPurchasePrice;
  const profit = totalSaleIncome - soldCost;
  const frozenVolume = totalPurchased - totalSold;
  const frozenCost = frozenVolume > 0 ? frozenVolume * avgPurchasePrice : 0;

  return {
    baseBalance,
    bunkerBalance,
    rawBaseBalance,
    rawBunkerBalance,
    baseAdjustment,
    bunkerAdjustment,
    avgPurchasePrice,
    profit,
    frozenCost,
  };
} 