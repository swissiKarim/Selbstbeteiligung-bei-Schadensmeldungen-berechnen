/**
 * Versicherungs-Schadensmeldung – Berechnungs- und Validierungslogik
 */

/** Gültige Tarife */
export type Tarif = "basis" | "komfort" | "premium";

/** Ergebnis der Auszahlungsberechnung */
export interface BerechnungsErgebnis {
  /** Berechnete Auszahlung in EUR (nach Selbstbeteiligung, Rundung, Obergrenze) */
  auszahlung: number;
  /** Angewendete Selbstbeteiligung in EUR */
  selbstbeteiligung: number;
  /** true, wenn die Auszahlung durch die Tarifobergrenze gekürzt wurde */
  gekuerzt: boolean;
}

/** Selbstbeteiligungen je Tarif in EUR-Cent (Integer-Arithmetik) */
const SELBSTBETEILIGUNG_CENT: Record<Tarif, number> = {
  basis: 50000,    // 500,00 EUR
  komfort: 25000,  // 250,00 EUR
  premium: 10000,  // 100,00 EUR
};

/** Auszahlungsobergrenzen je Tarif in EUR-Cent (Integer-Arithmetik) */
const OBERGRENZE_CENT: Record<Tarif, number> = {
  basis: 500000,    //  5.000,00 EUR
  komfort: 2000000, // 20.000,00 EUR
  premium: 5000000, // 50.000,00 EUR
};

/** Gültige Tarif-Werte als Set für schnelle Prüfung */
const GUELTIGE_TARIFE = new Set<string>(["basis", "komfort", "premium"]);

/**
 * Rundet einen Cent-Betrag (Fließkommazahl) kaufmännisch (half-up) auf
 * den nächsten ganzzahligen Cent-Wert.
 * Verwendet Math.round, das in JavaScript "half away from zero" implementiert,
 * was für positive Zahlen identisch mit "half-up" ist.
 */
function rundeAufCent(cent: number): number {
  return Math.round(cent);
}

/**
 * Berechnet die Auszahlung für eine Versicherungs-Schadensmeldung.
 *
 * @param schadenshoehe - Schadenshöhe in EUR (muss eine nicht-negative Zahl sein)
 * @param tarif         - Gewählter Tarif ('basis' | 'komfort' | 'premium')
 * @returns BerechnungsErgebnis mit Auszahlung, Selbstbeteiligung und Kürzungsindikator
 * @throws Error mit deutschsprachiger Fehlermeldung bei ungültigen Eingaben
 */
export function berechneAuszahlung(
  schadenshoehe: number,
  tarif: Tarif
): BerechnungsErgebnis {
  // --- Eingabevalidierung ---
  if (typeof schadenshoehe !== "number" || isNaN(schadenshoehe)) {
    throw new Error(
      "Ungültige Schadenshöhe: Der Wert ist keine gültige Zahl."
    );
  }
  if (!isFinite(schadenshoehe)) {
    throw new Error(
      "Ungültige Schadenshöhe: Der Wert muss eine endliche Zahl sein."
    );
  }
  if (schadenshoehe < 0) {
    throw new Error(
      "Ungültige Schadenshöhe: Der Betrag darf nicht negativ sein."
    );
  }
  if (!GUELTIGE_TARIFE.has(tarif)) {
    throw new Error(
      `Ungültiger Tarif: '${tarif}' ist kein gültiger Tarif. Erlaubte Werte: basis, komfort, premium.`
    );
  }

  // --- Berechnung in ganzzahligen Cent ---
  const schadenahoeeCent = rundeAufCent(schadenshoehe * 100);
  const selbstbeteiligungCent = SELBSTBETEILIGUNG_CENT[tarif];
  const obergenzeCent = OBERGRENZE_CENT[tarif];

  // Auszahlung = Schadenshöhe − Selbstbeteiligung, mindestens 0
  let auszahlungCent = Math.max(0, schadenahoeeCent - selbstbeteiligungCent);

  // Auszahlungsobergrenze prüfen
  const gekuerzt = auszahlungCent > obergenzeCent;
  if (gekuerzt) {
    auszahlungCent = obergenzeCent;
  }

  // Ergebnis in EUR (auf 2 Nachkommastellen)
  const auszahlung = auszahlungCent / 100;
  const selbstbeteiligung = selbstbeteiligungCent / 100;

  return { auszahlung, selbstbeteiligung, gekuerzt };
}
