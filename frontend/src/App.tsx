import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ProgressBar } from './components/ProgressBar';

import { DashboardPage } from './pages/DashboardPage';
import { CreateClipsPage } from './pages/CreateClipsPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { VideoEditorPage } from './pages/VideoEditorPage';
import { ExportsPage } from './pages/ExportsPage';
import { AISettingsPage } from './pages/AISettingsPage';
import { OwnerDashboardPage } from './pages/OwnerDashboardPage';
import { LoginPage } from './pages/LoginPage';

import { ProcessingJob, User } from './types';
import { jobService, authService } from './services/api';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('viralcut_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activePage, setActivePage] = useState<string>('dashboard');
  const [navParams, setNavParams] = useState<any>({});
  
  // Background Job Tracking
  const [activeJob, setActiveJob] = useState<ProcessingJob | null>(null);

  // Poll active background job until completion
  useEffect(() => {
    if (!activeJob || activeJob.status === 'completed' || activeJob.status === 'failed' || activeJob.status === 'cancelled') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const updated = await jobService.get(activeJob.id);
        setActiveJob(updated);
      } catch (e) {
        console.error("Job poll error:", e);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [activeJob]);

  const handleNavigate = (page: string, params: any = {}) => {
    setActivePage(page);
    setNavParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleJobStarted = (jobId: string) => {
    jobService.get(jobId).then(setActiveJob).catch(console.error);
  };

  const handleCancelJob = async (jobId: string) => {
    try {
      await jobService.cancel(jobId);
      if (activeJob && activeJob.id === jobId) {
        setActiveJob({ ...activeJob, status: 'cancelled', current_step: 'Cancelled by user' });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  // If user is not logged in, show login page
  if (!currentUser) {
    return <LoginPage onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="min-h-screen bg-dark-900 text-gray-100 flex flex-col">
      {/* Top Navigation */}
      <Navbar
        activePage={activePage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          activePage={activePage}
          onNavigate={handleNavigate}
        />

        {/* Center Content Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl mx-auto w-full">
          {/* Active Job Floating Progress Bar */}
          <ProgressBar job={activeJob} onCancel={handleCancelJob} />

          {/* Dynamic Page Views */}
          {activePage === 'dashboard' && (
            <DashboardPage onNavigate={handleNavigate} />
          )}

          {activePage === 'create' && (
            <CreateClipsPage onNavigate={handleNavigate} onJobStarted={handleJobStarted} />
          )}

          {activePage === 'projects' && (
            <ProjectsPage onNavigate={handleNavigate} onJobStarted={handleJobStarted} />
          )}

          {activePage === 'editor' && (
            <VideoEditorPage
              clipId={navParams.clipId}
              projectId={navParams.projectId}
              onNavigate={handleNavigate}
            />
          )}

          {activePage === 'exports' && (
            <ExportsPage onNavigate={handleNavigate} />
          )}

          {activePage === 'settings' && (
            <AISettingsPage />
          )}

          {activePage === 'owner' && (
            <OwnerDashboardPage />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
