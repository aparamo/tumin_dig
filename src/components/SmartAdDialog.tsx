"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";
import { ExternalLink, X } from "lucide-react";

const MUTE_KEY = "tumin_smart_ads_mute_date";

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function seenKey(adId: string) {
  return `tumin_smart_ad_seen_${adId}`;
}

function legacyDismissKey(adId: string) {
  return `tumin_smart_ad_${adId}`;
}

function isMutedToday() {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(MUTE_KEY) === todayKey();
}

function isSeenToday(adId: string) {
  if (typeof window === "undefined") return true;
  const today = todayKey();
  if (window.localStorage.getItem(seenKey(adId)) === today) return true;
  // Migrate permanent dismiss from previous implementation → treat as seen today
  if (window.localStorage.getItem(legacyDismissKey(adId)) === "1") {
    window.localStorage.setItem(seenKey(adId), today);
    window.localStorage.removeItem(legacyDismissKey(adId));
    return true;
  }
  return false;
}

function markSeen(adId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(seenKey(adId), todayKey());
}

function muteForToday() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MUTE_KEY, todayKey());
}

type SmartAdRow = {
  id: string;
  title: string;
  body: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
};

function pickAd(ads: SmartAdRow[]): SmartAdRow | null {
  if (isMutedToday()) return null;
  return ads.find((ad) => !isSeenToday(ad.id)) ?? null;
}

export function SmartAdDialog() {
  const { data: ads = [] } = trpc.smartAds.getForMe.useQuery();
  const [tick, setTick] = useState(0);
  const [muteChecked, setMuteChecked] = useState(false);

  // `tick` forces re-evaluation of localStorage-backed pick after close/mute
  void tick;
  const currentAd = pickAd(ads);
  const open = !!currentAd;

  const handleClose = () => {
    if (!currentAd) return;
    markSeen(currentAd.id);
    if (muteChecked) muteForToday();
    setMuteChecked(false);
    setTick((t) => t + 1);
  };

  if (!currentAd) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="uppercase font-black tracking-tight">
            {currentAd.title}
          </DialogTitle>
          {currentAd.body && (
            <DialogDescription className="font-medium">{currentAd.body}</DialogDescription>
          )}
        </DialogHeader>
        {currentAd.imageUrl && (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border-2 border-border">
            <Image src={currentAd.imageUrl} alt={currentAd.title} fill className="object-cover" />
          </div>
        )}
        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground cursor-pointer">
          <Checkbox
            checked={muteChecked}
            onCheckedChange={(checked) => setMuteChecked(checked === true)}
          />
          No mostrar más publicidad por hoy
        </label>
        <DialogFooter className="gap-2">
          {currentAd.linkUrl && (
            <Button asChild className="font-black uppercase">
              <a href={currentAd.linkUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" /> Ver más
              </a>
            </Button>
          )}
          <Button variant="outline" onClick={handleClose} className="font-black uppercase">
            <X className="w-4 h-4 mr-2" /> Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
