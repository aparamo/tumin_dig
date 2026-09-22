"use client";

import { CommunicateButton } from "@/components/contact/CommunicateButton";
import type { PublicContactMethod } from "@/lib/contact-links";

export function PublicProfileCommunicate({
  userId,
  displayName,
  contactMethods,
}: {
  userId: string;
  displayName: string;
  contactMethods: PublicContactMethod[];
}) {
  return (
    <CommunicateButton
      target={{
        userId,
        displayName,
        contactMethods,
        messageText: `Hola ${displayName}, te contacto desde Túmin digital.`,
      }}
      variant="default"
      className="w-full sm:w-auto"
    />
  );
}
