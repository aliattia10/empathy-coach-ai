import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, AlertTriangle, MessageSquare } from "lucide-react";

const statsCards = [
  { icon: Users, label: "Active Managers", value: "24", trend: "+3 this week" },
  { icon: MessageSquare, label: "Training Sessions", value: "142", trend: "+18 this week" },
  { icon: TrendingUp, label: "Avg. Empathy Score", value: "72%", trend: "+5% vs last month" },
  { icon: AlertTriangle, label: "Blind Spots Found", value: "38", trend: "12 resolved" },
];

const barData = [
  { month: "Jan", sessions: 45 },
  { month: "Feb", sessions: 62 },
  { month: "Mar", sessions: 78 },
  { month: "Apr", sessions: 91 },
  { month: "May", sessions: 142 },
];

const radarData = [
  { skill: "Active Listening", score: 78 },
  { skill: "Feedback Delivery", score: 62 },
  { skill: "Conflict Resolution", score: 55 },
  { skill: "Inclusive Language", score: 71 },
  { skill: "Emotional Awareness", score: 68 },
  { skill: "Legal Awareness", score: 45 },
];

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">Organisation Dashboard</h2>
        <p className="text-sm text-muted-foreground">Aggregated, anonymised insights across your managers</p>
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
              <p className="text-[10px] text-success mt-1">{s.trend}</p>
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
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 87%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="sessions" fill="hsl(16, 85%, 62%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-base font-display">Team Skill Radar</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(220, 13%, 87%)" />
                <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar dataKey="score" stroke="hsl(172, 50%, 45%)" fill="hsl(172, 50%, 45%)" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
