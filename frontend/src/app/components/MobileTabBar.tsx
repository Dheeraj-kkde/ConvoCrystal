import { LayoutDashboard, MessageSquare, Files, Settings } from "lucide-react";
import { motion } from "motion/react";
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
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="relative flex flex-col items-center gap-0.5 px-3 py-1"
            style={{ color: isActive ? colors.crystal : colors.textMuted }}
          >
            <div className="relative p-1.5">
              {/* Animated background pill */}
              {isActive && (
                <motion.div
                  layoutId="mobile-tab-indicator"
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: `${colors.crystal}15` }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                />
              )}
              <motion.div
                animate={{
                  scale: isActive ? 1.1 : 1,
                  y: isActive ? -1 : 0,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
              >
                <tab.icon className="w-5 h-5 relative z-10" />
              </motion.div>
            </div>
            <motion.span
              className="text-[9px] font-mono"
              animate={{ opacity: isActive ? 1 : 0.7 }}
            >
              {tab.label}
            </motion.span>
            {/* Active dot */}
            {isActive && (
              <motion.div
                layoutId="mobile-tab-dot"
                className="absolute -bottom-0.5 w-1 h-1 rounded-full"
                style={{ backgroundColor: colors.crystal }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
