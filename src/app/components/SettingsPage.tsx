import { useState } from "react";
import { useTheme } from "./ThemeContext";
import { useUser } from "./UserContext";
import { useAuth } from "../stores/authStore";
import { useNavigate } from "react-router";
import {
  User,
  Palette,
  FileEdit,
  Sparkles,
  Bell,
  Shield,
  ChevronRight,
  Moon,
  Sun,
  Monitor,
  Check,
  AlertTriangle,
  Download,
  Trash2,
  Keyboard,
  Info,
  BarChart3,
  LogOut,
} from "lucide-react";

type SettingsSection =
  | "profile"
  | "appearance"
  | "editor"
  | "ai"
  | "notifications"
  | "privacy"
  | "shortcuts";

const sections: { key: SettingsSection; label: string; icon: typeof User; description: string }[] = [
  { key: "profile", label: "Profile", icon: User, description: "Your account details" },
  { key: "appearance", label: "Appearance", icon: Palette, description: "Theme & display" },
  { key: "editor", label: "Editor", icon: FileEdit, description: "Editing preferences" },
  { key: "ai", label: "AI & Chat", icon: Sparkles, description: "AI behavior settings" },
  { key: "notifications", label: "Notifications", icon: Bell, description: "Alerts & digests" },
  { key: "privacy", label: "Privacy & Data", icon: Shield, description: "Security & exports" },
  { key: "shortcuts", label: "Shortcuts", icon: Keyboard, description: "Keyboard shortcuts" },
];

function Toggle({
  enabled,
  onChange,
  colors,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  colors: any;
}) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className="w-9 h-5 rounded-full relative transition-colors"
      style={{
        backgroundColor: enabled ? colors.crystal || "#5C6CF5" : colors.border,
      }}
    >
      <div
        className="w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all"
        style={{ left: enabled ? "18px" : "3px" }}
      />
    </button>
  );
}

function SelectDropdown({
  value,
  options,
  onChange,
  colors,
  isDark,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  colors: any;
  isDark: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-[12px] px-2.5 py-1.5 rounded-md outline-none transition-colors"
      style={{
        backgroundColor: colors.bgBase,
        border: `1px solid ${colors.border}`,
        color: colors.textPrimary,
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function SettingsPage() {
  const { isDark, toggle, colors } = useTheme();
  const { isNewUser } = useUser();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");

  // Settings state
  const [profileName, setProfileName] = useState("Jane Doe");
  const [profileEmail, setProfileEmail] = useState("jane.doe@acmecorp.com");
  const [compactMode, setCompactMode] = useState(false);
  const [fontSize, setFontSize] = useState("14");
  const [autoSave, setAutoSave] = useState(true);
  const [autoSaveInterval, setAutoSaveInterval] = useState("30");
  const [defaultExportFormat, setDefaultExportFormat] = useState("pdf");
  const [showFormattingBar, setShowFormattingBar] = useState(true);
  const [spellCheck, setSpellCheck] = useState(true);
  const [showConfidenceScores, setShowConfidenceScores] = useState(true);
  const [aiTone, setAiTone] = useState("balanced");
  const [autoSuggest, setAutoSuggest] = useState(true);
  const [summarizeOnUpload, setSummarizeOnUpload] = useState(true);
  const [emailDigests, setEmailDigests] = useState(true);
  const [digestFrequency, setDigestFrequency] = useState("daily");
  const [chatAlerts, setChatAlerts] = useState(true);
  const [exportNotifs, setExportNotifs] = useState(true);
  const [uploadNotifs, setUploadNotifs] = useState(true);
  const [dataRetention, setDataRetention] = useState("forever");

  const cardBg = isDark ? "#111320" : "#FFFFFF";
  const cardBorder = colors.border;
  const inputBg = colors.bgBase;
  const sectionBg = isDark ? "#0F1018" : "#F0EEEB";

  const shortcuts = [
    { keys: ["⌘", "K"], description: "Quick search" },
    { keys: ["⌘", "S"], description: "Save document" },
    { keys: ["⌘", "E"], description: "Export document" },
    { keys: ["⌘", "B"], description: "Bold text" },
    { keys: ["⌘", "I"], description: "Italic text" },
    { keys: ["⌘", "Z"], description: "Undo" },
    { keys: ["⌘", "⇧", "Z"], description: "Redo" },
    { keys: ["⌘", "/"], description: "AI suggestion" },
    { keys: ["⌘", "."], description: "Toggle sidebar" },
    { keys: ["⌘", ","], description: "Open settings" },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case "profile":
        return (
          <div className="space-y-6">
            <SectionHeader title="Profile" description="Manage your account details and avatar" />

            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#5C6CF5] to-[#3A4AE8] flex items-center justify-center text-white text-[20px]">
                JD
              </div>
              <div>
                <button
                  className="px-3 py-1.5 rounded-md text-[11px] transition-colors"
                  style={{
                    backgroundColor: `${colors.crystal}15`,
                    color: colors.crystal,
                    fontWeight: 500,
                  }}
                >
                  Change Avatar
                </button>
                <div className="text-[10px] mt-1" style={{ color: colors.textMuted }}>
                  JPG, PNG, or GIF. Max 2MB.
                </div>
              </div>
            </div>

            {/* Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldGroup label="Display Name" colors={colors}>
                <input
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full text-[12px] px-3 py-2 rounded-md outline-none transition-colors focus:border-[#5C6CF5]/50"
                  style={{
                    backgroundColor: inputBg,
                    border: `1px solid ${cardBorder}`,
                    color: colors.textPrimary,
                  }}
                />
              </FieldGroup>
              <FieldGroup label="Email" colors={colors}>
                <input
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full text-[12px] px-3 py-2 rounded-md outline-none transition-colors focus:border-[#5C6CF5]/50"
                  style={{
                    backgroundColor: inputBg,
                    border: `1px solid ${cardBorder}`,
                    color: colors.textPrimary,
                  }}
                />
              </FieldGroup>
            </div>

            {/* Workspace */}
            <FieldGroup label="Workspace" colors={colors}>
              <div className="flex items-center gap-3">
                <div
                  className="px-3 py-2 rounded-md text-[12px] flex-1"
                  style={{ backgroundColor: inputBg, border: `1px solid ${cardBorder}`, color: colors.textSecondary }}
                >
                  Acme Corp
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ backgroundColor: `${colors.crystal}15`, color: colors.crystal }}>
                  Pro Plan
                </span>
              </div>
            </FieldGroup>

            <SaveButton colors={colors} />
          </div>
        );

      case "appearance":
        return (
          <div className="space-y-6">
            <SectionHeader title="Appearance" description="Customize the look and feel of the app" />

            {/* Theme */}
            <FieldGroup label="Theme" colors={colors}>
              <div className="flex gap-3">
                {[
                  { id: "dark", icon: Moon, label: "Dark" },
                  { id: "light", icon: Sun, label: "Light" },
                  { id: "system", icon: Monitor, label: "System" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      if ((t.id === "dark" && !isDark) || (t.id === "light" && isDark)) toggle();
                    }}
                    className="flex-1 flex flex-col items-center gap-2 p-3 rounded-lg transition-all"
                    style={{
                      border: `2px solid ${
                        (t.id === "dark" && isDark) || (t.id === "light" && !isDark)
                          ? colors.crystal
                          : cardBorder
                      }`,
                      backgroundColor: (t.id === "dark" && isDark) || (t.id === "light" && !isDark)
                        ? `${colors.crystal}10`
                        : "transparent",
                    }}
                  >
                    <t.icon className="w-5 h-5" style={{
                      color: (t.id === "dark" && isDark) || (t.id === "light" && !isDark)
                        ? colors.crystal
                        : colors.textMuted,
                    }} />
                    <span className="text-[11px]" style={{
                      fontWeight: 500,
                      color: (t.id === "dark" && isDark) || (t.id === "light" && !isDark)
                        ? colors.textPrimary
                        : colors.textSecondary,
                    }}>
                      {t.label}
                    </span>
                    {((t.id === "dark" && isDark) || (t.id === "light" && !isDark)) && (
                      <Check className="w-3.5 h-3.5" style={{ color: colors.crystal }} />
                    )}
                  </button>
                ))}
              </div>
            </FieldGroup>

            {/* Font Size */}
            <SettingRow label="Editor Font Size" description="Adjust the text size in the editor panel" colors={colors}>
              <SelectDropdown
                value={fontSize}
                options={[
                  { value: "12", label: "12px" },
                  { value: "13", label: "13px" },
                  { value: "14", label: "14px (default)" },
                  { value: "15", label: "15px" },
                  { value: "16", label: "16px" },
                ]}
                onChange={setFontSize}
                colors={colors}
                isDark={isDark}
              />
            </SettingRow>

            {/* Compact Mode */}
            <SettingRow label="Compact Mode" description="Reduce spacing and padding throughout the UI" colors={colors}>
              <Toggle enabled={compactMode} onChange={setCompactMode} colors={colors} />
            </SettingRow>
          </div>
        );

      case "editor":
        return (
          <div className="space-y-6">
            <SectionHeader title="Editor Preferences" description="Configure the document editor behavior" />

            <SettingRow label="Auto-Save" description="Automatically save your document changes" colors={colors}>
              <Toggle enabled={autoSave} onChange={setAutoSave} colors={colors} />
            </SettingRow>

            {autoSave && (
              <SettingRow label="Auto-Save Interval" description="How often changes are saved" colors={colors}>
                <SelectDropdown
                  value={autoSaveInterval}
                  options={[
                    { value: "10", label: "Every 10 seconds" },
                    { value: "30", label: "Every 30 seconds" },
                    { value: "60", label: "Every minute" },
                    { value: "300", label: "Every 5 minutes" },
                  ]}
                  onChange={setAutoSaveInterval}
                  colors={colors}
                  isDark={isDark}
                />
              </SettingRow>
            )}

            <SettingRow label="Default Export Format" description="Pre-selected format when exporting" colors={colors}>
              <SelectDropdown
                value={defaultExportFormat}
                options={[
                  { value: "pdf", label: "PDF" },
                  { value: "docx", label: "DOCX" },
                  { value: "md", label: "Markdown" },
                  { value: "txt", label: "Plain Text" },
                ]}
                onChange={setDefaultExportFormat}
                colors={colors}
                isDark={isDark}
              />
            </SettingRow>

            <SettingRow label="Formatting Toolbar" description="Show the formatting strip below the editor toolbar" colors={colors}>
              <Toggle enabled={showFormattingBar} onChange={setShowFormattingBar} colors={colors} />
            </SettingRow>

            <SettingRow label="Spell Check" description="Highlight misspelled words in the editor" colors={colors}>
              <Toggle enabled={spellCheck} onChange={setSpellCheck} colors={colors} />
            </SettingRow>
          </div>
        );

      case "ai":
        return (
          <div className="space-y-6">
            <SectionHeader title="AI & Chat" description="Control how the AI assistant behaves" />

            <SettingRow label="Confidence Scores" description="Show confidence metrics on AI responses" colors={colors}>
              <Toggle enabled={showConfidenceScores} onChange={setShowConfidenceScores} colors={colors} />
            </SettingRow>

            <SettingRow label="AI Tone" description="Adjust how the AI communicates" colors={colors}>
              <SelectDropdown
                value={aiTone}
                options={[
                  { value: "concise", label: "Concise" },
                  { value: "balanced", label: "Balanced" },
                  { value: "detailed", label: "Detailed" },
                  { value: "formal", label: "Formal" },
                ]}
                onChange={setAiTone}
                colors={colors}
                isDark={isDark}
              />
            </SettingRow>

            <SettingRow label="Auto-Suggest" description="AI automatically suggests edits as you type" colors={colors}>
              <Toggle enabled={autoSuggest} onChange={setAutoSuggest} colors={colors} />
            </SettingRow>

            <SettingRow label="Summarize on Upload" description="Automatically generate a summary when a transcript is uploaded" colors={colors}>
              <Toggle enabled={summarizeOnUpload} onChange={setSummarizeOnUpload} colors={colors} />
            </SettingRow>

            {/* Confidence Score Summary */}
            {showConfidenceScores && !isNewUser && (
              <div
                className="p-4 rounded-lg"
                style={{ backgroundColor: isDark ? "#0F1018" : "#F7F6F3", border: `1px solid ${cardBorder}` }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-4 h-4" style={{ color: colors.crystal }} />
                  <span className="text-[12px]" style={{ fontWeight: 600, color: colors.textPrimary }}>
                    Your Confidence Scores
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-3">
                  {[
                    { label: "Faithfulness", avg: 91, color: "#10B981" },
                    { label: "Relevance", avg: 88, color: "#00C9D6" },
                    { label: "Precision", avg: 86, color: "#5C6CF5" },
                  ].map((m) => (
                    <div key={m.label}>
                      <div className="flex items-center gap-1 mb-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                        <span className="text-[10px]" style={{ color: colors.textMuted }}>{m.label}</span>
                      </div>
                      <div className="w-full h-2 rounded-full mb-1" style={{ backgroundColor: `${m.color}15` }}>
                        <div className="h-full rounded-full" style={{ width: `${m.avg}%`, backgroundColor: m.color }} />
                      </div>
                      <div className="text-[10px] font-mono text-right" style={{ color: m.color }}>{m.avg}%</div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2" style={{ borderTop: `1px solid ${cardBorder}` }}>
                  <span className="text-[10px]" style={{ color: colors.textMuted }}>Average across 47 conversations</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded" style={{ fontWeight: 600, color: "#10B981", backgroundColor: "rgba(16,185,129,0.1)" }}>
                    89% overall
                  </span>
                </div>
              </div>
            )}

            {showConfidenceScores && isNewUser && (
              <div
                className="p-4 rounded-lg text-center"
                style={{ backgroundColor: isDark ? "#0F1018" : "#F7F6F3", border: `1px solid ${cardBorder}` }}
              >
                <BarChart3 className="w-6 h-6 mx-auto mb-2" style={{ color: colors.textMuted }} />
                <div className="text-[11px]" style={{ color: colors.textMuted }}>
                  Confidence score analytics will appear here after your first AI conversation
                </div>
              </div>
            )}

            {/* AI Info */}
            <div
              className="flex items-start gap-3 p-3 rounded-lg"
              style={{ backgroundColor: `${colors.crystal}08`, border: `1px solid ${colors.crystal}20` }}
            >
              <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: colors.crystal }} />
              <div>
                <div className="text-[12px]" style={{ fontWeight: 500, color: colors.textPrimary }}>
                  About ConvoCrystal AI
                </div>
                <p className="text-[11px] mt-0.5" style={{ color: colors.textSecondary }}>
                  AI features use your transcript data to generate insights, summaries, and suggestions.
                  Your data is processed securely and never shared with third parties.
                </p>
              </div>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-6">
            <SectionHeader title="Notifications" description="Choose what alerts and digests you receive" />

            <SettingRow label="Email Digests" description="Receive a summary of your activity" colors={colors}>
              <Toggle enabled={emailDigests} onChange={setEmailDigests} colors={colors} />
            </SettingRow>

            {emailDigests && (
              <SettingRow label="Digest Frequency" description="How often you receive email digests" colors={colors}>
                <SelectDropdown
                  value={digestFrequency}
                  options={[
                    { value: "daily", label: "Daily" },
                    { value: "weekly", label: "Weekly" },
                    { value: "monthly", label: "Monthly" },
                  ]}
                  onChange={setDigestFrequency}
                  colors={colors}
                  isDark={isDark}
                />
              </SettingRow>
            )}

            <SettingRow label="Chat Alerts" description="Get notified when AI analysis is complete" colors={colors}>
              <Toggle enabled={chatAlerts} onChange={setChatAlerts} colors={colors} />
            </SettingRow>

            <SettingRow label="Export Notifications" description="Alert when an export finishes" colors={colors}>
              <Toggle enabled={exportNotifs} onChange={setExportNotifs} colors={colors} />
            </SettingRow>

            <SettingRow label="Upload Notifications" description="Alert when a transcript finishes processing" colors={colors}>
              <Toggle enabled={uploadNotifs} onChange={setUploadNotifs} colors={colors} />
            </SettingRow>
          </div>
        );

      case "privacy":
        return (
          <div className="space-y-6">
            <SectionHeader title="Privacy & Data" description="Manage your data, exports, and account" />

            <SettingRow label="Data Retention" description="How long transcripts and analyses are stored" colors={colors}>
              <SelectDropdown
                value={dataRetention}
                options={[
                  { value: "30", label: "30 days" },
                  { value: "90", label: "90 days" },
                  { value: "365", label: "1 year" },
                  { value: "forever", label: "Forever" },
                ]}
                onChange={setDataRetention}
                colors={colors}
                isDark={isDark}
              />
            </SettingRow>

            {/* Export all data */}
            <div
              className="p-4 rounded-lg"
              style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[12px]" style={{ fontWeight: 500, color: colors.textPrimary }}>
                    Export All Data
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: colors.textSecondary }}>
                    Download a complete archive of your transcripts, analyses, and settings
                  </div>
                </div>
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] transition-colors"
                  style={{
                    border: `1px solid ${cardBorder}`,
                    color: colors.textSecondary,
                    fontWeight: 500,
                  }}
                >
                  <Download className="w-3.5 h-3.5" />
                  Export Archive
                </button>
              </div>
            </div>

            {/* Sign out */}
            <div className="flex items-center justify-between p-4 rounded-lg"
              style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
              <div>
                <div className="text-[12px]" style={{ fontWeight: 500, color: colors.textPrimary }}>Sign Out</div>
                <div className="text-[11px]" style={{ color: colors.textSecondary }}>Sign out of your account on this device</div>
              </div>
              <button onClick={() => { logout(); navigate("/login"); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] transition-colors"
                style={{ border: `1px solid ${cardBorder}`, color: colors.textSecondary, fontWeight: 500 }}>
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>

            {/* Danger zone */}
            <div
              className="p-4 rounded-lg"
              style={{ border: `1px solid rgba(244,63,94,0.3)`, backgroundColor: "rgba(244,63,94,0.03)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-[#F43F5E]" />
                <span className="text-[12px] text-[#F43F5E]" style={{ fontWeight: 600 }}>
                  Danger Zone
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[12px]" style={{ fontWeight: 500, color: colors.textPrimary }}>
                      Delete All Documents
                    </div>
                    <div className="text-[11px]" style={{ color: colors.textSecondary }}>
                      Permanently remove all transcripts and exports
                    </div>
                  </div>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] border border-[#F43F5E]/30 text-[#F43F5E] hover:bg-[#F43F5E]/10 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete All
                  </button>
                </div>
                <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid rgba(244,63,94,0.15)` }}>
                  <div>
                    <div className="text-[12px]" style={{ fontWeight: 500, color: colors.textPrimary }}>
                      Delete Account
                    </div>
                    <div className="text-[11px]" style={{ color: colors.textSecondary }}>
                      Permanently delete your account and all associated data
                    </div>
                  </div>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] bg-[#F43F5E] text-white hover:bg-[#E11D48] transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case "shortcuts":
        return (
          <div className="space-y-6">
            <SectionHeader title="Keyboard Shortcuts" description="Quick reference for all keyboard shortcuts" />

            <div
              className="rounded-lg overflow-hidden"
              style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
            >
              {shortcuts.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-4 py-2.5"
                  style={{ borderBottom: i < shortcuts.length - 1 ? `1px solid ${isDark ? "rgba(42,45,66,0.4)" : "rgba(226,224,219,0.4)"}` : undefined }}
                >
                  <span className="text-[12px]" style={{ color: colors.textPrimary }}>
                    {s.description}
                  </span>
                  <div className="flex items-center gap-1">
                    {s.keys.map((key, ki) => (
                      <kbd
                        key={ki}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: isDark ? "#1A1D2E" : "#F0EEEB",
                          border: `1px solid ${cardBorder}`,
                          color: colors.textSecondary,
                        }}
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div
      className="h-full overflow-y-auto"
      style={{
        backgroundColor: colors.bgBase,
        scrollbarWidth: "thin",
        scrollbarColor: `${colors.border} transparent`,
      }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Page Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-[18px] sm:text-[20px] mb-1" style={{ fontWeight: 600, color: colors.textPrimary }}>
            Settings
          </h1>
          <p className="text-[13px]" style={{ color: colors.textSecondary }}>
            Manage your preferences, account, and application behavior
          </p>
        </div>

        {/* Two column layout */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Sidebar nav */}
          <div className="w-full md:w-56 shrink-0">
            <div
              className="rounded-xl overflow-hidden md:sticky md:top-6 flex md:flex-col overflow-x-auto md:overflow-x-visible"
              style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}`, scrollbarWidth: "none" }}
            >
              {sections.map((section) => (
                <button
                  key={section.key}
                  onClick={() => setActiveSection(section.key)}
                  className="text-left px-3 py-2 md:py-2.5 flex items-center gap-2 md:gap-3 transition-all duration-200 relative shrink-0 md:shrink md:w-full"
                  style={{
                    borderBottom: `1px solid ${isDark ? "rgba(42,45,66,0.4)" : "rgba(226,224,219,0.4)"}`,
                    backgroundColor: activeSection === section.key ? `${colors.crystal}10` : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (activeSection !== section.key)
                      e.currentTarget.style.backgroundColor = isDark ? "#181B2E" : "#F7F6F3";
                  }}
                  onMouseLeave={(e) => {
                    if (activeSection !== section.key)
                      e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {activeSection === section.key && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#5C6CF5] rounded-r hidden md:block" />
                  )}
                  {activeSection === section.key && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-8 bg-[#5C6CF5] rounded-t md:hidden" />
                  )}
                  <section.icon
                    className="w-4 h-4 shrink-0"
                    style={{ color: activeSection === section.key ? colors.crystal : colors.textMuted }}
                  />
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-[12px] whitespace-nowrap md:whitespace-normal"
                      style={{
                        fontWeight: activeSection === section.key ? 500 : 400,
                        color: activeSection === section.key ? colors.textPrimary : colors.textSecondary,
                      }}
                    >
                      {section.label}
                    </div>
                    <div className="text-[9px] hidden md:block" style={{ color: colors.textMuted }}>
                      {section.description}
                    </div>
                  </div>
                  <ChevronRight
                    className="w-3 h-3 shrink-0 hidden md:block"
                    style={{ color: activeSection === section.key ? colors.crystal : colors.textMuted }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div
              className="rounded-xl p-4 sm:p-5"
              style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
            >
              {renderSection()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable sub-components

function SectionHeader({ title, description }: { title: string; description: string }) {
  const { colors } = useTheme();
  return (
    <div className="pb-4 mb-2" style={{ borderBottom: `1px solid ${colors.border}` }}>
      <h2 className="text-[16px]" style={{ fontWeight: 600, color: colors.textPrimary }}>
        {title}
      </h2>
      <p className="text-[12px] mt-0.5" style={{ color: colors.textSecondary }}>
        {description}
      </p>
    </div>
  );
}

function FieldGroup({ label, colors, children }: { label: string; colors: any; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] mb-1.5 block" style={{ fontWeight: 500, color: colors.textMuted }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function SettingRow({
  label,
  description,
  colors,
  children,
}: {
  label: string;
  description: string;
  colors: any;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div className="flex-1 min-w-0">
        <div className="text-[12px]" style={{ fontWeight: 500, color: colors.textPrimary }}>
          {label}
        </div>
        <div className="text-[11px] mt-0.5" style={{ color: colors.textSecondary }}>
          {description}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function SaveButton({ colors }: { colors: any }) {
  const [saved, setSaved] = useState(false);
  return (
    <button
      onClick={() => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }}
      className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-[11px] text-white transition-colors"
      style={{
        backgroundColor: saved ? "#10B981" : "#5C6CF5",
        fontWeight: 500,
      }}
    >
      {saved ? (
        <>
          <Check className="w-3.5 h-3.5" />
          Saved
        </>
      ) : (
        "Save Changes"
      )}
    </button>
  );
}