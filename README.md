# Mercato - Advanced Trading Platform

A sophisticated full-stack trading platform that empowers retail investors with institutional-grade tools to create, automate, and deploy trading strategies without coding expertise. Built with modern web technologies and real-time market data integration.

## 🚀 Project Overview

Mercato is a comprehensive no-code trading platform designed to democratize sophisticated algorithmic trading strategies. The platform features a modern React-based frontend built with Next.js and a robust backend API built with Node.js, TypeScript, and Prisma ORM for seamless strategy creation and portfolio management.

## 🏗️ Architecture

This repository contains both the frontend and backend components:

- **Frontend (`mercatoFrontend/`)**: Next.js 14 application with TypeScript, Tailwind CSS, and shadcn/ui components
- **Backend (`MercatoBackend/`)**: Node.js/Express API with TypeScript, Prisma ORM, Redis caching, and Firebase authentication

## ✨ Key Features

### Frontend Features
- 🎨 Modern, responsive UI with dark/light theme support
- 📊 Interactive strategy builder with drag-and-drop blocks
- 📈 Real-time market data visualization and charts
- 👤 User authentication and portfolio management
- 🔍 Asset discovery and market analysis tools
- 📱 Mobile-responsive design

### Backend Features
- 🔐 Firebase Authentication integration
- 📊 Real-time market data from multiple sources (Alpaca, FRED API)
- 🤖 Strategy execution and automation
- 💾 PostgreSQL database with Prisma ORM
- ⚡ Redis caching for performance optimization
- 🐳 Docker containerization
- 📊 Polymarket integration for prediction markets

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI
- **Charts**: Recharts
- **State Management**: React Context API
- **Authentication**: Firebase Auth

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis
- **Authentication**: Firebase Admin SDK
- **Market Data**: Alpaca API, FRED API
- **Containerization**: Docker

## 📁 Project Structure

```
├── mercatoFrontend/          # Next.js frontend application
│   ├── app/                 # App router pages and layouts
│   ├── components/          # Reusable React components
│   │   ├── ui/             # Base UI components (shadcn/ui)
│   │   ├── strategy/       # Strategy builder components
│   │   ├── charts/         # Chart components
│   │   └── dashboard/      # Dashboard-specific components
│   ├── lib/                # Utility functions and configurations
│   ├── hooks/              # Custom React hooks
│   └── styles/             # Global styles
│
└── MercatoBackend/          # Node.js backend API
    ├── src/
    │   ├── controllers/    # API route handlers
    │   ├── services/       # Business logic services
    │   ├── middlewares/    # Express middlewares
    │   ├── routes/         # API route definitions
    │   ├── utils/          # Utility functions
    │   └── workers/        # Background job workers
    ├── prisma/             # Database schema and migrations
    └── docker-compose.yml  # Development environment setup
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL
- Redis
- npm or pnpm

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd MercatoBackend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (create `.env` file based on `.env.example`)

4. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd mercatoFrontend
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Set up environment variables (create `.env.local` file)

4. Start the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Docker Setup (Alternative)

You can also run the entire stack using Docker:

```bash
cd MercatoBackend
docker-compose up -d
```

## 🔑 Key Components

### Strategy Builder
- Visual drag-and-drop interface for creating trading strategies
- Support for various asset classes (stocks, crypto, ETFs)
- Technical indicators and market data integration
- Real-time strategy validation and testing

### Market Data Integration
- Real-time and historical market data
- Support for multiple data providers
- Caching layer for optimal performance
- WebSocket connections for live updates

### User Management
- Secure authentication with Firebase
- User portfolio tracking
- Strategy sharing and collaboration
- Performance analytics

## 🤝 Contributing

This project was developed as part of a team effort. If you'd like to contribute or have questions about the implementation, please feel free to reach out.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🎯 Future Enhancements

- [ ] Advanced backtesting capabilities
- [ ] Machine learning-powered strategy recommendations
- [ ] Social trading features
- [ ] Mobile app development
- [ ] Integration with additional brokers and exchanges

---

**Note**: This repository showcases a comprehensive trading platform built with modern web technologies. The project demonstrates full-stack development skills, real-time data handling, complex state management, and scalable architecture design for financial applications.
