import { getAd } from "@/lib/ads";
import { cn } from "@/lib/utils";

/** Renders one sponsored ad for a placement, or nothing when none is booked. */
export default async function AdSlot({ placement, className }: { placement: string; className?: string }) {
  const ad = await getAd(placement);
  if (!ad) return null;
  return (
    <aside aria-label="Sponsored" className={cn("card3d overflow-hidden", className)}>
      <a href={`/api/ads/${ad.id}/click`} target="_blank" rel="sponsored noopener noreferrer" className="block">
        {ad.imageUrl && /* eslint-disable-next-line @next/next/no-img-element */ <img src={ad.imageUrl} alt={ad.title} className="max-h-48 w-full object-cover" loading="lazy" />}
        <div className="p-3">
          <p className="text-[10px] uppercase tracking-widest text-white/40">Sponsored</p>
          <p className="font-semibold">{ad.title}</p>
          {ad.body && <p className="mt-0.5 line-clamp-2 text-sm text-white/60">{ad.body}</p>}
        </div>
      </a>
    </aside>
  );
}
