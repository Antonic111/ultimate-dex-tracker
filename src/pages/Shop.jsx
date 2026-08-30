import { ShoppingBag, Sparkles, Image, Shield, Palette, Layers, Tv, Gift } from "lucide-react";

const UPCOMING_CATEGORIES = [
  {
    icon: Layers,
    title: "Profile Frames",
    description: "Distinct animated and themed borders for your trainer avatar.",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Image,
    title: "Profile Backgrounds",
    description: "Custom trainer card banners and rare legendary scenery.",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
  },
  {
    icon: Shield,
    title: "Trainer Badges",
    description: "Showcase special achievements and trophy badges on your profile.",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
  },
  {
    icon: Palette,
    title: "Custom Themes",
    description: "Exclusive colorways and visual aesthetics across your tracker.",
    color: "text-pink-400",
    bgColor: "bg-pink-500/10",
  },
  {
    icon: Tv,
    title: "Overlay Cosmetics",
    description: "Unique widgets, animations, and skins for your streamer overlay.",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
  },
  {
    icon: Gift,
    title: "Collector Bundles",
    description: "Themed sets pairing frames, backgrounds, and matching badges.",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
  },
];

export default function Shop() {
  return (
    <div className="w-full text-[var(--text)] py-10 page-enter page-fade-in shop-page">
      <div className="w-full max-w-[1300px] mx-auto space-y-10">
        {/* Header Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)] text-xs sm:text-sm font-semibold tracking-wide uppercase">
            <ShoppingBag size={15} />
            Trainer Store
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[var(--text)]">
            Cosmetics & Customization
          </h1>

          <div className="inline-block px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500 dark:text-amber-300 text-sm font-bold">
            Coming Soon
          </div>

          <p className="text-[var(--text-muted)] text-base sm:text-lg max-w-2xl mx-auto">
            Customize your trainer profile and tracking experience with unique cosmetics,
            rare backgrounds, animated avatar frames, and exclusive overlay widgets.
          </p>
        </div>

        {/* Feature Preview Grid */}
        <div className="bg-[var(--pokemon-box-bg)] border border-[var(--border-color)] rounded-3xl p-6 sm:p-10 shadow-xl space-y-8">
          <div className="space-y-1 text-center sm:text-left">
            <h2 className="text-xl font-bold text-[var(--text)] flex items-center justify-center sm:justify-start gap-2">
              <Sparkles size={20} className="text-[var(--accent)]" />
              What to Expect
            </h2>
            <p className="text-[var(--text-muted)] text-sm">
              All cosmetic purchases will be permanently tied to your trainer account and
              remain yours forever.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {UPCOMING_CATEGORIES.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-black/5 dark:bg-white/[0.02] border border-[var(--border-color)] hover:border-[var(--accent)]/50 transition-all space-y-3"
                >
                  <div
                    className={`w-10 h-10 rounded-xl ${cat.bgColor} flex items-center justify-center ${cat.color}`}
                  >
                    <Icon size={20} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-[var(--text)] text-base">{cat.title}</h3>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                      {cat.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
