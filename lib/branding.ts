export const BRANDING = {
  appName: "ClienteYA",
  countryLabel: "Paraguay",
  countryFlag: "🇵🇾",
  currencySymbol: "Gs.",
  monthlyPrice: 50000,
  supportEmail: "soporte@clienteya.com",
  companyName: "ClienteYA Paraguay",
  bankName: "Banco Familiar",
  accountHolder: "ClienteYA Paraguay",
  accountNumber: "1234567890",
  accountAlias: "CLIENTEYA.PY",
  trialDaysLabel: "7 días",
};

export function formatGs(value: number) {
  return `${BRANDING.currencySymbol} ${value.toLocaleString("es-ES")}`;
}