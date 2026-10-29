import { describe, it, expect } from "vitest";
import { loginFoutmelding } from "./loginError";

describe("loginFoutmelding", () => {
  it("vertaalt een ongeldig nummer", () => {
    expect(loginFoutmelding("auth/invalid-phone-number")).toMatch(/geldig Nederlands/);
  });

  it("vat reCAPTCHA/app-credential-fouten samen als beveiligingscontrole", () => {
    const m = loginFoutmelding("auth/invalid-app-credential");
    expect(m).toMatch(/Beveiligingscontrole/);
    expect(loginFoutmelding("auth/captcha-check-failed")).toBe(m);
  });

  it("meldt configuratie/facturatie als tijdelijk niet beschikbaar", () => {
    expect(loginFoutmelding("auth/operation-not-allowed")).toMatch(/tijdelijk niet beschikbaar/);
    expect(loginFoutmelding("auth/billing-not-enabled")).toMatch(/tijdelijk niet beschikbaar/);
  });

  it("toont een onbekende foutcode klein mee (zonder auth/-prefix)", () => {
    expect(loginFoutmelding("auth/internal-error")).toBe(
      "Er ging iets mis. Probeer het opnieuw. (foutcode: internal-error)"
    );
  });

  it("valt terug op de nette melding als er geen code is", () => {
    expect(loginFoutmelding("")).toBe("Er ging iets mis. Probeer het opnieuw.");
  });
});
