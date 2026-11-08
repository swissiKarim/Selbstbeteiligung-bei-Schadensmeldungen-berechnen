import { berechneAuszahlung, Tarif, BerechnungsErgebnis } from "./index";

// ---------------------------------------------------------------------------
// Hilfsfunktion: Typ-Guard, um sicherzustellen, dass das Ergebnis korrekt ist
// ---------------------------------------------------------------------------
function istBerechnungsErgebnis(val: unknown): val is BerechnungsErgebnis {
  return (
    typeof val === "object" &&
    val !== null &&
    "auszahlung" in val &&
    "selbstbeteiligung" in val &&
    "gekuerzt" in val
  );
}

// ---------------------------------------------------------------------------
// User Story 1: Auszahlung berechnen
// ---------------------------------------------------------------------------
describe("US1 – Auszahlung berechnen", () => {
  describe("Selbstbeteiligungen je Tarif", () => {
    it("basis: Selbstbeteiligung beträgt 500 EUR", () => {
      const ergebnis = berechneAuszahlung(1000, "basis");
      expect(ergebnis.selbstbeteiligung).toBe(500);
    });

    it("komfort: Selbstbeteiligung beträgt 250 EUR", () => {
      const ergebnis = berechneAuszahlung(1000, "komfort");
      expect(ergebnis.selbstbeteiligung).toBe(250);
    });

    it("premium: Selbstbeteiligung beträgt 100 EUR", () => {
      const ergebnis = berechneAuszahlung(1000, "premium");
      expect(ergebnis.selbstbeteiligung).toBe(100);
    });
  });

  describe("Auszahlungsberechnung (Schadenshöhe − Selbstbeteiligung)", () => {
    it("basis: 1000 − 500 = 500 EUR", () => {
      expect(berechneAuszahlung(1000, "basis").auszahlung).toBe(500);
    });

    it("komfort: 1000 − 250 = 750 EUR", () => {
      expect(berechneAuszahlung(1000, "komfort").auszahlung).toBe(750);
    });

    it("premium: 1000 − 100 = 900 EUR", () => {
      expect(berechneAuszahlung(1000, "premium").auszahlung).toBe(900);
    });
  });

  describe("Auszahlung ist mindestens 0 EUR", () => {
    it("basis: Schaden 300 < Selbstbeteiligung 500 → 0 EUR", () => {
      expect(berechneAuszahlung(300, "basis").auszahlung).toBe(0);
    });

    it("komfort: Schaden 100 < Selbstbeteiligung 250 → 0 EUR", () => {
      expect(berechneAuszahlung(100, "komfort").auszahlung).toBe(0);
    });

    it("premium: Schaden 50 < Selbstbeteiligung 100 → 0 EUR", () => {
      expect(berechneAuszahlung(50, "premium").auszahlung).toBe(0);
    });
  });

  describe("Schadenshöhe von 0 EUR", () => {
    it("basis: Schaden 0 → Auszahlung 0 EUR", () => {
      expect(berechneAuszahlung(0, "basis").auszahlung).toBe(0);
    });

    it("komfort: Schaden 0 → Auszahlung 0 EUR", () => {
      expect(berechneAuszahlung(0, "komfort").auszahlung).toBe(0);
    });

    it("premium: Schaden 0 → Auszahlung 0 EUR", () => {
      expect(berechneAuszahlung(0, "premium").auszahlung).toBe(0);
    });
  });

  describe("Schadenshöhe genau in Höhe der Selbstbeteiligung → 0 EUR", () => {
    it("basis: Schaden 500 = Selbstbeteiligung → 0 EUR", () => {
      expect(berechneAuszahlung(500, "basis").auszahlung).toBe(0);
    });

    it("komfort: Schaden 250 = Selbstbeteiligung → 0 EUR", () => {
      expect(berechneAuszahlung(250, "komfort").auszahlung).toBe(0);
    });

    it("premium: Schaden 100 = Selbstbeteiligung → 0 EUR", () => {
      expect(berechneAuszahlung(100, "premium").auszahlung).toBe(0);
    });
  });

  describe("Kaufmännische Rundung (half-up, 2 Nachkommastellen)", () => {
    // 0,005 EUR Rundungsfall: Schadenshöhe 500,505 − 500 (basis) = 0,505 → rundet auf 0,51
    it("Rundungsfall 0,005 EUR: Schaden 500.505 (basis) → 0.51 EUR", () => {
      expect(berechneAuszahlung(500.505, "basis").auszahlung).toBe(0.51);
    });

    // Weitere Rundungsfälle
    it("Schaden 500.504 (basis) → rundet auf 0.50 EUR", () => {
      expect(berechneAuszahlung(500.504, "basis").auszahlung).toBe(0.5);
    });

    it("Schaden 1000.126 (basis) → 500.13 EUR (0.126 rundet auf 0.13)", () => {
      expect(berechneAuszahlung(1000.126, "basis").auszahlung).toBe(500.13);
    });

    it("Schaden 1000.124 (basis) → 500.12 EUR (0.124 rundet auf 0.12)", () => {
      expect(berechneAuszahlung(1000.124, "basis").auszahlung).toBe(500.12);
    });
  });

  describe("Ergebnisstruktur", () => {
    it("enthält auszahlung, selbstbeteiligung und gekuerzt", () => {
      const ergebnis = berechneAuszahlung(1000, "basis");
      expect(istBerechnungsErgebnis(ergebnis)).toBe(true);
    });

    it("gekuerzt ist false bei normaler Berechnung ohne Obergrenze", () => {
      expect(berechneAuszahlung(1000, "basis").gekuerzt).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// User Story 2: Auszahlungsobergrenze
// ---------------------------------------------------------------------------
describe("US2 – Auszahlungsobergrenze", () => {
  describe("Obergrenzen je Tarif", () => {
    it("basis: Obergrenze 5.000 EUR – Schaden 10.000 → Auszahlung 5.000", () => {
      const ergebnis = berechneAuszahlung(10000, "basis");
      expect(ergebnis.auszahlung).toBe(5000);
      expect(ergebnis.gekuerzt).toBe(true);
    });

    it("komfort: Obergrenze 20.000 EUR – Schaden 30.000 → Auszahlung 20.000", () => {
      const ergebnis = berechneAuszahlung(30000, "komfort");
      expect(ergebnis.auszahlung).toBe(20000);
      expect(ergebnis.gekuerzt).toBe(true);
    });

    it("premium: Obergrenze 50.000 EUR – Schaden 70.000 → Auszahlung 50.000", () => {
      const ergebnis = berechneAuszahlung(70000, "premium");
      expect(ergebnis.auszahlung).toBe(50000);
      expect(ergebnis.gekuerzt).toBe(true);
    });
  });

  describe("Auszahlung genau auf der Obergrenze", () => {
    it("basis: Schaden 5.500 → Auszahlung genau 5.000, nicht gekuerzt", () => {
      // 5500 − 500 = 5000 (genau auf Obergrenze)
      const ergebnis = berechneAuszahlung(5500, "basis");
      expect(ergebnis.auszahlung).toBe(5000);
      expect(ergebnis.gekuerzt).toBe(false);
    });

    it("komfort: Schaden 20.250 → Auszahlung genau 20.000, nicht gekuerzt", () => {
      // 20250 − 250 = 20000 (genau auf Obergrenze)
      const ergebnis = berechneAuszahlung(20250, "komfort");
      expect(ergebnis.auszahlung).toBe(20000);
      expect(ergebnis.gekuerzt).toBe(false);
    });

    it("premium: Schaden 50.100 → Auszahlung genau 50.000, nicht gekuerzt", () => {
      // 50100 − 100 = 50000 (genau auf Obergrenze)
      const ergebnis = berechneAuszahlung(50100, "premium");
      expect(ergebnis.auszahlung).toBe(50000);
      expect(ergebnis.gekuerzt).toBe(false);
    });
  });

  describe("Kürzungsindikator", () => {
    it("gekuerzt ist true, wenn Obergrenze überschritten wird", () => {
      expect(berechneAuszahlung(10000, "basis").gekuerzt).toBe(true);
    });

    it("gekuerzt ist false, wenn Obergrenze nicht überschritten wird", () => {
      expect(berechneAuszahlung(1000, "premium").gekuerzt).toBe(false);
    });

    it("gekuerzt ist false, wenn Auszahlung genau der Obergrenze entspricht", () => {
      // basis: 5500 − 500 = 5000 (= Obergrenze)
      expect(berechneAuszahlung(5500, "basis").gekuerzt).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// User Story 3: Eingaben prüfen und Fehler melden
// ---------------------------------------------------------------------------
describe("US3 – Eingaben prüfen und Fehler melden", () => {
  describe("Negative Schadenshöhe", () => {
    it("wirft Fehler bei negativer Schadenshöhe", () => {
      expect(() => berechneAuszahlung(-1, "basis")).toThrow();
    });

    it("Fehlermeldung enthält verständlichen deutschen Text", () => {
      expect(() => berechneAuszahlung(-100, "basis")).toThrow(
        /negativ/i
      );
    });

    it("führt nicht zu einem Berechnungsergebnis", () => {
      let ergebnis: BerechnungsErgebnis | undefined;
      try {
        ergebnis = berechneAuszahlung(-1, "basis");
      } catch {
        // erwartet
      }
      expect(ergebnis).toBeUndefined();
    });
  });

  describe("Keine Zahl als Schadenshöhe", () => {
    it("wirft Fehler bei NaN", () => {
      expect(() => berechneAuszahlung(NaN, "basis")).toThrow();
    });

    it("Fehlermeldung bei NaN enthält deutschen Text", () => {
      expect(() => berechneAuszahlung(NaN, "basis")).toThrow(
        /keine gültige Zahl/i
      );
    });

    it("wirft Fehler bei Infinity", () => {
      expect(() => berechneAuszahlung(Infinity, "basis")).toThrow();
    });

    it("Fehlermeldung bei Infinity enthält deutschen Text", () => {
      expect(() => berechneAuszahlung(Infinity, "basis")).toThrow(
        /endliche Zahl/i
      );
    });

    it("wirft Fehler bei -Infinity", () => {
      expect(() => berechneAuszahlung(-Infinity, "basis")).toThrow();
    });

    it("führt bei NaN zu keinem Berechnungsergebnis", () => {
      let ergebnis: BerechnungsErgebnis | undefined;
      try {
        ergebnis = berechneAuszahlung(NaN, "basis");
      } catch {
        // erwartet
      }
      expect(ergebnis).toBeUndefined();
    });
  });

  describe("Unbekannter Tarif", () => {
    it("wirft Fehler bei unbekanntem Tarif", () => {
      expect(() =>
        berechneAuszahlung(1000, "gold" as Tarif)
      ).toThrow();
    });

    it("Fehlermeldung enthält deutschen Text mit dem ungültigen Wert", () => {
      expect(() =>
        berechneAuszahlung(1000, "gold" as Tarif)
      ).toThrow(/gold/);
    });

    it("Fehlermeldung nennt erlaubte Tarif-Werte", () => {
      expect(() =>
        berechneAuszahlung(1000, "silber" as Tarif)
      ).toThrow(/basis.*komfort.*premium/i);
    });

    it("wirft Fehler bei leerem String als Tarif", () => {
      expect(() =>
        berechneAuszahlung(1000, "" as Tarif)
      ).toThrow();
    });

    it("führt bei unbekanntem Tarif zu keinem Berechnungsergebnis", () => {
      let ergebnis: BerechnungsErgebnis | undefined;
      try {
        ergebnis = berechneAuszahlung(1000, "gold" as Tarif);
      } catch {
        // erwartet
      }
      expect(ergebnis).toBeUndefined();
    });
  });

  describe("Fehler-Objekte sind vom Typ Error", () => {
    it("negative Schadenshöhe wirft eine Error-Instanz", () => {
      expect(() => berechneAuszahlung(-1, "basis")).toThrow(Error);
    });

    it("NaN wirft eine Error-Instanz", () => {
      expect(() => berechneAuszahlung(NaN, "basis")).toThrow(Error);
    });

    it("unbekannter Tarif wirft eine Error-Instanz", () => {
      expect(() =>
        berechneAuszahlung(1000, "unbekannt" as Tarif)
      ).toThrow(Error);
    });
  });
});
