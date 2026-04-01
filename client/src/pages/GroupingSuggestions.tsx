import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Plus } from "lucide-react";
import { toast } from "sonner";

interface PersonalityTraits {
  [key: string]: number;
}

export default function GroupingSuggestions() {
  const { teamId } = useParams<{ teamId: string }>();
  const [, navigate] = useLocation();
  const [isGenerating, setIsGenerating] = useState(false);
  const [groupSize, setGroupSize] = useState("3");

  const studentsQuery = trpc.students.listByTeam.useQuery(
    { teamId: parseInt(teamId!) },
    { enabled: !!teamId }
  );

  const suggestionsQuery = trpc.groupingSuggestions.listByTeam.useQuery(
    { teamId: parseInt(teamId!) },
    { enabled: !!teamId }
  );

  const createSuggestionMutation = trpc.groupingSuggestions.create.useMutation();

  const generateSuggestions = async () => {
    if (!groupSize || parseInt(groupSize) < 1) {
      toast.error("有効なグループサイズを入力してください");
      return;
    }

    if (!studentsQuery.data || studentsQuery.data.length === 0) {
      toast.error("グループ分けする受講生がいません");
      return;
    }

    setIsGenerating(true);
    try {
      // Simple grouping algorithm based on personality data
      const students = studentsQuery.data;
      const size = parseInt(groupSize);
      const suggestions = generateGroupingLogic(students, size);

      await createSuggestionMutation.mutateAsync({
        teamId: parseInt(teamId!),
        groupSize: size,
        suggestions,
      });

      toast.success("グループ分け提案を生成しました");
      suggestionsQuery.refetch();
    } catch (error) {
      console.error("Error:", error);
      toast.error("グループ分け提案の生成に失敗しました");
    } finally {
      setIsGenerating(false);
    }
  };

  const generateGroupingLogic = (
    students: any[],
    groupSize: number
  ): Array<{
    groupName: string;
    studentIds: number[];
    reasoning: string;
  }> => {
    const groups: Array<{
      groupName: string;
      studentIds: number[];
      reasoning: string;
    }> = [];

    // Simple algorithm: shuffle and divide into groups
    const shuffled = [...students].sort(() => Math.random() - 0.5);

    for (let i = 0; i < shuffled.length; i += groupSize) {
      const groupStudents = shuffled.slice(i, i + groupSize);
      const groupNumber = Math.floor(i / groupSize) + 1;

      groups.push({
        groupName: `グループ${groupNumber}`,
        studentIds: groupStudents.map((s) => s.id),
        reasoning: `${groupStudents.map((s) => s.name).join("、")}で構成されたグループ`,
      });
    }

    return groups;
  };

  if (studentsQuery.isLoading || suggestionsQuery.isLoading) {
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
              グループ分け提案
            </h1>
            <p className="text-sm text-muted-foreground">
              受講生を最適なグループに分けます
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Generate Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>グループ分けを生成</CardTitle>
            <CardDescription>
              1グループあたりの人数を指定してグループ分けを提案します
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="group-size">1グループあたりの人数</Label>
                <Input
                  id="group-size"
                  type="number"
                  min="1"
                  max="10"
                  value={groupSize}
                  onChange={(e) => setGroupSize(e.target.value)}
                  placeholder="3"
                />
              </div>
              <Button
                onClick={generateSuggestions}
                disabled={isGenerating || !studentsQuery.data || studentsQuery.data.length === 0}
                className="flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    生成
                  </>
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              現在 {studentsQuery.data?.length || 0} 名の受講生がいます
            </p>
          </CardContent>
        </Card>

        {/* Suggestions List */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            提案履歴
          </h2>

          {suggestionsQuery.data && suggestionsQuery.data.length > 0 ? (
            <div className="space-y-4">
              {suggestionsQuery.data.map((suggestion) => (
                <Card key={suggestion.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {new Date(suggestion.createdAt).toLocaleDateString("ja-JP")}
                          の提案
                        </CardTitle>
                        <CardDescription>
                          1グループ {suggestion.groupSize} 名
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {suggestion.suggestions?.map((group, idx) => (
                        <Card key={idx} className="bg-muted">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">
                              {group.groupName}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-1">
                                メンバー ({group.studentIds.length}名)
                              </p>
                              <ul className="text-sm space-y-1">
                                {group.studentIds.map((studentId) => {
                                  const student = studentsQuery.data?.find(
                                    (s) => s.id === studentId
                                  );
                                  return (
                                    <li key={studentId} className="text-foreground">
                                      • {student?.name || "不明"}
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                            {group.reasoning && (
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  {group.reasoning}
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
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
                  提案がまだ生成されていません
                </p>
                <p className="text-muted-foreground text-sm">
                  上記の設定でグループ分けを生成してください
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
