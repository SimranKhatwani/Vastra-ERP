# Vastra ERP Billing

Vastra ERP Billing is a modern, multi-tenant SaaS application specifically designed for the garment and retail industry. It provides an all-in-one comprehensive solution to manage retail operations from point of sale (POS) and inventory to accounting and employee commissions.

## Features

- **Billing & POS System**: Seamless and fast checkout experience tailored for garment retail, supporting multiple payment methods and quick invoice generation.
- **Inventory Management**: Real-time stock tracking, articulation windows, and low-stock alerts.
- **SaaS Admin Panel**: Multi-tenant architecture to seamlessly manage different stores, subscriptions, and integrations.
- **Accounting & Reports**: Comprehensive accounting tools with day-books, trial balances, and automated sales reporting.
- **Employee & Commission Tracking**: Automatically calculate sales commissions and manage staff performance.
- **Customer Relationship Management**: Built-in CRM to track customer purchase history and loyalty.
- **Purchasing & Supplier Management**: Manage vendors, purchase orders, and wholesale shipments easily.
- **Developer Portal**: Integrated API keys and Webhook management for custom integrations.

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Framer Motion
- **Icons**: Lucide React
- **Data & Integrations**: Google GenAI

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)

### Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   cd garment-retail-&-billing-saas
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Set up your environment variables. Copy `.env.example` to `.env.local` and add any necessary keys (like `GEMINI_API_KEY`).

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000` to view the application.

## Building for Production

To create a production-ready build:

```bash
npm run build
```

This will output optimized static assets into the `dist` directory, ready to be deployed to any static web host.

## License

This project is proprietary and intended for Vastra ERP Billing users.
