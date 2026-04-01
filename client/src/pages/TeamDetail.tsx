import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function TeamDetail() {
  const { teamId } = useParams<{ teamId: string }>();
  const [, navigate] = useLocation();
  const [isCreatingStudent, setIsCreatingStudent] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [studentNotes, setStudentNotes] = useState("");

  const teamQuery = trpc.teams.getById.useQuery(
    { teamId: parseInt(teamId!) },
    { enabled: !!teamId }
  );

  const studentsQuery = trpc.students.listByTeam.useQuery(
    { teamId: parseInt(teamId!) },
    { enabled: !!teamId }
  );

  const createStudentMutation = trpc.students.create.useMutation();
  const deleteStudentMutation = trpc.students.delete.useMutation();

  const handleCreateStudent = async () => {
    if (!studentName.trim()) {
      toast.error("受講生名を入力してください");
      return;
    }

    try {
      await createStudentMutation.mutateAsync({
        teamId: parseInt(teamId!),
        name: studentName,
        notes: studentNotes,
      });
      setStudentName("");
      setStudentNotes("");
      setIsCreatingStudent(false);
      toast.success("受講生を登録しました");
      studentsQuery.refetch();
    } catch (error) {
      toast.error("受講生登録に失敗しました");
    }
  };

  const handleDeleteStudent = async (studentId: number) => {
    if (!confirm("この受講生を削除してもよろしいですか？")) return;

    try {
      await deleteStudentMutation.mutateAsync({ studentId });
      toast.success("受講生を削除しました");
      studentsQuery.refetch();
    } catch (error) {
      toast.error("削除に失敗しました");
    }
  };

  if (teamQuery.isLoading || studentsQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!teamQuery.data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-foreground font-medium mb-4">
            チームが見つかりません
          </p>
          <Button onClick={() => navigate("/dashboard")}>
            ダッシュボードに戻る
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              戻る
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {teamQuery.data.name}
              </h1>
              {teamQuery.data.description && (
                <p className="text-sm text-muted-foreground">
                  {teamQuery.data.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              受講生一覧
            </h2>
            <p className="text-muted-foreground">
              {studentsQuery.data?.length || 0} 名の受講生を管理しています
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/team/${teamId}/manage`)}
              className="flex items-center gap-2"
            >
              チーム管理
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`/team/${teamId}/grouping`)}
              className="flex items-center gap-2"
            >
              グループ分け提案
            </Button>
            <Dialog open={isCreatingStudent} onOpenChange={setIsCreatingStudent}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  受講生を追加
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>受講生を追加</DialogTitle>
                  <DialogDescription>
                    新しい受講生を登録します
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="student-name">受講生名</Label>
                    <Input
                      id="student-name"
                      placeholder="例: 田中太郎"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="student-notes">メモ（オプション）</Label>
                    <Textarea
                      id="student-notes"
                      placeholder="性格や特徴などのメモ"
                      value={studentNotes}
                      onChange={(e) => setStudentNotes(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleCreateStudent}
                    disabled={createStudentMutation.isPending}
                    className="w-full"
                  >
                    {createStudentMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        登録中...
                      </>
                    ) : (
                      "受講生を登録"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {studentsQuery.data && studentsQuery.data.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {studentsQuery.data.map((student) => (
              <Card
                key={student.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/student/${student.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{student.name}</CardTitle>
                      {student.photoUrl && (
                        <CardDescription>顔写真登録済み</CardDescription>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteStudent(student.id);
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {student.notes && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {student.notes}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    登録日: {new Date(student.createdAt).toLocaleDateString("ja-JP")}
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
                受講生がまだ登録されていません
              </p>
              <p className="text-muted-foreground text-sm mb-4">
                受講生を追加して、管理を開始しましょう
              </p>
              <Button
                onClick={() => setIsCreatingStudent(true)}
                className="flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                最初の受講生を追加
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
