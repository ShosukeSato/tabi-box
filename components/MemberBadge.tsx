"use client";

import { Member } from "@/lib/types";

interface MemberBadgeProps {
  member: Member | null;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
}

const sizeMap = {
  sm: "w-6 h-6 text-xs",
  md: "w-8 h-8 text-base",
  lg: "w-11 h-11 text-xl",
};

export default function MemberBadge({
  member,
  size = "md",
  showName = false,
}: MemberBadgeProps) {
  if (!member) {
    return (
      <div className="flex items-center gap-1.5">
        <div
          className={`${sizeMap[size]} rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center`}
        >
          <span className="opacity-50">?</span>
        </div>
        {showName && (
          <span className="text-xs text-muted">未割当</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`${sizeMap[size]} rounded-full flex items-center justify-center shrink-0 shadow-sm`}
        style={{
          backgroundColor: member.color + "18",
          border: `2px solid ${member.color}`,
        }}
        title={member.name}
      >
        <span>{member.avatar_emoji}</span>
      </div>
      {showName && (
        <span className="text-sm font-medium text-gray-700 truncate max-w-[80px]">
          {member.name}
        </span>
      )}
    </div>
  );
}
