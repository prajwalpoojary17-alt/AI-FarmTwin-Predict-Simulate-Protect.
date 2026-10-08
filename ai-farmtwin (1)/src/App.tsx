/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FarmProvider, useFarm } from './context/FarmContext';
import { AuthScreen } from './components/AuthScreen';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { DigitalTwinView } from './components/DigitalTwinView';
import { CropHealthView } from './components/CropHealthView';
import { PlantsView } from './components/PlantsView';
import { EventDetectionView } from './components/EventDetectionView';
import { WhatIfSimulatorView } from './components/WhatIfSimulatorView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { ManualSensorInputModal } from './components/ManualSensorInputModal';
import { Menu } from 'lucide-react';
import { FarmBadgeLogo } from './utils/farmLogo';

const AppContent: React.FC = () => {
  const { user, activeTab, selectedSection, setSelectedSection, farmConfig } = useFarm();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // If user is not authenticated, show Login / Register screen
  if (!user) {
    return <AuthScreen />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'digital-twin':
        return <DigitalTwinView />;
      case 'crop-health':
        return <CropHealthView />;
      case 'plants':
        return <PlantsView />;
      case 'events':
        return <EventDetectionView />;
      case 'simulator':
        return <WhatIfSimulatorView />;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  const isDark = farmConfig.theme === 'dark';

  return (
    <div
      className={`min-h-screen ${
        isDark ? 'dark' : ''
      } bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col font-sans transition-colors duration-150`}
    >
      {/* Sidebar (Desktop fixed + Mobile drawer) */}
      <Sidebar mobileOpen={mobileSidebarOpen} setMobileOpen={setMobileSidebarOpen} />

      {/* Main Layout Area (offset by sidebar on desktop) */}
      <div className="lg:pl-72 print:pl-0 flex-1 flex flex-col min-w-0">
        {/* Mobile Header with Hamburger & Dynamic Farm Logo */}
        <div className="lg:hidden print:hidden bg-white dark:bg-stone-900 text-stone-900 dark:text-white px-4 py-3 flex items-center justify-between border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <FarmBadgeLogo logoId={farmConfig.farmLogo} className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-wide block leading-none">
                AI FARMTWIN
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                &ldquo;Predict. Simulate. Protect.&rdquo;
              </span>
            </div>
          </div>

          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Top Farm Information Bar */}
        <div className="print:hidden">
          <TopBar />
        </div>

        {/* Main Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 print:p-0 print:m-0 max-w-7xl print:max-w-none w-full mx-auto">
          {renderActiveView()}
        </main>

        {/* Footer */}
        <footer className="py-4 px-6 border-t border-stone-200 dark:border-stone-800 text-center text-xs text-stone-500 dark:text-stone-400 bg-white/50 dark:bg-stone-900/50 print:hidden">
          AI FarmTwin &bull; Software Digital Twin Prototype &bull; &ldquo;Predict. Simulate. Protect.&rdquo;
        </footer>
      </div>

      {/* Manual Sensor Input Modal / Section Detail Modal */}
      {selectedSection && (
        <ManualSensorInputModal
          section={selectedSection}
          onClose={() => setSelectedSection(null)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <FarmProvider>
      <AppContent />
    </FarmProvider>
  );
}
