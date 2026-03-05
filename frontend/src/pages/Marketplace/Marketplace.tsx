import { useState } from "react";
import {
  Search,
  ArrowRight,
  Star,
  Users,
  Zap,
  MessageSquare,
  Database,
  CheckCircle2,
  Clock,
} from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string;
  author: string;
  stars: number;
  installs: number;
  category: "Popular" | "Data" | "Social" | "Dev";
  nodes: number;
  tags: string[];
}

const TEMPLATES: Template[] = [
  {
    id: "t1",
    name: "Weather to Discord Alert",
    description:
      "Get daily weather updates pushed to your Discord server automatically every morning.",
    author: "FlowForge Team",
    stars: 128,
    installs: 1450,
    category: "Social",
    nodes: 3,
    tags: ["Weather", "Discord", "Automation"],
  },
  {
    id: "t2",
    name: "HTTP Hook to PostgreSQL",
    description:
      "Listen for incoming webhooks and store payload data directly into your database.",
    author: "Alex Rivers",
    stars: 89,
    installs: 3200,
    category: "Data",
    nodes: 2,
    tags: ["Postgres", "Webhook", "Database"],
  },
  {
    id: "t3",
    name: "Multi-Platform Notifier",
    description:
      "Send status updates to Telegram, Slack, and Discord simultaneously from a single trigger.",
    author: "Sarah Chen",
    stars: 215,
    installs: 890,
    category: "Popular",
    nodes: 5,
    tags: ["Messaging", "Cross-post"],
  },
  {
    id: "t4",
    name: "E-commerce Order Sync",
    description:
      "Sync new Shopify orders to a Google Sheet and notify your team via Telegram.",
    author: "MarketFlow",
    stars: 56,
    installs: 420,
    category: "Data",
    nodes: 4,
    tags: ["Shopify", "Sheets", "CRM"],
  },
];

export default function Marketplace() {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const categories = ["All", "Popular", "Data", "Social", "Dev"];

  return (
    <div className="p-8 h-full overflow-y-auto bg-bg-base text-text-primary custom-scrollbar">
      <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 overflow-visible">
        {/* Banner Section */}
        <div className="relative overflow-hidden rounded-2xl p-10 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-primary/20 group">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 blur-[120px] group-hover:bg-primary/20 transition-all duration-700" />
          <div className="absolute top-1/2 -right-24 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 blur-[100px]" />

          <div className="relative flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="flex-1 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 shadow-lg shadow-primary/5">
                <Star size={14} className="text-primary fill-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  New for v2.0
                </span>
              </div>
              <h1 className="text-5xl font-black tracking-tighter leading-tight bg-gradient-to-r from-white via-white/90 to-text-tertiary bg-clip-text text-transparent">
                Accelerate your <br />
                <span className="text-primary">Automation</span> journey.
              </h1>
              <p className="text-lg text-text-tertiary max-w-lg font-medium leading-relaxed">
                Discover pre-made templates built by the community to save you
                hours of manual configuration.
              </p>
              <div className="flex gap-4 pt-4">
                <button className="px-8 py-3.5 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary-hover shadow-xl shadow-primary/20 flex items-center gap-2 transform active:scale-95 transition-all">
                  Browse All
                  <ArrowRight size={18} />
                </button>
                <div className="flex items-center gap-8 pl-4">
                  <div className="text-center">
                    <p className="text-2xl font-black text-white">450+</p>
                    <p className="text-[10px] uppercase font-bold text-text-tertiary tracking-widest">
                      Templates
                    </p>
                  </div>
                  <div className="h-8 w-px bg-white/10" />
                  <div className="text-center">
                    <p className="text-2xl font-black text-white">12k</p>
                    <p className="text-[10px] uppercase font-bold text-text-tertiary tracking-widest">
                      Active Users
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden lg:block relative w-80 h-80">
              <div className="absolute inset-0 bg-primary/20 rounded-2xl rotate-6 border border-primary/30 backdrop-blur-sm" />
              <div className="absolute inset-0 bg-bg-surface rounded-2xl -rotate-3 border border-border-default shadow-2xl p-6 flex flex-col justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Zap size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">
                      Quick Trigger
                    </p>
                    <p className="text-[10px] text-text-tertiary">
                      v1.2 Active
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="w-2/3 h-full bg-primary" />
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="w-1/2 h-full bg-emerald-400" />
                  </div>
                </div>
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-bg-surface bg-bg-elevated"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Categories Navbar */}
        <div className="flex items-center justify-between border-b border-white/5 pb-6">
          <div className="flex gap-2 p-1 bg-bg-elevated/50 rounded-2xl border border-white/5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeCategory === cat
                    ? "bg-bg-overlay text-primary shadow-xl ring-1 ring-white/5"
                    : "text-text-tertiary hover:text-text-secondary"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-64">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary"
              size={16}
            />
            <input
              className="w-full pl-10 pr-4 py-2 bg-bg-surface border border-border-default rounded-xl outline-none focus:border-primary transition-all text-xs"
              placeholder="Search templates..."
            />
          </div>
        </div>

        {/* Template Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 pb-20">
          {TEMPLATES.map((template) => (
            <div
              key={template.id}
              className="group relative flex flex-col bg-bg-surface border border-border-default rounded-2xl p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:-translate-y-1 overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="px-2 py-1 rounded-md bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-black text-white">
                  MODERN
                </div>
              </div>

              {/* Icon Visualization */}
              <div className="h-32 mb-6 rounded-[1.5rem] bg-bg-elevated/30 border border-white/5 flex items-center justify-center relative overflow-hidden group-hover:bg-primary/5 transition-colors">
                <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-bg-surface shadow-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    {template.category === "Social" ? (
                      <MessageSquare size={24} />
                    ) : template.category === "Data" ? (
                      <Database size={24} />
                    ) : (
                      <Zap size={24} />
                    )}
                  </div>
                  <div className="w-6 h-1 bg-white/10 rounded-full" />
                  <div className="w-12 h-12 rounded-2xl bg-bg-surface shadow-xl flex items-center justify-center text-text-primary group-hover:scale-110 transition-transform">
                    <CheckCircle2 size={24} className="text-emerald-400" />
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                    {template.category}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-text-tertiary">
                    <Clock size={10} /> {template.nodes} Nodes
                  </div>
                </div>
                <h3 className="text-lg font-black tracking-tight text-white leading-tight group-hover:text-primary transition-colors">
                  {template.name}
                </h3>
                <p className="text-xs text-text-tertiary font-medium line-clamp-2 leading-relaxed">
                  {template.description}
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-primary to-indigo-500" />
                  <p className="text-[10px] font-bold text-text-secondary">
                    {template.author}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-text-tertiary">
                  <div className="flex items-center gap-1 text-[10px] font-bold">
                    <Star size={12} className="text-amber-400 fill-amber-400" />{" "}
                    {template.stars}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold">
                    <Users size={12} /> {template.installs}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
