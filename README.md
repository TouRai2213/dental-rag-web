# Dental RAG Web Interface

Production-ready web interface for the Dental RAG (Retrieval-Augmented Generation) system for professional dental X-ray cephalometric analysis.

## 📋 Overview

This project provides a modern, ChatGPT-like web interface for dental professionals to:

- **🔬 Cephalometric Analysis**: AI-powered analysis of dental X-rays and cephalometric measurements
- **💬 Interactive Chat Interface**: Conversational AI for dental consultations and analysis
- **📚 Literature Search**: RAG-powered search through dental literature and research papers
- **📊 Patient Data Management**: Upload, store, and analyze patient dental records
- **📈 Evidence-Based Reports**: Generate comprehensive reports based on analysis results
- **👥 User Management**: Role-based access control for dental professionals

## 🛠 Technology Stack

- **Frontend**: Next.js 15+ with TypeScript
- **UI Framework**: Tailwind CSS + shadcn/ui components
- **State Management**: TanStack Query + Zustand (planned)
- **Authentication**: NextAuth.js (planned)
- **Backend Integration**: FastAPI (existing dental RAG backend)
- **Database**: PostgreSQL + Chroma Vector DB
- **File Processing**: OCR services for document processing
- **AI/ML**: OpenAI GPT-4, Google Gemini support

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Git
- Access to the Dental RAG backend API

### Installation

1. **Clone and setup**
   ```bash
   git clone <repository-url>
   cd epic-rag-web
   npm install
   ```

2. **Environment configuration**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Visit the application**
   Open [http://localhost:3000](http://localhost:3000)

### Development Scripts

```bash
# Development
npm run dev          # Start development server
npm run turbo        # Start with Turbo mode
npm run build        # Production build
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix linting issues
npm run format       # Format code with Prettier
npm run type-check   # TypeScript type checking
npm run check-all    # Run all quality checks

# Testing (when implemented)
npm run test         # Run tests
npm run test:watch   # Watch mode
npm run e2e          # End-to-end tests

# Utilities
npm run clean        # Clean build artifacts
npm run analyze      # Bundle analysis
```

## 📁 Project Structure

```
epic-rag-web/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── (auth)/         # Authentication routes
│   │   ├── (main)/         # Main application routes
│   │   └── api/            # API routes
│   ├── components/         # React components
│   │   ├── ui/            # shadcn/ui components
│   │   └── ...            # Custom components
│   ├── hooks/             # Custom React hooks
│   └── lib/               # Utility functions
├── public/                # Static assets
├── .claude/               # CCPM project management
└── docs/                  # Documentation (planned)
```

## 🔧 Configuration

### Environment Variables

Key environment variables (see `.env.example` for full list):

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
API_KEY=your_api_key_here

# AI Services
OPENAI_API_KEY=your_openai_key
GOOGLE_AI_API_KEY=your_google_key

# Database
DATABASE_URL=postgresql://...
CHROMA_HOST=localhost
```

### Development Tools

- **ESLint**: Configured with Next.js, TypeScript, and Prettier rules
- **Prettier**: Code formatting with consistent style
- **TypeScript**: Strict type checking enabled
- **Tailwind CSS**: Utility-first styling with custom configuration

## 🏗 Development Workflow

### Project Management

This project uses CCPM (Claude Code Project Management):

- **Epic**: [rag-web](/.claude/epics/rag-web/epic.md)
- **Tasks**: [.claude/epics/rag-web/](./.claude/epics/rag-web/)
- **Issues**: Tracked via GitHub Issues integration

### Code Quality

- **Linting**: ESLint with strict TypeScript rules
- **Formatting**: Prettier with consistent configuration
- **Pre-commit hooks**: Husky + lint-staged (planned)
- **Type checking**: Strict TypeScript configuration

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/your-feature-name
```

## 🧪 Testing Strategy

### Testing Stack (Planned)

- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: Jest + MSW
- **E2E Tests**: Playwright
- **Visual Tests**: Chromatic + Storybook

### Test Commands

```bash
npm run test           # Unit tests
npm run test:coverage  # Coverage report
npm run e2e            # End-to-end tests
npm run storybook      # Component documentation
```

## 📚 API Integration

### Backend Services

- **Dental RAG API**: Primary backend for AI analysis
- **OCR Service**: Document processing
- **Vector Database**: Semantic search capabilities
- **Authentication**: User management and sessions

### API Routes

```
/api/proxy/           # Backend API proxy
/api/auth/           # Authentication endpoints
/api/upload/         # File upload handling
```

## 🔒 Security & Privacy

- Environment variable validation
- API key protection
- CORS configuration
- Rate limiting
- Secure file upload handling
- HIPAA compliance considerations for patient data

## 📈 Performance Optimization

- Next.js App Router with streaming
- Image optimization
- Bundle analysis and code splitting
- Caching strategies
- Database query optimization

## 🚢 Deployment

### Production Build

```bash
npm run build
npm run start
```

### Environment-specific Builds

- **Development**: Full debugging and hot reload
- **Staging**: Production-like with debug info
- **Production**: Optimized build with monitoring

### Docker Support (Planned)

```bash
npm run docker:build
npm run docker:run
```

## 🤝 Contributing

1. Follow the code style guidelines (ESLint + Prettier)
2. Write tests for new features
3. Update documentation for API changes
4. Use conventional commit messages
5. Ensure all quality checks pass

### Code Style

- TypeScript strict mode
- Functional components with hooks
- Consistent file and folder naming
- Component composition over inheritance

## 📊 Development Status

**Current Phase**: Issue #4 - Database Schema & API Integration ✅ **COMPLETED**

**Completed**:
- ✅ Next.js 15 project structure
- ✅ ESLint configuration with strict rules
- ✅ Prettier code formatting
- ✅ Comprehensive development scripts
- ✅ Environment variable structure
- ✅ Enhanced .gitignore patterns
- ✅ Authentication system with NextAuth.js
- ✅ Chat interface UI components
- ✅ Excel upload functionality with patient data parsing
- ✅ API integration with remote analysis service
- ✅ Local backend setup with MySQL database
- ✅ Conversation persistence API routes
- ✅ Message formatting and display improvements
- ✅ Full conversation history management with local backend
- ✅ Hybrid architecture: Remote AI analysis + Local conversation storage

**In Progress**:
- 🔄 Testing and optimization

**Next Steps**:
- 🔄 Document selection and weighting
- 🔄 Export functionality
- 🔄 Deployment configuration

See the [Epic Status](/.claude/epics/rag-web/epic.md) for detailed progress.

## 📞 Support

For development questions or issues:

1. Check the [Epic Documentation](/.claude/epics/rag-web/)
2. Review existing GitHub Issues
3. Create new issue with detailed description

## 📄 License

[Add your license here]

---

> **Note**: This is a professional dental analysis system. Ensure compliance with healthcare regulations (HIPAA, etc.) when handling patient data.
