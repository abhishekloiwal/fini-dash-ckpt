import { FileTextIcon, MessageSquareIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { PromptType } from "@/polymet/data/prompt-data";

interface PromptCardProps {
  prompt: PromptType;
  isSelected?: boolean;
  onClick?: () => void;
}

export function PromptCard({
  prompt,
  isSelected = false,
  onClick,
}: PromptCardProps) {
  const Icon = prompt.icon === "file" ? FileTextIcon : MessageSquareIcon;

  return (
    <Card
      className={`p-6 cursor-pointer transition-all hover:border-primary ${
        isSelected ? "border-primary border-2" : "border-border"
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-muted">
          <Icon className="w-6 h-6 text-foreground" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-base mb-1">{prompt.name}</h3>
          <p className="text-sm text-muted-foreground">{prompt.description}</p>
        </div>
      </div>
    </Card>
  );
}
