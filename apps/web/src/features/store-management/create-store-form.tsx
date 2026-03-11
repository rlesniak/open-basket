"use client";

import { IconLoader2, IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateStoreFormProps {
  isPending: boolean;
  onSubmit: (name: string) => void;
}

export function CreateStoreForm({ isPending, onSubmit }: CreateStoreFormProps) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
      setName("");
    }
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="store-name">Store Name</Label>
        <div className="flex gap-2">
          <Input
            className="flex-1"
            disabled={isPending}
            id="store-name"
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter store name..."
            value={name}
          />
          <Button disabled={isPending || !name.trim()} type="submit">
            {isPending ? (
              <IconLoader2 className="animate-spin" />
            ) : (
              <IconPlus />
            )}
            Add Store
          </Button>
        </div>
      </div>
    </form>
  );
}
