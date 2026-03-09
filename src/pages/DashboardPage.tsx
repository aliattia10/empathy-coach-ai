import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, AlertTriangle, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface DashboardStats {
  activeManagers: number;
  totalSessions: number;
  avgEmpathyScore: number;
  blindSpotsFound: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({ activeManagers: 0, totalSessions: 0, avgEmpathyScore: 0, blindSpotsFound: 0 });
  const [radarData, setRadarData] = useState<{ skill: string; score: number }[]>([]);
  const [sessionData, setSessionData] = useState<{ month: string; sessions: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function loadDashboard() {
      try {
        // Fetch sessions count
        const { count: sessionCount } = await supabase
          .from("chat_sessions")
          .select("*", { count: "exact", head: true });

        // Fetch survey results for radar
        const { data: surveys } = await supabase
          .from("survey_results")
          .select("category_scores, completed_at");

        const totalSessions = sessionCount || 0;

        // Aggregate category scores from surveys
        const categoryTotals: Record<string, { sum: number; count: number }> = {};
        let blindSpots = 0;

        (surveys || []).forEach((s: any) => {
          const scores = s.category_scores as Record<string, number>;
          Object.entries(scores).forEach(([key, val]) => {
            if (!categoryTotals[key]) categoryTotals[key] = { sum: 0, count: 0 };
            categoryTotals[key].sum += val;
            categoryTotals[key].count += 1;
            if (val < 50) blindSpots++;
          });
        });

        const labelMap: Record<string, string> = {
          staff_satisfaction: "Staff Satisfaction",
          legal_risks: "Legal Awareness",
          communication_gaps: "Communication",
        };

        const radar = Object.entries(categoryTotals).map(([key, v]) => ({
          skill: labelMap[key] || key,
          score: Math.round(v.sum / v.count),
        }));

        const avgScore = radar.length > 0
          ? Math.round(radar.reduce((s, r) => s + r.score, 0) / radar.length)
          : 0;

        // Group sessions by month
        const { data: sessions } = await supabase
          .from("chat_sessions")
          .select("created_at");

        const monthCounts: Record<string, number> = {};
        (sessions || []).forEach((s: any) => {
          const d = new Date(s.created_at);
          const key = d.toLocaleString("default", { month: "short" });
          monthCounts[key] = (monthCounts[key] || 0) + 1;
        });

        setSessionData(Object.entries(monthCounts).map(([month, count]) => ({ month, sessions: count })));
        setRadarData(radar);
        setStats({
          activeManagers: (surveys || []).length,
          totalSessions,
          avgEmpathyScore: avgScore,
          blindSpotsFound: blindSpots,
        });
      } catch (e) {
        console.error("Dashboard load error:", e);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [user]);

  const statsCards = [
    { icon: Users, label: "Active Managers", value: String(stats.activeManagers), trend: "" },
    { icon: MessageSquare, label: "Training Sessions", value: String(stats.totalSessions), trend: "" },
    { icon: TrendingUp, label: "Avg. Empathy Score", value: `${stats.avgEmpathyScore}%`, trend: "" },
    { icon: AlertTriangle, label: "Blind Spots Found", value: String(stats.blindSpotsFound), trend: "" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">Organisation Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          {loading ? "Loading data…" : "Aggregated, anonymised insights across your managers"}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((s) => (
          <Card key={s.label} className="shadow-soft">
            <CardContent className="pt-5 pb-4 px-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-coral-light flex items-center justify-center">
                  <s.icon className="w-4 h-4 text-secondary" />
                </div>
              </div>
              <p className="text-2xl font-display font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-base font-display">Training Sessions Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {sessionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={sessionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 87%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="sessions" fill="hsl(16, 85%, 62%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-12 text-center">No session data yet. Start a coaching conversation to see trends.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-base font-display">Team Skill Radar</CardTitle>
          </CardHeader>
          <CardContent>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(220, 13%, 87%)" />
                  <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar dataKey="score" stroke="hsl(172, 50%, 45%)" fill="hsl(172, 50%, 45%)" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-12 text-center">No survey data yet. Complete a Blind Spot Assessment to see results.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
