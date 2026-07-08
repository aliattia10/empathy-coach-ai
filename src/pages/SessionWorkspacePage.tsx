import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  addUserTask,
  fetchJourneyById,
  removeUserTask,
  toggleGoalInList,
  updateProgressDashboard,
  type ChatSession,
} from "@/hooks/useChatSession";
import { isAutoNamedJourney } from "@/lib/journeyNaming";
import SessionTasksPanel from "@/components/journey/SessionTasksPanel";
import { journeyStateFromSession } from "@/types/journey";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function sessionTitle(session: ChatSession | null): string {
  if (!session) return "Session";
  const name = session.session_name?.trim();
  if (name && !isAutoNamedJourney(name)) return name;
  if (session.presenting_challenge?.trim()) {
    const snippet = session.presenting_challenge.trim();
    return snippet.length > 56 ? `${snippet.slice(0, 56)}…` : snippet;
  }
  return name || "New journey";
}

export default function SessionWorkspacePage() {
  const { journeyId } = useParams<{ journeyId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [session, setSession] = useState<ChatSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!user || !journeyId) {
        navigate("/testing/journeys");
        return;
      }
      setLoading(true);
      try {
        const row = await fetchJourneyById(journeyId, user.id);
        if (!mounted) return;
        if (!row) {
          toast.error("Session not found.");
          navigate("/testing/journeys");
          return;
        }
        setSession(row);
      } catch (err) {
        console.error(err);
        toast.error("Could not load this session.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [user, journeyId, navigate]);

  const journey = journeyStateFromSession(session);
  const title = sessionTitle(session);

  const persistTasks = async (nextGoals: typeof journey.user_goals) => {
    if (!session) return;
    await updateProgressDashboard(session.id, { goals: nextGoals });
    setSession((prev) => (prev ? { ...prev, user_goals: nextGoals, updated_at: new Date().toISOString() } : prev));
  };

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    if (!session) return;
    const previous = session.user_goals ?? [];
    const next = toggleGoalInList(previous, taskId, completed);
    setBusyTaskId(taskId);
    setSession((prev) => (prev ? { ...prev, user_goals: next } : prev));
    try {
      await persistTasks(next);
    } catch (err) {
      console.error(err);
      setSession((prev) => (prev ? { ...prev, user_goals: previous } : prev));
      toast.error("Could not update that task.");
    } finally {
      setBusyTaskId(null);
    }
  };

  const handleAddTask = async (taskTitle: string) => {
    if (!session) return;
    setAdding(true);
    const previous = session.user_goals ?? [];
    const next = addUserTask(previous, taskTitle);
    setSession((prev) => (prev ? { ...prev, user_goals: next } : prev));
    try {
      await persistTasks(next);
    } catch (err) {
      console.error(err);
      setSession((prev) => (prev ? { ...prev, user_goals: previous } : prev));
      toast.error("Could not add task. Check your database migration.");
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveTask = async (taskId: string) => {
    if (!session) return;
    const previous = session.user_goals ?? [];
    const next = removeUserTask(previous, taskId);
    setBusyTaskId(taskId);
    setSession((prev) => (prev ? { ...prev, user_goals: next } : prev));
    try {
      await persistTasks(next);
    } catch (err) {
      console.error(err);
      setSession((prev) => (prev ? { ...prev, user_goals: previous } : prev));
      toast.error("Could not remove task.");
    } finally {
      setBusyTaskId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center text-muted-foreground">
        Loading your session…
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] px-4 py-6 pb-28 md:pb-8">
      <div className="max-w-lg mx-auto space-y-6">
        <Link
          to="/testing/journeys"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          All journeys
        </Link>

        <SessionTasksPanel
          journey={journey}
          displayTitle={title}
          onToggleTask={handleToggleTask}
          onAddTask={handleAddTask}
          onRemoveTask={handleRemoveTask}
          busyTaskId={busyTaskId}
          adding={adding}
        />

        <Button
          className="w-full rounded-xl h-12 text-base"
          onClick={() => navigate(`/testing/avatar/session/${journeyId}`)}
        >
          <MessageCircle className="w-5 h-5 mr-2" />
          Talk to your coach
        </Button>
      </div>
    </div>
  );
}
