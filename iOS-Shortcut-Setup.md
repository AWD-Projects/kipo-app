# Kipo iOS Shortcuts Setup Guide

This guide will help you configure iOS Shortcuts to add expenses and income directly to your Kipo app from your iPhone.

## Prerequisites

- ✅ iPhone with iOS 12 or later
- ✅ Shortcuts app installed (comes pre-installed on iOS 13+)
- ✅ Your Kipo app deployed at: `https://kipo-app-sepia.vercel.app`
- ✅ Your API token: `92f2e8f6-57ca-4669-949b-57b722b4d347.90772f985c58d897c09e2833cffb29e99a1e027847cf0dff4bd1f36de49c1417`

## Part 1: Expense Shortcut (Registrar Gasto)

### Step 1: Create New Shortcut

1. Open the **Shortcuts** app on your iPhone
2. Tap the **"+"** button to create a new shortcut

### Step 2: Configure Basic Settings

1. Tap on the shortcut name at the top (probably says "Shortcut 1")
2. Change the name to: **"Registrar Gasto"**
3. Choose an icon: 💸 or 📉
4. Set a red color for the shortcut

### Step 3: Add Input Actions

#### 3.1 Get Transaction Amount
1. Tap **"Add Action"**
2. Search for **"Ask for Input"**
3. Configure:
   - **Prompt**: "¿Cuánto gastaste?"
   - **Input Type**: Number
   - **Allow Decimals**: ON
   - **Default Answer**: Leave empty

#### 3.2 Get Transaction Description
1. Tap **"+"** to add another action
2. Search for **"Ask for Input"** again
3. Configure:
   - **Prompt**: "¿En qué gastaste?"
   - **Input Type**: Text
   - **Default Answer**: Leave empty

#### 3.3 Choose Category
1. Tap **"+"** to add another action
2. Search for **"Choose from Menu"**
3. Configure menu options:
   - **Prompt**: "Selecciona categoría"
   - **Option 1**: "Comida y Restaurantes" → Set variable `Category` to `food`
   - **Option 2**: "Transporte" → Set variable `Category` to `transportation`
   - **Option 3**: "Compras" → Set variable `Category` to `shopping`
   - **Option 4**: "Entretenimiento" → Set variable `Category` to `entertainment`
   - **Option 5**: "Salud" → Set variable `Category` to `health`
   - **Option 6**: "Facturas y Servicios" → Set variable `Category` to `bills`
   - **Option 7**: "Educación" → Set variable `Category` to `education`
   - **Option 8**: "Otros" → Set variable `Category` to `other`

### Step 4: Set Up Variables for Each Category

For each menu option above, add a **"Set Variable"** action:

#### Under "Comida y Restaurantes":
- Add **"Set Variable"**
- **Variable Name**: `Category`
- **Value**: `food`

#### Under "Transporte":
- Add **"Set Variable"**
- **Variable Name**: `Category`
- **Value**: `transportation`

#### Under "Compras":
- Add **"Set Variable"**
- **Variable Name**: `Category`
- **Value**: `shopping`

#### Under "Entretenimiento":
- Add **"Set Variable"**
- **Variable Name**: `Category`
- **Value**: `entertainment`

#### Under "Salud":
- Add **"Set Variable"**
- **Variable Name**: `Category`
- **Value**: `health`

#### Under "Facturas y Servicios":
- Add **"Set Variable"**
- **Variable Name**: `Category`
- **Value**: `bills`

#### Under "Educación":
- Add **"Set Variable"**
- **Variable Name**: `Category`
- **Value**: `education`

#### Under "Otros":
- Add **"Set Variable"**
- **Variable Name**: `Category`
- **Value**: `other`

### Step 5: Create JSON Body

1. After the "Choose from Menu" action (outside all menu options), add: **"Text"**
2. Configure the text content as:

```json
{
  "amount": [Monto],
  "description": "[Descripción]",
  "type": "expense",
  "category": "[Category Variable]",
  "date": "[Current Date]"
}
```

**Important**: Replace the bracketed items with actual variables:
- `[Monto]`: Select the amount from Step 3.1
- `[Descripción]`: Select the description from Step 3.2
- `[Category Variable]`: Select the Category variable
- `[Current Date]`: Add "Current Date" action and format as "YYYY-MM-DD"

### Step 6: Make the API Call

1. Add action: **"Get Contents of URL"**
2. Configure:
   - **URL**: `https://kipo-app-sepia.vercel.app/api/entries`
   - **Method**: POST
   - **Headers**:
     - `Content-Type`: `application/json`
     - `Authorization`: `Bearer d65b2f17-ef18-4c9d-97f3-3df9562be1c6.958b171daa6c363f0cc0fdcce65a208c15935bc1806bd4c4e06f5818b4602749`
   - **Request Body**: Select the JSON text from previous step

### Step 7: Add Response Handling

#### 7.1 Show Success Message
1. Add action: **"Show Notification"**
2. Configure:
   - **Title**: "¡Gasto Registrado!"
   - **Body**: "Tu gasto se agregó exitosamente a Kipo"

#### 7.2 Handle Errors (Optional)
1. Wrap the API call in a **"Try"** action
2. Add **"Otherwise"** action for error handling
3. Add **"Show Notification"** in the error section:
   - **Title**: "Error"
   - **Body**: "No se pudo registrar el gasto. Verifica tu conexión."

### Step 8: Test the Expense Shortcut

1. Tap **"Done"** to save the shortcut
2. Run the shortcut by tapping it
3. Test with a sample expense:
   - **Amount**: 15.50
   - **Description**: "Café"
   - **Category**: "Comida y Restaurantes"

### Step 9: Add to Home Screen & Siri

#### Add to Home Screen
1. Tap the **"..."** on your shortcut
2. Tap **"Add to Home Screen"**
3. Keep the name as "Registrar Gasto"
4. Choose the 💸 icon
5. Tap **"Add"**

#### Add Siri Phrase
1. In shortcut settings, tap **"Add to Siri"**
2. Record a phrase like: **"Registrar gasto"** or **"Anotar gasto"**
3. Tap **"Done"**

---

## Part 2: Income Shortcut (Registrar Ingreso)

*Coming soon in the next section...*

---

## Troubleshooting

### Common Issues:

**"Request failed"**
- Check your internet connection
- Verify the API token is correct
- Ensure the URL is exactly: `https://kipo-app-sepia.vercel.app/api/entries`

**"Invalid JSON"**
- Double-check the JSON format in Step 5
- Ensure all variables are properly linked

**"Unauthorized"**
- Verify your API token is correctly added to the Authorization header
- Make sure the Bearer prefix is included

### Testing API Manually (Expense Example)
```json
{
  "amount": 25.50,
  "description": "Almuerzo",
  "type": "expense",
  "category": "food",
  "date": "2024-01-15"
}
```

## Security Notes

- Keep your API token secure and don't share it
- The token is stored locally in your Shortcuts app
- If you suspect the token is compromised, regenerate it in your Kipo dashboard

## Support

If you encounter issues:
1. Check the Kipo app dashboard to see if expenses are appearing
2. Verify your internet connection
3. Try recreating the shortcut from scratch
4. Check the iOS Shortcuts app for any error messages

---

**¡Disfruta usando tu shortcut de gastos de Kipo! 💸📱**