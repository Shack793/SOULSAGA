import { IMAGE_SPECS } from "@/lib/images";

export const Err = ({ msg }: { msg?: string }) => msg ? <p role="alert" className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{msg}</p> : null;
export const Field = ({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) => (
  <div><label className="label">{label}</label>{children}{hint && <p className="mt-1 text-xs text-white/50">{hint}</p>}</div>
);
export const imgHint = (k: keyof typeof IMAGE_SPECS) => IMAGE_SPECS[k].note;
export const Del = ({ action, id, label = "Delete" }: { action: (fd: FormData) => Promise<void>; id: string; label?: string }) => (
  <form action={action}><input type="hidden" name="id" value={id} /><button className="rounded-full bg-red-500/15 px-3 py-1 text-xs text-red-200">{label}</button></form>
);
