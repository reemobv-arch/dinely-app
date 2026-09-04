import type { Metadata } from "next";
import InviteLanding from "../InviteLanding";

export const metadata: Metadata = {
  title: "Boost jouw restaurant · Dinely",
  description: "Laat creators jouw restaurant laten zien en vul je avonden. Zet een deal uit met Dinely.",
  openGraph: {
    title: "Boost jouw restaurant met Dinely",
    description: "Laat creators jouw restaurant laten zien en vul je avonden. Zet een deal uit met Dinely.",
    url: "https://app.dinely.nl/voor-restaurants",
    siteName: "Dinely",
    locale: "nl_NL",
    type: "website",
    images: [{ url: "/og-invite.jpg", width: 1200, height: 630, alt: "Dinely" }],
  },
};

export default function Page() {
  return <InviteLanding variant="restaurant" />;
}
