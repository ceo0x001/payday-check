import type { Choice, Currency } from "./types";

/**
 * Locale packs. Nigeria-first, globally shaped.
 *
 * Currency does more than swap a symbol: it swaps the borrowing options,
 * the expense categories and the tracking tools, because "buy now pay later"
 * and "ajo" are not translations of each other.
 *
 * Note that amounts throughout the instrument are asked as *fractions of a
 * month's pay*, not absolute figures. That is deliberate — it costs the user
 * no privacy and makes Lagos and Chicago directly comparable.
 */

export interface CurrencyMeta {
  code: Currency;
  symbol: string;
  name: string;
  /** Shown on the currency gate. */
  blurb: string;
}

export const CURRENCIES: CurrencyMeta[] = [
  {
    code: "NGN",
    symbol: "₦",
    name: "Naira",
    blurb: "Nigeria",
  },
  {
    code: "USD",
    symbol: "$",
    name: "Dollar",
    blurb: "US & global",
  },
];

export function currencyMeta(c: Currency): CurrencyMeta {
  return CURRENCIES.find((x) => x.code === c) ?? CURRENCIES[0];
}

/* ------------------------------------------------------------------ */
/* Option packs                                                        */
/* ------------------------------------------------------------------ */

/** Act 2 · what leaves in the first 72 hours. Order of selection is the insight. */
export const FIRST_72: Record<Currency, Choice[]> = {
  NGN: [
    { value: "rent", label: "Rent or housing" },
    { value: "school_fees", label: "School fees" },
    { value: "debt", label: "Paying back what I borrowed" },
    { value: "family", label: "Family or people who depend on me" },
    { value: "food", label: "Food shopping for the month" },
    { value: "transport", label: "Transport or fuel" },
    { value: "tithe", label: "Tithe or offering" },
    { value: "data", label: "Data and airtime" },
    { value: "subs", label: "Subscriptions" },
    { value: "savings", label: "Savings" },
    { value: "self", label: "Something for myself" },
  ],
  USD: [
    { value: "rent", label: "Rent or mortgage" },
    { value: "debt", label: "Credit card or loan payment" },
    { value: "family", label: "Family I support" },
    { value: "food", label: "Groceries" },
    { value: "transport", label: "Gas or commute" },
    { value: "childcare", label: "Childcare" },
    { value: "insurance", label: "Insurance" },
    { value: "subs", label: "Subscriptions" },
    { value: "savings", label: "Savings" },
    { value: "self", label: "Something for myself" },
  ],
};

/** Act 2 · unplanned events. Tests the lumpiness hypothesis (H3). */
export const SHOCKS: Record<Currency, Choice[]> = {
  NGN: [
    { value: "vehicle", label: "Vehicle or transport repair" },
    { value: "health", label: "Health or medical" },
    { value: "family_emergency", label: "Family emergency" },
    { value: "school", label: "School or tuition" },
    { value: "event", label: "A gift, wedding or funeral" },
    { value: "device", label: "Phone or device" },
    { value: "rent_increase", label: "Rent increase" },
    { value: "income_change", label: "Job or income change" },
    { value: "none", label: "None of these", exclusive: true },
  ],
  USD: [
    { value: "vehicle", label: "Car repair" },
    { value: "health", label: "Health or medical" },
    { value: "family_emergency", label: "Family emergency" },
    { value: "school", label: "School or tuition" },
    { value: "event", label: "A gift, wedding or funeral" },
    { value: "device", label: "Phone or device" },
    { value: "rent_increase", label: "Rent increase" },
    { value: "income_change", label: "Job or income change" },
    { value: "none", label: "None of these", exclusive: true },
  ],
};

/** Act 3 · the coping repertoire. Every item here is an incumbent competitor. */
export const COPING: Record<Currency, Choice[]> = {
  NGN: [
    { value: "borrow_people", label: "Borrow from friends or family" },
    { value: "loan_app", label: "Use a loan app" },
    { value: "salary_advance", label: "Ask for a salary advance at work" },
    { value: "ajo", label: "Draw from ajo, esusu or a contribution" },
    { value: "vendor_credit", label: "Buy on credit from a shop or vendor" },
    { value: "sell", label: "Sell something" },
    { value: "savings", label: "Use my savings" },
    { value: "delay_bill", label: "Delay a bill" },
    { value: "eat_less", label: "Eat less or eat cheaper" },
    { value: "stay_home", label: "Cut transport, stay home" },
    { value: "wait", label: "Just wait it out", exclusive: true },
  ],
  USD: [
    { value: "credit_card", label: "Credit card" },
    { value: "bnpl", label: "Buy now, pay later" },
    { value: "overdraft", label: "Overdraft my account" },
    { value: "cash_advance_app", label: "Cash advance app" },
    { value: "payday_loan", label: "Payday loan" },
    { value: "borrow_people", label: "Borrow from friends or family" },
    { value: "salary_advance", label: "Ask work for an advance" },
    { value: "sell", label: "Sell something" },
    { value: "savings", label: "Use my savings" },
    { value: "delay_bill", label: "Delay a bill" },
    { value: "eat_less", label: "Cut back on food" },
    { value: "wait", label: "Just wait it out", exclusive: true },
  ],
};

/** Coping options that constitute borrowing — gates the treadmill branch. */
export const BORROW_VALUES = new Set([
  "borrow_people",
  "loan_app",
  "salary_advance",
  "vendor_credit",
  "credit_card",
  "bnpl",
  "overdraft",
  "cash_advance_app",
  "payday_loan",
]);

/** Coping options where the user absorbs the shortfall by going without. */
export const ABSORB_VALUES = new Set([
  "eat_less",
  "stay_home",
  "delay_bill",
  "sell",
  "wait",
]);

/** Act 4 · how they track today. "In my head" is the real market leader. */
export const TRACKING: Record<Currency, Choice[]> = {
  NGN: [
    { value: "head", label: "In my head" },
    { value: "notes", label: "Notes app" },
    { value: "spreadsheet", label: "A spreadsheet" },
    { value: "bank_app", label: "My bank's app" },
    { value: "budget_app", label: "A budgeting app" },
    { value: "notebook", label: "A physical notebook" },
    { value: "partner", label: "My partner handles it" },
    { value: "none", label: "I don't really track it" },
  ],
  USD: [
    { value: "head", label: "In my head" },
    { value: "notes", label: "Notes app" },
    { value: "spreadsheet", label: "A spreadsheet" },
    { value: "bank_app", label: "My bank's app" },
    { value: "budget_app", label: "A budgeting app" },
    { value: "notebook", label: "A physical notebook" },
    { value: "partner", label: "My partner handles it" },
    { value: "none", label: "I don't really track it" },
  ],
};

/** Tracking answers that count as "uses a tool" for the adaptive follow-up. */
export const USES_TOOL = new Set([
  "notes",
  "spreadsheet",
  "bank_app",
  "budget_app",
  "notebook",
]);

/**
 * Act 4 · homemade mechanisms.
 * The most under-asked question in consumer fintech: every item here is a
 * feature someone already wants badly enough to build by hand.
 */
export const MECHANISMS: Record<Currency, Choice[]> = {
  NGN: [
    { value: "separate_account", label: "Keep money in a separate account so I don't touch it" },
    { value: "pay_all_payday", label: "Pay everything the day I'm paid" },
    { value: "someone_holds", label: "Give money to someone to hold for me" },
    { value: "ajo", label: "Ajo, esusu or a savings group" },
    { value: "cash_apart", label: "Keep some as cash, away from the app" },
    { value: "auto_save", label: "Automatic savings" },
    { value: "bulk_buy", label: "Buy in bulk early in the month" },
    { value: "separate_spend", label: "Use a separate account for spending" },
    { value: "none", label: "None of these", exclusive: true },
  ],
  USD: [
    { value: "separate_account", label: "Keep money in a separate account so I don't touch it" },
    { value: "pay_all_payday", label: "Pay everything the day I'm paid" },
    { value: "someone_holds", label: "Give money to someone to hold for me" },
    { value: "auto_save", label: "Automatic transfers to savings" },
    { value: "cash_apart", label: "Keep some as cash, away from the card" },
    { value: "envelopes", label: "Envelope or category budgeting" },
    { value: "bulk_buy", label: "Buy in bulk early in the month" },
    { value: "separate_spend", label: "Use a separate card for spending" },
    { value: "none", label: "None of these", exclusive: true },
  ],
};

/** Human-readable labels for mechanisms, used in reflections and results. */
export const MECHANISM_SHORT: Record<string, string> = {
  separate_account: "keeping money in a separate account",
  pay_all_payday: "paying everything on payday",
  someone_holds: "having someone hold money for you",
  ajo: "your ajo or savings group",
  cash_apart: "keeping cash apart",
  auto_save: "automatic savings",
  bulk_buy: "buying in bulk early",
  separate_spend: "a separate spending account",
  envelopes: "envelope budgeting",
};

/** Act 6 · salary bands. Skippable. Only used to cross-tab the adequacy hypothesis. */
export const SALARY_BANDS: Record<Currency, Choice[]> = {
  NGN: [
    { value: "u100", label: "Under ₦100,000" },
    { value: "100_250", label: "₦100,000 – ₦250,000" },
    { value: "250_500", label: "₦250,000 – ₦500,000" },
    { value: "500_1m", label: "₦500,000 – ₦1,000,000" },
    { value: "1m_2m", label: "₦1,000,000 – ₦2,000,000" },
    { value: "o2m", label: "Over ₦2,000,000" },
    { value: "skip", label: "Prefer not to say" },
  ],
  USD: [
    { value: "u2k", label: "Under $2,000" },
    { value: "2k_4k", label: "$2,000 – $4,000" },
    { value: "4k_7k", label: "$4,000 – $7,000" },
    { value: "7k_10k", label: "$7,000 – $10,000" },
    { value: "10k_15k", label: "$10,000 – $15,000" },
    { value: "o15k", label: "Over $15,000" },
    { value: "skip", label: "Prefer not to say" },
  ],
};

/** Salary bands considered low for their market — one input to the adequacy signal. */
export const LOW_SALARY_BANDS = new Set(["u100", "100_250", "u2k", "2k_4k"]);

/** Act 2 · the expense they can't cut. */
export const CANT_CUT: Record<Currency, Choice[]> = {
  NGN: [
    { value: "family", label: "Supporting family" },
    { value: "rent", label: "Rent" },
    { value: "school_fees", label: "School fees" },
    { value: "transport", label: "Transport or fuel" },
    { value: "food", label: "Food" },
    { value: "debt", label: "Loan repayments" },
    { value: "data", label: "Data and airtime" },
    { value: "power", label: "Power, fuel or generator" },
    { value: "health", label: "Health or medication" },
    { value: "other", label: "Something else", opensText: true },
  ],
  USD: [
    { value: "family", label: "Supporting family" },
    { value: "rent", label: "Rent or mortgage" },
    { value: "childcare", label: "Childcare" },
    { value: "transport", label: "Car or commute" },
    { value: "food", label: "Food" },
    { value: "debt", label: "Loan or card repayments" },
    { value: "health", label: "Health or medication" },
    { value: "insurance", label: "Insurance" },
    { value: "phone", label: "Phone and internet" },
    { value: "other", label: "Something else", opensText: true },
  ],
};

export function pack<T>(map: Record<Currency, T>, c: Currency): T {
  return map[c] ?? map.NGN;
}
