import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted px-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <div className="inline-block p-4 bg-primary/10 rounded-full mb-4">
              <svg
                className="w-12 h-12 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 12H9m6 0a6 6 0 11-12 0 6 6 0 0112 0z"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Students Remember
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              受講生の顔写真・性格情報を管理し、グループ分けを支援するアプリ
            </p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-6 w-6 rounded-md bg-primary text-primary-foreground">
                  ✓
                </div>
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">顔写真管理</p>
                <p className="text-sm text-muted-foreground">
                  受講生の顔写真を登録・管理
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-6 w-6 rounded-md bg-primary text-primary-foreground">
                  ✓
                </div>
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">性格分析</p>
                <p className="text-sm text-muted-foreground">
                  性格情報を記録・分析
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-6 w-6 rounded-md bg-primary text-primary-foreground">
                  ✓
                </div>
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">グループ分け</p>
                <p className="text-sm text-muted-foreground">
                  最適なグループ分けを提案
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-6 w-6 rounded-md bg-primary text-primary-foreground">
                  ✓
                </div>
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">チーム共有</p>
                <p className="text-sm text-muted-foreground">
                  運営チーム8名で情報を共有
                </p>
              </div>
            </div>
          </div>

          <a href={getLoginUrl()}>
            <Button size="lg" className="w-full">
              ログインして開始
            </Button>
          </a>

          <p className="text-xs text-muted-foreground mt-4">
            Manus OAuth で安全にログインできます
          </p>
        </div>
      </div>
    );
  }

  return null;
}
