import { useState } from "react";
import { Calendar } from "lucide-react";
import type { CtsSession } from "@/lib/types";
import { useApiResource } from "@/lib/useApiResource";
import { useI18n } from "@/i18n";
import { SessionCard } from "@/components/SessionCard";
import { EmptyState, ErrorBlock, LoadingBlock, PageHeader } from "@/components/ui";

export function ParticipantSessions() {
  const { t } = useI18n();
  const resource = useApiResource<{ sessions: CtsSession[] }>("/sessions");
  const [openThread, setOpenThread] = useState<string | null>(null);

  if (resource.loading && !resource.data) return <LoadingBlock />;
  if (resource.error && !resource.data)
    return <ErrorBlock message={resource.error} onRetry={resource.reload} />;
  const sessions = resource.data?.sessions ?? [];

  return (
    <div className="space-y-5">
      <PageHeader title={t("sess.title")} subtitle={t("sess.psubtitle")} />

      {sessions.length === 0 ? (
        <div className="bg-white rounded-xl border border-line-soft">
          <EmptyState icon={<Calendar size={32} />} message={t("sess.pempty")} />
        </div>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              discussionOpen={openThread === session.id}
              onToggleDiscussion={() =>
                setOpenThread((cur) => (cur === session.id ? null : session.id))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
