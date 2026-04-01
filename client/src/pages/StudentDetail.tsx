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
import { Loader2, ArrowLeft, Edit2 } from "lucide-react";
import { toast } from "sonner";

export default function StudentDetail() {
  const { studentId } = useParams<{ studentId: string }>();
  const [, navigate] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const studentQuery = trpc.students.getById.useQuery(
    { studentId: parseInt(studentId!) },
    { enabled: !!studentId }
  );

  const updateStudentMutation = trpc.students.update.useMutation();

  const handleUpdateStudent = async () => {
    if (!editName.trim()) {
      toast.error("受講生名を入力してください");
      return;
    }

    try {
      await updateStudentMutation.mutateAsync({
        studentId: parseInt(studentId!),
        name: editName,
        notes: editNotes,
      });
      setIsEditing(false);
      toast.success("受講生情報を更新しました");
      studentQuery.refetch();
    } catch (error) {
      toast.error("更新に失敗しました");
    }
  };

  if (studentQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!studentQuery.data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-foreground font-medium mb-4">
            受講生が見つかりません
          </p>
          <Button onClick={() => navigate("/dashboard")}>
            ダッシュボードに戻る
          </Button>
        </div>
      </div>
    );
  }

  const student = studentQuery.data;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              戻る
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {student.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                受講生プロフィール
              </p>
            </div>
          </div>
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => {
                  setEditName(student.name);
                  setEditNotes(student.notes || "");
                }}
              >
                <Edit2 className="w-4 h-4" />
                編集
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>受講生情報を編集</DialogTitle>
                <DialogDescription>
                  受講生の基本情報を編集します
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">受講生名</Label>
                  <Input
                    id="edit-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-notes">メモ</Label>
                  <Textarea
                    id="edit-notes"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleUpdateStudent}
                  disabled={updateStudentMutation.isPending}
                  className="w-full"
                >
                  {updateStudentMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      更新中...
                    </>
                  ) : (
                    "更新"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Photo Section */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">顔写真</CardTitle>
              </CardHeader>
              <CardContent>
                {student.photoUrl ? (
                  <div className="space-y-4">
                    <img
                      src={student.photoUrl}
                      alt={student.name}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => navigate(`/student/${student.id}/edit-photo`)}
                    >
                      写真を変更
                    </Button>
                  </div>
                ) : (
                  <div className="bg-muted rounded-lg p-8 text-center">
                    <p className="text-muted-foreground mb-4">
                      顔写真がまだ登録されていません
                    </p>
                    <Button
                      size="sm"
                      onClick={() => navigate(`/student/${student.id}/edit-photo`)}
                    >
                      写真をアップロード
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Info Section */}
          <div className="md:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">基本情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">
                    受講生名
                  </Label>
                  <p className="text-foreground font-medium">{student.name}</p>
                </div>
                {student.notes && (
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      メモ
                    </Label>
                    <p className="text-foreground whitespace-pre-wrap">
                      {student.notes}
                    </p>
                  </div>
                )}
                <div>
                  <Label className="text-sm text-muted-foreground">
                    登録日
                  </Label>
                  <p className="text-foreground">
                    {new Date(student.createdAt).toLocaleDateString("ja-JP")}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">
                    最終更新日
                  </Label>
                  <p className="text-foreground">
                    {new Date(student.updatedAt).toLocaleDateString("ja-JP")}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Personality Data Section */}
            {student.personalityData && Object.keys(student.personalityData).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">性格情報</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(student.personalityData).map(([key, value]) => (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-1">
                          <Label className="text-sm text-muted-foreground">
                            {key}
                          </Label>
                          <span className="text-sm font-medium">{value}/10</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${(value / 10) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
