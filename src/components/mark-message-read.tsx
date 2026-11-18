"use client";
import { useEffect } from "react";
import { markMessageRead } from "@/app/dashboard/messages/actions";
export function MarkMessageRead({ id }: { id: string }) {
  useEffect(() => {
    void markMessageRead(id);
  }, [id]);
  return null;
}
