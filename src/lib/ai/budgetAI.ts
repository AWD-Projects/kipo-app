/**
 * AI-Powered Budget Functions
 * Core AI logic for budget suggestions, predictions, and insights
 */

import { getOpenAIClient, isOpenAIConfigured } from './openai';

// Re-export for convenience
export { isOpenAIConfigured };

// ============================================================================
// Types
// ============================================================================

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  transaction_date: string;
  description?: string;
  card_id?: string;
}

export interface BudgetSuggestion {
  category: string;
  suggestedAmount: number;
  confidence: number;
  reasoning: string;
  historicalData: {
    avg: number;
    min: number;
    max: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  };
}

export interface BudgetPreferences {
  conservative?: boolean;
  includeReasons?: boolean;
  baseAmount?: number;
  categories?: string[];
}

export interface OverspendPrediction {
  budgetId: string;
  likelyToExceed: boolean;
  predictedAmount: number;
  confidenceLevel: number;
  daysUntilExceed?: number;
  recommendation: string;
}

export interface BudgetInsight {
  type: 'pattern' | 'opportunity' | 'warning' | 'achievement';
  title: string;
  description: string;
  actionable: boolean;
  recommendations: Array<{
    action: string;
    impact: number;
    difficulty: 'easy' | 'medium' | 'hard';
  }>;
}

// ============================================================================
// Budget Suggestion Engine
// ============================================================================

/**
 * Generate AI-powered budget suggestions based on spending history
 */
export async function generateBudgetSuggestions(
  userId: string,
  spendingHistory: Transaction[],
  preferences: BudgetPreferences = {}
): Promise<{
  suggestions: BudgetSuggestion[];
  totalSuggested: number;
  savingsPotential: number;
  aiInsights: string;
}> {
  if (!isOpenAIConfigured()) {
    throw new Error('OpenAI no está configurado. Por favor agrega OPENAI_API_KEY a tus variables de entorno.');
  }

  const openai = getOpenAIClient();

  // Analyze spending by category
  const categorySpending = analyzeSpendingByCategory(spendingHistory);

  const systemPrompt = `Eres un asesor financiero experto especializado en presupuestos personales para usuarios mexicanos.
Tu objetivo es analizar patrones de gasto y sugerir presupuestos realistas y alcanzables.

Contexto del usuario:
- Historial de transacciones de los últimos 3 meses
- Categorías de gasto principales
- Ingresos mensuales promedio

Debes proporcionar:
1. Presupuesto sugerido por categoría
2. Nivel de confianza (0-1)
3. Razonamiento claro en español
4. Oportunidades de ahorro

IMPORTANTE: Responde SOLO con JSON válido, sin texto adicional.

Formato de respuesta:
{
  "suggestions": [
    {
      "category": "string",
      "suggestedAmount": number,
      "confidence": number,
      "reasoning": "string",
      "historicalData": {
        "avg": number,
        "min": number,
        "max": number,
        "trend": "increasing|decreasing|stable"
      }
    }
  ],
  "totalSuggested": number,
  "savingsPotential": number,
  "aiInsights": "string"
}`;

  const userPrompt = `Analiza este historial de gastos y sugiere presupuestos mensuales:

Datos de categorías:
${JSON.stringify(categorySpending, null, 2)}

Preferencias:
${JSON.stringify(preferences, null, 2)}

Fecha actual: ${new Date().toISOString()}

Proporciona sugerencias de presupuesto realistas para el próximo mes. Considera:
- Inflación en México (~3.5% anual)
- Patrones de gasto
- Oportunidades de ahorro
- ${preferences.conservative ? 'Ser conservador en las estimaciones' : 'Ser realista pero optimista'}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Modelo más reciente y económico
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 2000,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result;
  } catch (error: any) {
    console.error('Error generating budget suggestions:', error);
    console.error('Error details:', {
      message: error?.message,
      status: error?.status,
      code: error?.code,
      type: error?.type
    });

    // Proporcionar un mensaje más específico basado en el error
    if (error?.code === 'insufficient_quota' || (error?.status === 429 && error?.message?.includes('quota'))) {
      throw new Error('Cuota de OpenAI excedida. Por favor verifica tu plan y métodos de pago en https://platform.openai.com/account/billing');
    } else if (error?.status === 401) {
      throw new Error('API key de OpenAI inválida o expirada');
    } else if (error?.status === 429) {
      throw new Error('Límite de solicitudes excedido. Intenta de nuevo en unos momentos');
    } else {
      throw new Error(error?.message || 'Error al generar sugerencias de presupuesto');
    }
  }
}

// ============================================================================
// Overspend Predictor
// ============================================================================

/**
 * Predict if a budget will be exceeded based on current spending velocity
 */
export async function predictOverspending(
  budgetId: string,
  budgetAmount: number,
  currentSpent: number,
  daysRemaining: number,
  recentTransactions: Transaction[]
): Promise<OverspendPrediction> {
  if (!isOpenAIConfigured()) {
    // Fallback to simple linear prediction if OpenAI not configured
    const dailyRate = currentSpent / (30 - daysRemaining);
    const predictedAmount = currentSpent + (dailyRate * daysRemaining);
    const likelyToExceed = predictedAmount > budgetAmount;

    return {
      budgetId,
      likelyToExceed,
      predictedAmount: Math.round(predictedAmount),
      confidenceLevel: 0.6,
      daysUntilExceed: likelyToExceed
        ? Math.floor((budgetAmount - currentSpent) / dailyRate)
        : undefined,
      recommendation: likelyToExceed
        ? 'Reduce tu gasto diario para mantenerte dentro del presupuesto'
        : 'Vas bien encaminado, continúa así'
    };
  }

  const openai = getOpenAIClient();

  const systemPrompt = `Eres un analista financiero especializado en predicción de gastos.
Analiza patrones de gasto y predice si un presupuesto será excedido.

IMPORTANTE: Responde SOLO con JSON válido.

Formato de respuesta:
{
  "budgetId": "string",
  "likelyToExceed": boolean,
  "predictedAmount": number,
  "confidenceLevel": number,
  "daysUntilExceed": number | null,
  "recommendation": "string"
}`;

  const userPrompt = `Predice si este presupuesto será excedido:

Budget ID: ${budgetId}
Monto del presupuesto: $${budgetAmount}
Gastado hasta ahora: $${currentSpent}
Días restantes en el período: ${daysRemaining}

Transacciones recientes (últimos 7 días):
${JSON.stringify(recentTransactions.slice(-10), null, 2)}

Analiza:
1. Velocidad de gasto (¿está acelerando o disminuyendo?)
2. Patrones temporales (días de la semana, etc.)
3. Probabilidad de exceder el presupuesto
4. Recomendación específica en español`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 500,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result;
  } catch (error: any) {
    console.error('Error predicting overspending:', error);
    console.error('Error details:', {
      message: error?.message,
      status: error?.status,
      code: error?.code
    });
    throw new Error(error?.message || 'Error al predecir sobregasto');
  }
}

// ============================================================================
// Insights Generator
// ============================================================================

/**
 * Generate AI insights about spending patterns and opportunities
 */
export async function generateInsights(
  userId: string,
  transactions: Transaction[],
  budgets: any[]
): Promise<BudgetInsight[]> {
  if (!isOpenAIConfigured()) {
    return [];
  }

  const openai = getOpenAIClient();

  const systemPrompt = `Eres un asesor financiero que identifica patrones de gasto y oportunidades de ahorro.
Analiza datos financieros y genera insights accionables en español.

IMPORTANTE: Responde SOLO con JSON válido.

Formato de respuesta:
{
  "insights": [
    {
      "type": "pattern|opportunity|warning|achievement",
      "title": "string",
      "description": "string",
      "actionable": boolean,
      "recommendations": [
        {
          "action": "string",
          "impact": number,
          "difficulty": "easy|medium|hard"
        }
      ]
    }
  ]
}`;

  const userPrompt = `Analiza estos datos y genera máximo 5 insights valiosos:

Transacciones (últimos 30 días):
${JSON.stringify(transactions.slice(-50), null, 2)}

Presupuestos actuales:
${JSON.stringify(budgets, null, 2)}

Genera insights sobre:
- Patrones de gasto inusuales
- Oportunidades de ahorro
- Logros alcanzados
- Tendencias preocupantes

Prioriza insights con mayor impacto financiero.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
      max_tokens: 1500,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result.insights || [];
  } catch (error: any) {
    console.error('Error generating insights:', error);
    console.error('Error details:', {
      message: error?.message,
      status: error?.status,
      code: error?.code
    });
    return [];
  }
}

// ============================================================================
// Natural Language Query Handler
// ============================================================================

/**
 * Handle natural language questions about budgets
 */
export async function handleBudgetQuery(
  userId: string,
  query: string,
  conversationHistory: Array<{ role: string; content: string }>,
  context: {
    budgets: any[];
    transactions: Transaction[];
    cards?: any[];
    savingsGoals?: any[];
    budgetAlerts?: any[];
    profile?: any;
    stats?: any;
  },
  queryContext: 'budgets' | 'savings' | 'general' = 'budgets'
): Promise<{
  response: string;
  data?: any;
  suggestedActions?: any[];
}> {
  if (!isOpenAIConfigured()) {
    throw new Error('OpenAI no está configurado');
  }

  const openai = getOpenAIClient();

  // Calcular estadísticas avanzadas
  const analytics = calculateAdvancedAnalytics(context);

  const systemPrompt = `Eres Kipo AI, un asistente financiero inteligente y experto en educación financiera para usuarios mexicanos.

Tu misión es ayudar a los usuarios de Kipo a:
1. **Entender sus finanzas** - Explicar de forma clara y educativa sus patrones de gasto, ingresos y comportamiento financiero
2. **Tomar mejores decisiones** - Proporcionar análisis basados en datos reales con recomendaciones accionables
3. **Alcanzar metas financieras** - Crear presupuestos inteligentes, metas de ahorro y estrategias personalizadas
4. **Educación financiera** - Enseñar conceptos financieros de forma práctica y accesible

## INFORMACIÓN COMPLETA DEL USUARIO:

### Resumen General:
- Total de transacciones: ${context.stats?.totalTransactions || 0}
- Presupuestos activos: ${context.stats?.totalBudgets || 0}
- Tarjetas registradas: ${context.stats?.totalCards || 0}
- Metas de ahorro activas: ${context.stats?.activeSavingsGoals || 0}
- Alertas sin leer: ${context.stats?.unreadAlerts || 0}

### Análisis Financiero:
${JSON.stringify(analytics, null, 2)}

### Datos Detallados:
- Presupuestos: ${JSON.stringify(context.budgets, null, 2)}
- Transacciones (últimos 6 meses): ${context.transactions.length} registros
- Tarjetas: ${JSON.stringify(context.cards, null, 2)}
- Metas de ahorro: ${JSON.stringify(context.savingsGoals, null, 2)}
- Alertas activas: ${JSON.stringify(context.budgetAlerts, null, 2)}

## CAPACIDADES QUE TIENES:

1. **Análisis de Gastos**:
   - Identificar patrones de gasto por categoría
   - Comparar gastos entre períodos
   - Detectar gastos inusuales o excesivos
   - Analizar tendencias de gasto

2. **Gestión de Presupuestos**:
   - Sugerir presupuestos basados en historial
   - Analizar cumplimiento de presupuestos
   - Alertar sobre sobregastos
   - Recomendar ajustes

3. **Educación Financiera**:
   - Explicar conceptos financieros (intereses, ahorro, inversión, etc.)
   - Dar consejos prácticos de ahorro
   - Enseñar buenas prácticas financieras
   - Responder dudas sobre finanzas personales

4. **Análisis de Datos**:
   - Calcular promedios, totales y porcentajes
   - Identificar categorías con mayor gasto
   - Comparar ingresos vs gastos
   - Proyectar tendencias futuras

5. **Funcionalidades de Kipo**:
   - Explicar cómo usar cada función de la app
   - Guiar en la creación de presupuestos y metas
   - Ayudar a entender reportes y estadísticas
   - Configurar alertas y notificaciones

## FORMATO DE RESPUESTA:

IMPORTANTE:
1. Usa **markdown** para formatear (negritas **, listas numeradas, bullets)
2. Sé claro, conciso y educativo
3. Incluye números y datos específicos cuando sea relevante
4. Si el usuario pregunta "cuánto he gastado", analiza TODAS sus transacciones
5. Responde SOLO con JSON válido

Estructura JSON:
{
  "response": "Tu respuesta en markdown con análisis detallado",
  "data": {
    // Datos estructurados relevantes (totales, promedios, etc.)
  },
  "suggestedActions": [
    {
      "label": "Texto descriptivo claro",
      "action": "create_budget|view_transactions|create_goal|view_budgets|view_cards|view_reports",
      "params": {}
    }
  ]
}

## EJEMPLOS DE ANÁLISIS:

Usuario pregunta: "¿Cuánto he gastado en comida?"
Respuesta: Analizar TODAS las transacciones de categoría "Alimentos", "Restaurantes", "Comida", sumar totales, calcular promedio mensual, comparar con presupuesto si existe, y dar recomendaciones específicas.

Usuario pregunta: "¿Por qué estoy gastando tanto?"
Respuesta: Identificar las TOP 5 categorías con mayor gasto, calcular porcentajes, comparar con ingresos, identificar gastos hormiga, y sugerir áreas de mejora.

Usuario pregunta: "¿Cómo puedo ahorrar más?"
Respuesta: Analizar patrones de gasto, identificar gastos innecesarios, sugerir presupuestos realistas, recomendar metas de ahorro específicas con montos y plazos.

Responde siempre con datos reales del usuario, sé específico y accionable.`;

  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-5), // Keep last 5 messages for context
      { role: 'user', content: query }
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages as any,
      response_format: { type: 'json_object' },
      temperature: 0.7, // Un poco menos aleatorio para respuestas más consistentes
      max_tokens: 2500, // Más tokens para análisis detallados
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result;
  } catch (error: any) {
    console.error('Error handling budget query:', error);
    console.error('Error details:', {
      message: error?.message,
      status: error?.status,
      code: error?.code
    });
    throw new Error(error?.message || 'Error al procesar tu pregunta');
  }
}

// ============================================================================
// Advanced Analytics Functions
// ============================================================================

/**
 * Calculate comprehensive financial analytics from user data
 */
function calculateAdvancedAnalytics(context: {
  budgets: any[];
  transactions: Transaction[];
  cards?: any[];
  savingsGoals?: any[];
  budgetAlerts?: any[];
  profile?: any;
  stats?: any;
}) {
  const { budgets, transactions, cards, savingsGoals } = context;

  // Separate income and expenses
  const expenses = transactions.filter(t => t.type === 'expense');
  const income = transactions.filter(t => t.type === 'income');

  // Total income and expenses
  const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
  const netBalance = totalIncome - totalExpenses;

  // Category breakdown
  const categoryTotals = new Map<string, number>();
  expenses.forEach(t => {
    const category = t.category || 'Sin categoría';
    categoryTotals.set(category, (categoryTotals.get(category) || 0) + t.amount);
  });

  // Convert to sorted array
  const topCategories = Array.from(categoryTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? (amount / totalExpenses * 100).toFixed(1) : '0'
    }));

  // Monthly averages (last 3 months)
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const recentExpenses = expenses.filter(t => new Date(t.transaction_date) >= threeMonthsAgo);
  const recentIncome = income.filter(t => new Date(t.transaction_date) >= threeMonthsAgo);

  const monthlyAvgExpenses = recentExpenses.reduce((sum, t) => sum + t.amount, 0) / 3;
  const monthlyAvgIncome = recentIncome.reduce((sum, t) => sum + t.amount, 0) / 3;

  // Budget compliance
  const budgetCompliance = budgets.filter(b => b.is_active).map(budget => {
    const budgetExpenses = expenses.filter(t => t.category === budget.category);
    const spent = budgetExpenses.reduce((sum, t) => sum + t.amount, 0);
    const percentage = budget.amount > 0 ? (spent / budget.amount * 100) : 0;

    return {
      category: budget.category,
      budgeted: budget.amount,
      spent,
      remaining: budget.amount - spent,
      percentage: percentage.toFixed(1),
      status: percentage >= 100 ? 'exceeded' : percentage >= 90 ? 'warning' : 'ok'
    };
  });

  // Savings rate
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1) : '0';

  // Card usage
  const cardUsage = cards?.map(card => {
    const cardTransactions = expenses.filter(t => t.card_id === card.id);
    const cardTotal = cardTransactions.reduce((sum, t) => sum + t.amount, 0);
    return {
      cardName: card.name,
      cardType: card.card_type,
      totalSpent: cardTotal,
      transactionCount: cardTransactions.length
    };
  }) || [];

  // Active savings goals progress
  const goalsProgress = savingsGoals?.filter((g: any) => g.status === 'active').map((goal: any) => ({
    goalName: goal.name,
    targetAmount: goal.target_amount,
    currentAmount: goal.current_amount,
    progress: goal.target_amount > 0 ? ((goal.current_amount / goal.target_amount) * 100).toFixed(1) : '0',
    remaining: goal.target_amount - goal.current_amount,
    deadline: goal.deadline
  })) || [];

  return {
    summary: {
      totalIncome,
      totalExpenses,
      netBalance,
      savingsRate: `${savingsRate}%`,
      monthlyAvgIncome: monthlyAvgIncome.toFixed(2),
      monthlyAvgExpenses: monthlyAvgExpenses.toFixed(2),
    },
    topCategories,
    budgetCompliance,
    cardUsage,
    goalsProgress,
    insights: {
      biggestExpenseCategory: topCategories[0]?.category || 'N/A',
      budgetsExceeded: budgetCompliance.filter(b => b.status === 'exceeded').length,
      budgetsAtRisk: budgetCompliance.filter(b => b.status === 'warning').length,
    }
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Remove outliers from array of numbers (BR-2: Remove top 5% and bottom 5%)
 */
function removeOutliers(amounts: number[]): number[] {
  if (amounts.length < 10) return amounts; // Need sufficient data

  const sorted = [...amounts].sort((a, b) => a - b);
  const bottomIndex = Math.floor(amounts.length * 0.05);
  const topIndex = Math.ceil(amounts.length * 0.95);

  return sorted.slice(bottomIndex, topIndex);
}

/**
 * Analyze spending by category
 */
function analyzeSpendingByCategory(transactions: Transaction[]) {
  const categoryMap = new Map<string, {
    total: number;
    count: number;
    amounts: number[];
  }>();

  // Only analyze expense transactions
  const expenses = transactions.filter(t => t.type === 'expense');

  expenses.forEach(transaction => {
    const category = transaction.category || 'Sin categoría';
    const existing = categoryMap.get(category) || { total: 0, count: 0, amounts: [] };

    existing.total += transaction.amount;
    existing.count += 1;
    existing.amounts.push(transaction.amount);

    categoryMap.set(category, existing);
  });

  const result: any = {};
  categoryMap.forEach((data, category) => {
    // BR-2: Remove outliers before analysis
    const filteredAmounts = removeOutliers(data.amounts);
    const filteredTotal = filteredAmounts.reduce((sum, amount) => sum + amount, 0);

    const avg = filteredAmounts.length > 0 ? filteredTotal / filteredAmounts.length : 0;
    const min = filteredAmounts.length > 0 ? Math.min(...filteredAmounts) : 0;
    const max = filteredAmounts.length > 0 ? Math.max(...filteredAmounts) : 0;

    // Simple trend analysis (compare first half vs second half)
    const midpoint = Math.floor(filteredAmounts.length / 2);
    const firstHalfAvg = filteredAmounts.slice(0, midpoint).reduce((a, b) => a + b, 0) / (midpoint || 1);
    const secondHalfAvg = filteredAmounts.slice(midpoint).reduce((a, b) => a + b, 0) / ((filteredAmounts.length - midpoint) || 1);

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (secondHalfAvg > firstHalfAvg * 1.1) trend = 'increasing';
    else if (secondHalfAvg < firstHalfAvg * 0.9) trend = 'decreasing';

    result[category] = {
      total: filteredTotal,
      count: filteredAmounts.length,
      avg,
      min,
      max,
      trend
    };
  });

  return result;
}
