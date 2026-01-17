import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { DigitalCockpit } from './components/DigitalCockpit';
import { AuthInterface } from './components/AuthInterface';
import { TakerInterface } from './components/taker/TakerInterface';

import { LecturesInterface } from './components/LecturesInterface';
import { PracticeInterface } from './components/PracticeInterface';
import { AnalysisInterface } from './components/AnalysisInterface';
import { PeerInterface } from './components/PeerInterface';
import { ToolsInterface } from './components/ToolsInterface';
import { Workspace } from './components/Workspace';
import { Sidebar } from './components/Sidebar';
import { QuestionArchiveInterface } from './components/QuestionArchiveInterface';
import { AdminGuard } from './components/AdminGuard';
import { SettingsInterface } from './components/SettingsInterface';
import { SubscriptionInterface } from './components/SubscriptionInterface';
import { CloudService, UserProfile } from './utils/cloud';
import { AppMode } from './types';
import { ThemeProvider } from './components/ThemeContext';
import { AdminInterface } from './components/admin/AdminInterface';

const App: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [preloadedPackage, setPreloadedPackage] = useState<{ name: string, data: string } | null>(null);

  // Taker and Analysis sub-modes are better handled with sub-routes or query params, 
  // but for now keeping state for simplicity if they are not full pages.
  // Actually, let's make them full pages or conditional renders within the route.
  const [practiceMode, setPracticeMode] = useState<'list' | 'taker'>('list');

  const navigate = useNavigate();
  const location = useLocation();

  // Auto-Auth Restore
  useEffect(() => {
    // If we already have a profile (e.g. Guest Mode), don't force re-auth check
    if (userProfile) return;

    const initAuth = async () => {
      const token = localStorage.getItem('supabase_token');
      if (token) {
        try {
          const profile = await CloudService.getProfile(token);
          if (profile) {
            setUserProfile(profile);
            if (location.pathname === '/auth') {
              navigate('/');
            }
          } else {
            navigate('/auth');
          }
        } catch (e) {
          localStorage.removeItem('supabase_token');
          navigate('/auth');
        }
      } else {
        if (location.pathname !== '/auth' && location.pathname !== '/admin' && location.pathname !== '/archive') {
          navigate('/auth');
        }
      }
      setIsAuthLoading(false);
    };
    initAuth();
  }, [navigate, location.pathname, userProfile]);

  const handleStartTest = (name: string, data: string) => {
    setPreloadedPackage({ name, data });
    setPracticeMode('taker');
    // In a real router app, maybe navigate to /practice/taker or something
    // For now we can keep PracticeInterface managing this internally or use conditional
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-theme-primary flex items-center justify-center transition-colors">
        <div className="w-12 h-12 border-2 border-theme-primary border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Wrapper for routes that need Sidebar
  const Layout = ({ children }: { children: React.ReactNode }) => (
    <div className="flex min-h-screen bg-theme-primary text-theme-primary font-sans selection:bg-zinc-200 dark:selection:bg-[#3c4043] overflow-hidden relative transition-colors">
      <Sidebar
        activeMode={location.pathname === '/' ? 'home' : location.pathname.slice(1) as AppMode}
        setMode={(mode) => navigate(mode === 'home' ? '/' : `/${mode}`)}
        userProfile={userProfile}
        onLogout={() => {
          localStorage.removeItem('supabase_token');
          setUserProfile(null);
          navigate('/auth');
        }}
      />
      <main className="flex-1 relative overflow-y-auto overflow-x-hidden h-screen bg-theme-primary transition-colors">
        {children}
      </main>
    </div>
  );

  return (
    <ThemeProvider>
      <Routes>
        <Route path="/auth" element={
          <AuthInterface
            onAuthSuccess={(p) => { setUserProfile(p); navigate('/'); }}
            onExit={() => {
              setUserProfile({
                id: 'guest',
                email: 'guest@understood.app',
                fullName: 'Guest Agent',
                targetExam: 'Preview Mode',
                joinedAt: new Date().toISOString()
              });
              navigate('/');
            }}
          />
        } />

        <Route path="/" element={<Layout><DigitalCockpit onResume={() => navigate('/lectures')} /></Layout>} />
        <Route path="/subscription" element={<SubscriptionInterface userProfile={userProfile} onExit={() => navigate('/')} />} />

        <Route path="/lectures" element={<Layout><LecturesInterface /></Layout>} />

        <Route path="/practice" element={
          <Layout>
            {practiceMode === 'taker' ? (
              <TakerInterface
                onExit={() => setPracticeMode('list')}
                initialPackage={preloadedPackage}
              />
            ) : (
              <PracticeInterface
                onExit={() => navigate('/')}
                onStartTest={handleStartTest}
              />
            )}
          </Layout>
        } />

        <Route path="/analysis" element={<Layout><AnalysisInterface /></Layout>} />
        <Route path="/peer" element={<Layout><PeerInterface /></Layout>} />
        <Route path="/tools" element={<Layout><ToolsInterface /></Layout>} />

        <Route path="/admin" element={
          <AdminGuard onExit={() => navigate('/')}>
            <AdminInterface />
          </AdminGuard>
        } />

        <Route path="/workflow" element={
          <WorkflowWrapper
            navigate={navigate}
            userProfile={userProfile}
            onLogout={() => {
              localStorage.removeItem('supabase_token');
              setUserProfile(null);
              navigate('/auth');
            }}
          />
        } />

        <Route path="/archive" element={
          <Layout>
            <AdminGuard onExit={() => navigate('/')}>
              <QuestionArchiveInterface />
            </AdminGuard>
          </Layout>
        } />

        <Route path="/settings" element={
          <Layout>
            <SettingsInterface userProfile={userProfile} setUserProfile={setUserProfile} />
          </Layout>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  );
};

// Helper to handle workflow hook state in a route
const WorkflowWrapper = ({ navigate, userProfile, onLogout }: { navigate: any, userProfile: UserProfile | null, onLogout: () => void }) => {
  const [savedWorkflow, setSavedWorkflow] = useState<any>(() => {
    const saved = localStorage.getItem('jee_workflow_state');
    return saved ? JSON.parse(saved) : {
      id: 'prep-1',
      name: 'JEE PREP WORKFLOW',
      lastModified: new Date().toISOString(),
      elements: []
    };
  });

  const handleSaveWorkflow = (newState: any) => {
    setSavedWorkflow(newState);
    localStorage.setItem('jee_workflow_state', JSON.stringify(newState));
  };

  return (
    <div className="flex min-h-screen bg-[#000000] text-[#e8eaed] font-sans selection:bg-[#3c4043] selection:text-white overflow-hidden relative">
      <Sidebar
        activeMode="workflow"
        setMode={(mode) => navigate(mode === 'home' ? '/' : `/${mode}`)}
        userProfile={userProfile}
        onLogout={onLogout}
      />
      <main className="flex-1 relative overflow-y-auto overflow-x-hidden h-screen bg-[#000000]">
        <Workspace
          state={savedWorkflow}
          onSave={handleSaveWorkflow}
          onExit={() => navigate('/')}
        />
      </main>
    </div>
  );
};

export default App;
