# Development Environment Setup

This guide provides detailed instructions for setting up the development environment for the Dental RAG Web Interface.

## Prerequisites

### Required Software

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher (comes with Node.js)
- **Git**: Latest version
- **VS Code**: Recommended IDE with extensions

### Recommended VS Code Extensions

Install these extensions for the best development experience:

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-json",
    "yoavbls.pretty-ts-errors",
    "usernamehw.errorlens",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-playwright.playwright"
  ]
}
```

## Environment Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd epic-rag-web
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

```bash
# Copy environment template
cp .env.example .env.local

# Edit environment variables
# Required variables:
# - NEXT_PUBLIC_API_URL: Backend API URL
# - OPENAI_API_KEY: OpenAI API key (if using)
# - GOOGLE_AI_API_KEY: Google AI API key (if using)
```

### 4. Verify Setup

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Formatting
npm run format:check

# Build test
npm run build
```

## Development Workflow

### Starting Development

```bash
# Standard development server
npm run dev

# Turbo mode (faster builds)
npm run turbo
```

### Code Quality Checks

```bash
# Run all quality checks
npm run check-all

# Individual checks
npm run type-check    # TypeScript compilation
npm run lint         # ESLint checking
npm run format:check # Prettier formatting
```

### Fixing Issues

```bash
# Auto-fix linting and formatting issues
npm run fix-all

# Individual fixes
npm run lint:fix     # Fix ESLint issues
npm run format       # Format with Prettier
```

## Code Style Guidelines

### TypeScript

- Use strict TypeScript configuration
- Prefer `interface` over `type` for object types
- Use proper type annotations for function parameters and returns
- Avoid `any` type - use `unknown` or proper typing instead

```typescript
// ✅ Good
interface UserProps {
  id: string
  name: string
  email: string
}

const getUser = async (id: string): Promise<UserProps> => {
  // implementation
}

// ❌ Bad
const getUser = async (id: any): any => {
  // implementation
}
```

### React Components

- Use functional components with hooks
- Prefer composition over inheritance
- Use proper TypeScript props interfaces
- Implement proper error boundaries

```typescript
// ✅ Good
interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
  onClick?: () => void
  disabled?: boolean
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  onClick,
  disabled = false,
}) => {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded-md',
        variant === 'primary' ? 'bg-blue-500 text-white' : 'bg-gray-200'
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
```

### File Organization

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Route groups
│   ├── (main)/
│   └── api/
├── components/            # Reusable components
│   ├── ui/               # shadcn/ui components
│   ├── forms/            # Form components
│   └── layout/           # Layout components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
│   ├── api.ts           # API utilities
│   ├── auth.ts          # Authentication
│   └── utils.ts         # General utilities
└── types/                # TypeScript type definitions
```

### Naming Conventions

- **Files**: kebab-case (`user-profile.tsx`)
- **Components**: PascalCase (`UserProfile`)
- **Variables/Functions**: camelCase (`getUserById`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Types/Interfaces**: PascalCase (`UserProps`)

## Testing Setup

### Unit Testing (Planned)

```bash
# Install testing dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# Run tests
npm run test
npm run test:watch
npm run test:coverage
```

### E2E Testing (Planned)

```bash
# Install Playwright
npm install --save-dev @playwright/test

# Run E2E tests
npm run e2e
npm run e2e:ui
```

## Debugging

### VS Code Debugging

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

### Browser DevTools

- **React Developer Tools**: For component inspection
- **Network Tab**: For API debugging
- **Console**: For runtime debugging
- **Performance Tab**: For performance analysis

## Performance Optimization

### Build Analysis

```bash
# Analyze bundle size
npm run analyze

# Server-side analysis
npm run analyze:server

# Client-side analysis
npm run analyze:browser
```

### Performance Monitoring

- Use Next.js built-in Web Vitals
- Implement custom performance metrics
- Monitor API response times
- Track user interactions

## Troubleshooting

### Common Issues

**Node.js version mismatch**
```bash
# Check Node.js version
node --version
# Should be 18.0.0 or higher

# Use nvm to manage Node.js versions
nvm use 18
```

**Dependency conflicts**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**TypeScript errors**
```bash
# Clear TypeScript cache
rm -rf .next
npm run type-check
```

**ESLint configuration issues**
```bash
# Clear ESLint cache
rm -rf .eslintcache
npm run lint
```

### Getting Help

1. Check the [main README.md](../README.md)
2. Review [ESLint configuration](../eslint.config.mjs)
3. Check [Prettier configuration](../.prettierrc)
4. Review [TypeScript configuration](../tsconfig.json)
5. Create an issue with detailed error information

## IDE Configuration

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  },
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

This setup ensures consistent development experience across the team.