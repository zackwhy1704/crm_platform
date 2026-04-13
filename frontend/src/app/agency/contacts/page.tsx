import { Topbar } from "@/components/layout/Topbar";
import { ContactTable } from "@/components/contacts/ContactTable";
import { mockLeads } from "@/lib/mock-data";

export default function ContactsPage() {
  return (
    <>
      <Topbar title="Contacts" subtitle="48 contacts · 12 new this week" />
      <div className="flex-1 overflow-y-auto p-5">
        <div className="bg-surface border border-border1 rounded-lg shadow-sm">
          <div className="px-4 pt-3.5 pb-3 border-b border-border1">
            <div className="text-[13px] font-bold">All Contacts</div>
          </div>
          <ContactTable leads={mockLeads} />
        </div>
      </div>
    </>
  );
}
