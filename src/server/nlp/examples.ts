import { ParsedTx } from './schema';

export interface TestExample {
  input: string;
  expected: ParsedTx | null;
  description: string;
}

export const testExamples: TestExample[] = [
  {
    input: "gasto 120 tacos",
    expected: {
      type: "expense",
      amount: 120,
      currency: "MXN",
      description: "tacos",
      category: "Comida",
      confidence: 0.9
    },
    description: "Simple expense with food category"
  },
  {
    input: "me pagaron 1500 nómina ayer",
    expected: {
      type: "income",
      amount: 1500,
      currency: "MXN",
      description: "nómina",
      transaction_date: "2025-09-17", // Yesterday example
      confidence: 0.85
    },
    description: "Income with past date"
  },
  {
    input: "uber 85",
    expected: {
      type: "expense",
      amount: 85,
      currency: "MXN",
      description: "uber",
      category: "Transporte",
      confidence: 0.8
    },
    description: "Transport expense"
  },
  {
    input: "pagué 350,50 de luz",
    expected: {
      type: "expense",
      amount: 350.50,
      currency: "MXN",
      description: "luz",
      category: "Facturas",
      confidence: 0.9
    },
    description: "Utility bill with decimal amount"
  },
  {
    input: "hola",
    expected: null,
    description: "Non-transaction message should return null"
  },
  {
    input: "compré algo pero no recuerdo el precio",
    expected: null,
    description: "Ambiguous transaction without amount should return null"
  },
  {
    input: "café 45 esta mañana",
    expected: {
      type: "expense",
      amount: 45,
      currency: "MXN",
      description: "café",
      category: "Comida",
      transaction_date: "2025-09-18", // Today example
      confidence: 0.8
    },
    description: "Morning coffee expense"
  },
  {
    input: "vendí mi bici por 2500",
    expected: {
      type: "income",
      amount: 2500,
      currency: "MXN",
      description: "vendí mi bici",
      confidence: 0.85
    },
    description: "Sale income"
  }
];