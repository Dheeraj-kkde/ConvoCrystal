import { LayoutDashboard, MessageSquare, Files, Settings } from "lucide-react";
import { useTheme } from "./ThemeContext";

const tabs = [
  { icon: LayoutDashboard, label: "Overview", id: "overview" },
  { icon: MessageSquare, label: "Chat", id: "chat" },
  { icon: Files, label: "Documents", id: "documents" },
  { icon: Settings, label: "Settings", id: "settings" },
];

interface MobileTabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function MobileTabBar({ activeTab, onTabChange }: MobileTabBarProps) {
  const { colors } = useTheme();

  return (
    <div className="flex items-center justify-around pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 md:hidden transition-colors duration-300"
      style={{ backgroundColor: colors.bgBase, borderTop: `1px solid ${colors.border}` }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className="flex flex-col items-center gap-0.5 px-3 py-1 transition-all duration-200"
          style={{ color: activeTab === tab.id ? colors.crystal : colors.textMuted }}
        >
          <div className={`p-1.5 rounded-full transition-all duration-200 ${
            activeTab === tab.id ? "scale-110" : ""
          }`} style={{ backgroundColor: activeTab === tab.id ? `${colors.crystal}15` : "transparent" }}>
            <tab.icon className="w-5 h-5" />
          </div>
          <span className="text-[9px] font-mono">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}