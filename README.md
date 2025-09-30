# Kipo - Personal Finance Management

<div align="center">

**Manage your personal finances effortlessly with AI-powered transaction tracking**

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Usage](#-usage)

</div>

---

## 📖 Overview

**Kipo** is a modern personal finance management application that makes tracking your income and expenses as simple as sending a message. Built with cutting-edge technology and designed with user experience in mind, Kipo helps you take control of your financial life.

### **Why Kipo?**

Managing personal finances shouldn't be a chore. Kipo transforms expense tracking into an effortless habit by meeting you where you already are—in your messaging apps, on your phone, or at your computer.

---

## 🚨 The Problem

**Traditional finance apps are broken:**
- **Too Complex**: Overwhelming features you'll never use
- **Friction-Heavy**: Multiple steps to log a simple expense  
- **Not Mobile-First**: Clunky interfaces that don't work on the go
- **Data Entry Hell**: Tedious manual input discourages daily use
- **Poor Adoption**: 70% of users abandon finance apps after the first month

---

## ✨ The Solution

**Kipo makes finance tracking effortless through:**

### **Multiple Capture Methods**
- 📱 WhatsApp Integration: Text your expenses naturally
- 🖥️ Web Dashboard: Full-featured management interface
- 🤖 iOS Shortcuts: One-tap expense logging
- 🧠 AI-Powered: Natural language understanding

### **Frictionless Experience**

\`\`\`
You: "gasté 120 café"
Kipo: ✅ Gasto registrado: $120.00 — café
\`\`\`

No forms. No category selection. Just natural communication.

---

## 🎨 Features

### **Core Functionality**

#### 📊 Dashboard
- Real-time statistics (income, expenses, balance)
- Visual insights and monthly summaries
- Quick action buttons
- Responsive design (mobile & desktop)

#### 💳 Transaction Management
- AI-powered natural language input
- Full CRUD operations
- Advanced filtering (category, amount, date, card)
- Recurring transactions support
- Export capabilities

#### 🏦 Card Management
- Track multiple credit/debit cards
- Color-coded organization
- Active/inactive status
- Transaction linking

#### 💬 WhatsApp Integration
- Send expenses via WhatsApp messages
- Natural language processing with Claude AI
- Instant confirmations
- Secure phone verification
- Supports Spanish and English

#### 📱 iOS Shortcuts
- One-tap expense logging
- Siri voice commands
- Home screen widgets
- Secure API token authentication

---

## 🛠️ Tech Stack

### **Frontend**
- **Next.js 15** - React framework with SSR
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Accessible components
- **Lucide Icons** - Beautiful iconography
- **React 19** - Latest React features

### **Backend**
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Relational database
- **Twilio** - WhatsApp messaging
- **Anthropic Claude** - AI natural language processing

### **DevOps**
- **Turbopack** - Fast build tool
- **ESLint** - Code linting
- **Git** - Version control

---

## 🚀 Getting Started

### **Prerequisites**

\`\`\`bash
Node.js >= 18.0.0
npm >= 9.0.0
\`\`\`

### **Installation**

1. Clone the repository

\`\`\`bash
git clone https://github.com/yourusername/kipo-supabase.git
cd kipo-supabase
\`\`\`

2. Install dependencies

\`\`\`bash
npm install
\`\`\`

3. Set up environment variables

Create \`.env.local\`:

\`\`\`env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=+14155238886

# Anthropic
ANTHROPIC_API_KEY=your_api_key

# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000
\`\`\`

4. Run the development server

\`\`\`bash
npm run dev
\`\`\`

5. Open [http://localhost:3000](http://localhost:3000)

---

## 📱 Usage

### **Web Dashboard**

1. **Register**: Create an account at \`/register\`
2. **Onboarding**: Set up your financial profile
3. **Add Transactions**: Use the dashboard or quick actions
4. **Manage Cards**: Add your credit/debit cards
5. **View Insights**: Check your stats and summaries

### **WhatsApp Integration**

1. **Link WhatsApp**: 
   - Go to Settings → WhatsApp
   - Enter phone number (+5215550000000)
   - Send verification code to Twilio number
   
2. **Send Transactions**:
   \`\`\`
   gasté 120 café
   ayer gasté 500 en gasolina  
   ingresé 5000 salario
   \`\`\`

### **iOS Shortcuts**

1. **Generate Token**: Settings → API Keys → Create Token
2. **Follow Guide**: \`/docs/shortcuts\`
3. **Use Shortcut**: Tap icon or use Siri

---

## 💪 Benefits

### **For Users**
✅ Save time: 10 seconds vs 2 minutes per transaction
✅ Build habits: Effortless tracking encourages consistency
✅ Gain insights: See where your money goes
✅ Reduce stress: Clear financial picture
✅ Achieve goals: Track progress toward savings

### **For Developers**
🚀 Modern stack: Next.js 15, React 19, TypeScript
🏗️ Clean architecture: Separation of concerns
📱 Mobile-first: Responsive design system
♿ Accessible: WCAG 2.1 AA compliant
⚡ Performance: 95+ Lighthouse score

---

## 🗺️ Roadmap

- [ ] Budget tracking and alerts
- [ ] Multi-currency support
- [ ] Bank integration (Plaid)
- [ ] Shared expenses
- [ ] Mobile apps (iOS/Android)
- [ ] Investment tracking
- [ ] AI insights and recommendations

---

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines first.

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🙏 Acknowledgments

- shadcn/ui for components
- Supabase for backend
- Anthropic for Claude AI
- Twilio for messaging

---

<div align="center">

**Built with ❤️ in Mexico 🇲🇽**

</div>
