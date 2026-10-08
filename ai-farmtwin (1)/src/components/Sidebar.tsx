import React, { useState } from 'react';
import { useFarm, NavigationTab } from '../context/FarmContext';
import {
  LayoutDashboard,
  Boxes,
  HeartPulse,
  Leaf,
  ShieldAlert,
  GitCompare,
  FileSpreadsheet,
  Settings,
  LogOut,
  Edit2,
  Check,
  X,
} from 'lucide-react';
import { FarmBadgeLogo } from '../utils/farmLogo';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const { user, farmConfig, updateFarmConfig, activeTab, setActiveTab, logout } = useFarm();

  const [isEditingAcres, setIsEditingAcres] = useState(false);
  const [tempAcres, setTempAcres] = useState(farmConfig.acres.toString());

  const handleSaveAcres = () => {
    const val = parseFloat(tempAcres);
    if (!isNaN(val) && val > 0) {
      updateFarmConfig({ acres: val });
    } else {
      setTempAcres(farmConfig.acres.toString());
    }
    setIsEditingAcres(false);
  };

  const navItems: { id: NavigationTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'digital-twin', label: 'Digital Twin', icon: Boxes },
    { id: 'crop-health', label: 'Crop Health', icon: HeartPulse },
    { id: 'plants', label: 'Plants', icon: Leaf },
    { id: 'events', label: 'Event Detection', icon: ShieldAlert },
    { id: 'simulator', label: 'What-If Simulator', icon: GitCompare },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar container with full Light and Dark Theme styling */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 flex flex-col border-r border-stone-200 dark:border-stone-800 transition-transform duration-200 ease-in-out lg:translate-x-0 print:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header with Dynamic Farm Logo */}
        <div className="p-5 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Dynamic Farm Logo Container */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-md shadow-emerald-950/20 text-white shrink-0">
                <FarmBadgeLogo logoId={farmConfig.farmLogo} className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-extrabold text-base tracking-wide text-stone-900 dark:text-white flex items-center gap-1.5 leading-tight">
                  AI FARM TWIN
                </h1>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium tracking-tight">
                  &ldquo;Predict. Simulate. Protect.&rdquo;
                </p>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-white rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Farm Identity & Quick Editable Metrics */}
          <div className="mt-4 p-3 bg-stone-100 dark:bg-stone-800/80 rounded-xl border border-stone-200 dark:border-stone-700/60 space-y-2">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400 font-bold block">
                Farm Name
              </span>
              <p className="text-sm font-bold text-stone-900 dark:text-white truncate" title={farmConfig.farmName}>
                {farmConfig.farmName || 'Unnamed Farm'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-200 dark:border-stone-700/60 text-xs">
              {/* Editable Acres */}
              <div>
                <span className="text-[10px] text-stone-500 dark:text-stone-400 block font-medium">Acres</span>
                {isEditingAcres ? (
                  <div className="flex items-center gap-1 mt-0.5">
                    <input
                      type="number"
                      value={tempAcres}
                      onChange={(e) => setTempAcres(e.target.value)}
                      className="w-16 px-1.5 py-0.5 text-xs bg-white dark:bg-stone-900 border border-emerald-500 rounded text-stone-900 dark:text-white focus:outline-hidden"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveAcres}
                      className="p-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setTempAcres(farmConfig.acres.toString());
                        setIsEditingAcres(false);
                      }}
                      className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 group cursor-pointer" onClick={() => setIsEditingAcres(true)}>
                    <span className="font-bold text-emerald-700 dark:text-emerald-300">{farmConfig.acres} ac</span>
                    <Edit2 className="w-3 h-3 text-stone-400 group-hover:text-emerald-600 transition" />
                  </div>
                )}
              </div>

              {/* Total Plants (Auto-Calculated from Zones) */}
              <div>
                <span className="text-[10px] text-stone-500 dark:text-stone-400 block font-medium">Total Plants</span>
                <div className="flex items-center gap-1.5" title="Auto-calculated from all zone allocations">
                  <span className="font-extrabold text-emerald-700 dark:text-emerald-300">
                    {farmConfig.totalPlants.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-stone-400 font-medium">plants</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/80 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                <span className="text-xs text-stone-400 dark:text-stone-500 w-4 font-mono">{index + 1}.</span>
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-stone-500 dark:text-stone-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer: User & Logout */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/40 space-y-2.5">
          {user && (
            <div className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-[11px] flex items-center justify-between shadow-2xs">
              <div className="truncate max-w-[160px]">
                <div className="font-bold text-stone-900 dark:text-stone-100 truncate leading-tight">
                  {user.fullName || 'Farm Owner'}
                </div>
                <div className="text-stone-500 truncate text-[10px] leading-tight mt-0.5">
                  {user.email}
                </div>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono font-bold shrink-0">
                Private
              </span>
            </div>
          )}
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-stone-600 dark:text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition text-sm font-semibold border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};
