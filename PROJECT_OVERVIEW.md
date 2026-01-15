# Q-app - Project Overview

## 🎯 What is Q-app?

Q-app is a comprehensive test preparation platform designed for students preparing for competitive exams. It provides a complete ecosystem for creating, taking, and analyzing practice tests.

## 🏗️ Architecture

### Frontend Stack
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Icon library

### Key Libraries
- **PDF.js** - PDF rendering and manipulation
- **JSZip** - Test package compression
- **File-saver** - Export functionality
- **UUID** - Unique ID generation

### Optional Integrations
- **Supabase** - Cloud database and authentication
- **Auth0** - Advanced authentication
- **Google Gemini** - AI-powered analysis

## 📁 Project Structure

```
q-app/
├── components/           # React components
│   ├── mapper/          # PDF question mapping
│   ├── taker/           # Test taking interface
│   ├── AuthInterface.tsx
│   ├── HistoryInterface.tsx
│   ├── ProgressInterface.tsx
│   ├── TestSeriesInterface.tsx
│   └── NeuralAuditInterface.tsx
├── context/             # React context providers
│   ├── AppContext.tsx   # Mapper state management
│   └── taker/           # Taker context
├── utils/               # Utility functions
│   ├── cloud.ts         # Supabase integration
│   └── db.ts            # IndexedDB wrapper
├── App.tsx              # Main app component
├── types.ts             # TypeScript definitions
├── index.tsx            # App entry point
├── index.html           # HTML template
├── index.css            # Global styles
├── .env.local           # Environment variables
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript config
└── vite.config.ts       # Vite config
```

## 🎨 Component Overview

### Main App (`App.tsx`)
- Central routing and state management
- Sidebar navigation
- Mode switching between interfaces

### PDF Question Mapper
**Components:** `MapperInterface.tsx`, `mapper/PDFCanvas.tsx`, `mapper/Sidebar.tsx`

**Features:**
- Upload and render PDF files
- Crop question regions
- Annotate with metadata (difficulty, topic, marks)
- Export encrypted test packages

### Test Taker Interface
**Components:** `TakerInterface.tsx`, `taker/IntelligenceCanvas.tsx`

**Features:**
- Load test packages
- Timer-based test taking
- Question navigation
- Answer submission
- Real-time analytics

### Test Analysis
**Component:** `taker/TestAnalysis.tsx`

**Features:**
- Detailed performance breakdown
- Question-wise analysis
- Time management insights
- Accuracy metrics

### History Interface
**Component:** `HistoryInterface.tsx`

**Features:**
- View past test attempts
- Filter and search
- Re-analyze previous tests
- Track progress over time

### Progress Interface
**Component:** `ProgressInterface.tsx`

**Features:**
- Performance trends
- Subject-wise breakdown
- Streak tracking
- Goal setting

### Test Series Manager
**Component:** `TestSeriesInterface.tsx`

**Features:**
- Create test series
- Schedule tests
- Track completion
- Series analytics

### Neural Audit
**Component:** `NeuralAuditInterface.tsx`

**Features:**
- AI-powered mistake analysis
- Pattern recognition
- Personalized recommendations
- Study optimization

## 🔄 Data Flow

### Local Storage
- Test history
- User preferences
- Cached test packages (small)

### IndexedDB
- Large test packages
- Series data
- Offline storage

### Supabase (Optional)
- User profiles
- Cloud-synced history
- Global leaderboards
- Cross-device sync

## 🎨 Design System

### Colors
- **Background:** `#09090b` (zinc-950)
- **Surface:** `#18181b` (zinc-900)
- **Border:** `#27272a` (zinc-800)
- **Text Primary:** `#e4e4e7` (zinc-200)
- **Text Secondary:** `#a1a1aa` (zinc-400)

### Typography
- **Sans:** Inter
- **Mono:** JetBrains Mono

### Spacing
- Base unit: 4px (Tailwind default)
- Consistent padding/margin scale

## 🔐 Security

### Test Package Encryption
- AES-256 encryption for test packages
- Password-based encryption
- Prevents answer leakage

### API Key Management
- Environment variables only
- Never committed to version control
- Separate keys for dev/prod

### Data Privacy
- Local-first architecture
- Optional cloud sync
- User data control

## 🚀 Performance

### Optimizations
- Lazy loading for heavy components
- PDF rendering on-demand
- IndexedDB for large data
- Minimal re-renders with React optimization

### Bundle Size
- Code splitting by route
- Tree-shaking unused code
- Optimized production builds

## 🧪 Testing Strategy

### Manual Testing
- Cross-browser compatibility
- Mobile responsiveness
- PDF rendering accuracy
- Timer precision

### User Testing
- Test creation workflow
- Test taking experience
- Analytics accuracy
- UI/UX feedback

## 🔮 Future Enhancements

### Planned Features
- Mobile app (React Native)
- Collaborative test creation
- Live test sessions
- Video solutions integration
- Advanced analytics dashboard
- Spaced repetition system

### Technical Improvements
- Unit tests with Jest
- E2E tests with Playwright
- Performance monitoring
- Error tracking
- Analytics integration

## 📊 Key Metrics

### Performance Targets
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Lighthouse Score: > 90

### User Experience
- Test load time: < 2s
- PDF render time: < 3s
- Answer save latency: < 100ms

## 🛠️ Development Workflow

### Local Development
```bash
npm install      # Install dependencies
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
```

### Code Style
- TypeScript strict mode
- ESLint for linting
- Prettier for formatting
- Consistent naming conventions

### Git Workflow
- Feature branches
- Descriptive commit messages
- Pull request reviews
- Semantic versioning

## 📚 Learning Resources

### Technologies Used
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Supabase Docs](https://supabase.com/docs)

### Best Practices
- Component composition
- State management patterns
- TypeScript best practices
- Accessibility guidelines

---

**Built with ❤️ for students preparing for competitive exams**
