import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Plus, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export default function TeamManagement() {
  const { teamId } = useParams<{ teamId: string }>();
  const [, navigate] = useLocation();
  const [isInviting, setIsInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [copiedInviteLink, setCopiedInviteLink] = useState(false);

  const teamQuery = trpc.teams.getById.useQuery(
    { teamId: parseInt(teamId!) },
    { enabled: !!teamId }
  );

  const membersQuery = trpc.teams.getMembers.useQuery(
    { teamId: parseInt(teamId!) },
    { enabled: !!teamId }
  );

  const addMemberMutation = trpc.teams.addMember.useMutation();

  const handleAddMember = async () => {
    if (!inviteEmail.trim()) {
      toast.error("メールアドレスを入力してください");
      return;
    }

    try {
      // In a real app, you would send an invitation email
      // For now, we'll just add the member directly
      await addMemberMutation.mutateAsync({
        teamId: parseInt(teamId!),
        userId: 0, // This would be resolved from email in a real app
        role: "member",
      });
      setInviteEmail("");
      setIsInviting(false);
      toast.success("メンバーを追加しました");
      membersQuery.refetch();
    } catch (error) {
      toast.error("メンバー追加に失敗しました");
    }
  };

  const handleCopyInviteLink = () => {
    const inviteLink = `${window.location.origin}/team/${teamId}/join`;
    navigator.clipboard.writeText(inviteLink);
    setCopiedInviteLink(true);
    setTimeout(() => setCopiedInviteLink(false), 2000);
    toast.success("招待リンクをコピーしました");
  };

  if (teamQuery.isLoading || membersQuery.isLoading) {
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
        <div className="container py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/team/${teamId}`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            戻る
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {teamQuery.data.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              チーム管理
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Invite Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>チームメンバーを招待</CardTitle>
            <CardDescription>
              運営チームに新しいメンバーを追加します（最大8名）
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>招待リンク</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={`${window.location.origin}/team/${teamId}/join`}
                  className="bg-muted"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyInviteLink}
                  className="flex items-center gap-2"
                >
                  {copiedInviteLink ? (
                    <>
                      <Check className="w-4 h-4" />
                      コピー済み
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      コピー
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                このリンクをチームメンバーに共有してください
              </p>
            </div>

            <Dialog open={isInviting} onOpenChange={setIsInviting}>
              <DialogTrigger asChild>
                <Button className="w-full flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  メンバーを追加
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>メンバーを追加</DialogTitle>
                  <DialogDescription>
                    メールアドレスでメンバーを招待します
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="invite-email">メールアドレス</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      placeholder="member@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleAddMember}
                    disabled={addMemberMutation.isPending}
                    className="w-full"
                  >
                    {addMemberMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        招待中...
                      </>
                    ) : (
                      "招待を送信"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Members List */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            チームメンバー
          </h2>

          {membersQuery.data && membersQuery.data.length > 0 ? (
            <div className="space-y-2">
              {membersQuery.data.map((member) => (
                <Card key={member.id}>
                  <CardContent className="py-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">
                        ユーザーID: {member.userId}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        役割: {member.role === "admin" ? "管理者" : "メンバー"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        参加日: {new Date(member.joinedAt).toLocaleDateString("ja-JP")}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-3 py-1 bg-muted rounded-full text-sm">
                        {member.role === "admin" ? "管理者" : "メンバー"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <p className="text-foreground font-medium mb-2">
                  メンバーがまだ追加されていません
                </p>
                <p className="text-muted-foreground text-sm">
                  招待リンクを使用してメンバーを追加してください
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
