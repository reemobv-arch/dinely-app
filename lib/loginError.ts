// Vertaalt Firebase-foutcodes bij het sms-inloggen naar begrijpelijke meldingen.
// Houd dit synchroon met de echte foutcodes van firebase/auth phone-sign-in.
export function loginFoutmelding(code: string): string {
  switch (code) {
    case "auth/invalid-phone-number":
      return "Dit lijkt geen geldig Nederlands mobiel nummer.";
    case "auth/missing-phone-number":
      return "Vul eerst je telefoonnummer in.";
    case "auth/too-many-requests":
      return "Te veel pogingen. Probeer het over een paar minuten opnieuw.";
    case "auth/invalid-verification-code":
      return "Onjuiste code. Controleer de code uit de sms.";
    case "auth/code-expired":
      return "De code is verlopen. Vraag een nieuwe aan.";
    case "auth/quota-exceeded":
      return "De daglimiet voor sms is bereikt. Probeer het later opnieuw.";
    // reCAPTCHA / app-verificatie mislukt. Vaak een verlopen token of een
    // domein dat niet in Firebase staat -> opnieuw proberen na verversen.
    case "auth/captcha-check-failed":
    case "auth/invalid-app-credential":
    case "auth/missing-app-credential":
      return "Beveiligingscontrole mislukt. Ververs de pagina (sleep omlaag) en probeer opnieuw.";
    // Server-side configuratie: sms-inloggen staat uit of facturatie ontbreekt.
    case "auth/operation-not-allowed":
    case "auth/billing-not-enabled":
      return "Inloggen met sms is tijdelijk niet beschikbaar. We zijn ervan op de hoogte.";
    case "auth/network-request-failed":
      return "Geen verbinding. Controleer je internet en probeer opnieuw.";
    default:
      // Onbekende code: toon 'm klein mee, zodat we gericht kunnen helpen.
      return code
        ? `Er ging iets mis. Probeer het opnieuw. (foutcode: ${code.replace(/^auth\//, "")})`
        : "Er ging iets mis. Probeer het opnieuw.";
  }
}
