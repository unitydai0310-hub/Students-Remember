import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, LogOut } from "lucide-react";
import { toast } from "sonner";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");

  const teamsQuery = trpc.teams.list.useQuery();
  const createTeamMutation = trpc.teams.create.useMutation();

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      toast.error("チーム名を入力してください");
      return;
    }

    try {
      await createTeamMutation.mutateAsync({
        name: teamName,
        description: teamDescription,
      });
      setTeamName("");
      setTeamDescription("");
      setIsCreatingTeam(false);
      toast.success("チームを作成しました");
      teamsQuery.refetch();
    } catch (error) {
      toast.error("チーム作成に失敗しました");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (teamsQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Students Remember
            </h1>
            <p className="text-sm text-muted-foreground">
              {user?.name || "ユーザー"}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            ログアウト
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              チーム一覧
            </h2>
            <p className="text-muted-foreground">
              参加しているチームを管理します
            </p>
          </div>
          <Dialog open={isCreatingTeam} onOpenChange={setIsCreatingTeam}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                新しいチーム
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新しいチームを作成</DialogTitle>
                <DialogDescription>
                  新しい運営チームを作成します
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="team-name">チーム名</Label>
                  <Input
                    id="team-name"
                    placeholder="例: 2024年春期講座"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="team-description">説明（オプション）</Label>
                  <Textarea
                    id="team-description"
                    placeholder="このチームについての説明"
                    value={teamDescription}
                    onChange={(e) => setTeamDescription(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleCreateTeam}
                  disabled={createTeamMutation.isPending}
                  className="w-full"
                >
                  {createTeamMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      作成中...
                    </>
                  ) : (
                    "チームを作成"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {teamsQuery.data && teamsQuery.data.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamsQuery.data.map((team) => (
              <Card
                key={team.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/team/${team.id}`)}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{team.name}</CardTitle>
                  {team.description && (
                    <CardDescription>{team.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    作成日: {new Date(team.createdAt).toLocaleDateString("ja-JP")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <div className="mb-4">
                <div className="inline-block p-3 bg-muted rounded-full">
                  <svg
                    className="w-6 h-6 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-foreground font-medium mb-2">
                チームがまだ作成されていません
              </p>
              <p className="text-muted-foreground text-sm mb-4">
                新しいチームを作成して、受講生の管理を開始しましょう
              </p>
              <Button
                onClick={() => setIsCreatingTeam(true)}
                className="flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                最初のチームを作成
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
