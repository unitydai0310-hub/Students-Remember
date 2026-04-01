import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Upload, X } from "lucide-react";
import { toast } from "sonner";

export default function EditStudentPhoto() {
  const { studentId } = useParams<{ studentId: string }>();
  const [, navigate] = useLocation();
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const studentQuery = trpc.students.getById.useQuery(
    { studentId: parseInt(studentId!) },
    { enabled: !!studentId }
  );

  const updateStudentMutation = trpc.students.update.useMutation();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("画像ファイルを選択してください");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("ファイルサイズは5MB以下にしてください");
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("ファイルを選択してください");
      return;
    }

    setIsUploading(true);
    try {
      // Convert file to base64 for upload
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;

        // Call upload API
        const response = await fetch("/api/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            file: base64,
            fileName: selectedFile.name,
          }),
        });

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        const { photoUrl, photoKey } = await response.json();

        // Update student with photo URL
        await updateStudentMutation.mutateAsync({
          studentId: parseInt(studentId!),
          photoUrl,
          photoKey,
        });

        toast.success("顔写真をアップロードしました");
        navigate(`/student/${studentId}`);
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("アップロードに失敗しました");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    setPreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
        <div className="container py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/student/${studentId}`)}
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
              顔写真をアップロード
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>顔写真をアップロード</CardTitle>
              <CardDescription>
                JPG、PNG形式の画像ファイル（最大5MB）
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Photo */}
              {student.photoUrl && !preview && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-3">
                    現在の顔写真
                  </p>
                  <img
                    src={student.photoUrl}
                    alt={student.name}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Preview */}
              {preview && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-3">
                    プレビュー
                  </p>
                  <div className="relative">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleClear}
                      className="absolute top-2 right-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Upload Area */}
              {!preview && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors"
                >
                  <div className="mb-4">
                    <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                  </div>
                  <p className="text-foreground font-medium mb-1">
                    ここにファイルをドラッグ＆ドロップ
                  </p>
                  <p className="text-sm text-muted-foreground">
                    またはクリックして選択
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/student/${studentId}`)}
                  className="flex-1"
                >
                  キャンセル
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!preview || isUploading}
                  className="flex-1"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      アップロード中...
                    </>
                  ) : (
                    "アップロード"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
