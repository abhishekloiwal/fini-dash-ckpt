import { UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AdditionalSettings() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Additional Settings</h1>
          <Select defaultValue="mariposa">
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <UploadIcon className="w-4 h-4" />

                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mariposa">Mariposa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Chat language{" "}
              <span className="text-muted-foreground font-normal">
                For chat and questions
              </span>
            </label>
            <Select defaultValue="en">
              <SelectTrigger className="w-full border-2 border-blue-500 focus:ring-2 focus:ring-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English [en]</SelectItem>
                <SelectItem value="es">Spanish [es]</SelectItem>
                <SelectItem value="fr">French [fr]</SelectItem>
                <SelectItem value="de">German [de]</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-center">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 px-8">
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
