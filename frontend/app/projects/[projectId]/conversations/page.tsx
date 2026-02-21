import { MessageSquare } from "lucide-react";

export default function ConversationsPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center px-4">
      <div className="bg-muted mb-4 flex size-16 items-center justify-center rounded-full">
        <MessageSquare className="text-muted-foreground size-8" />
      </div>
      <h2 className="text-xl font-semibold">Chọn cuộc hội thoại</h2>
      <p className="text-muted-foreground mt-2 max-w-sm text-sm">
        Chọn một cuộc hội thoại từ danh sách bên trái hoặc tạo cuộc hội thoại
        mới để bắt đầu.
      </p>
    </div>
  );
}
