import type { Metadata } from "next";
import InviteLanding from "../InviteLanding";

export const metadata: Metadata = {
  title: "Ga betaald bij top restaurants eten · Dinely",
  description: "Download de Dinely app, deel content en verdien met deals bij de leukste restaurants.",
  openGraph: {
    title: "Ga betaald bij top restaurants eten",
    description: "Download de Dinely app, deel content en verdien met deals bij de leukste restaurants.",
    url: "https://app.dinely.nl/voor-creators",
    siteName: "Dinely",
    locale: "nl_NL",
    type: "website",
  },
};

export default function Page() {
  return <InviteLanding variant="creator" />;
}
