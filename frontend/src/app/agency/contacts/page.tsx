import { Topbar } from "@/components/layout/Topbar";
import { ContactTable } from "@/components/contacts/ContactTable";
import { getLeads } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const leads = await getLeads();

  return (
    <>
      <Topbar title="Contacts" subtitle={`${leads.length} contacts`} />
      <div className="flex-1 overflow-y-auto p-5">
        <div className="bg-surface border border-border1 rounded-lg shadow-sm">
          <div className="px-4 pt-3.5 pb-3 border-b border-border1">
            <div className="text-[13px] font-bold">All Contacts</div>
          </div>
          <ContactTable leads={leads} />
        </div>
      </div>
    </>
  );
}
