import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAddItem } from "./use-add-item";

export function AddItemInput() {
  const { input, setInput, isProcessing, handleSubmit } = useAddItem();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit();
  };

  return (
    <form
      className="sticky bottom-0 border-t bg-background p-4"
      onSubmit={onSubmit}
    >
      <div className="flex gap-2">
        <Input
          className="flex-1"
          disabled={isProcessing}
          onChange={(e) => setInput(e.target.value)}
          placeholder="np. 2 kg jabłek na szarlotkę"
          value={input}
        />
        <Button disabled={isProcessing || !input.trim()} type="submit">
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      </div>
    </form>
  );
}
