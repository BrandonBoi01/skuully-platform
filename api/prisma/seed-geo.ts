import { PrismaClient } from "@prisma/client";

type GeoCountrySeed = {
  code: string;
  iso3?: string;
  name: string;
  officialName?: string;
  flagEmoji?: string;
  region?: string;
  subregion?: string;
  capital?: string;
  currencyCode?: string;
  currencyName?: string;
  phoneCode?: string;
  phoneMinLength?: number;
  phoneMaxLength?: number;
  nativeCurriculumName?: string;
  nativeCurriculumCode?: string;
  timezones?: { name: string; utcOffset?: string }[];
};

const countries: GeoCountrySeed[] = [
  {
    code: "KE",
    iso3: "KEN",
    name: "Kenya",
    officialName: "Republic of Kenya",
    flagEmoji: "🇰🇪",
    region: "Africa",
    subregion: "Eastern Africa",
    capital: "Nairobi",
    currencyCode: "KES",
    currencyName: "Kenyan Shilling",
    phoneCode: "+254",
    phoneMinLength: 9,
    phoneMaxLength: 9,
    nativeCurriculumName: "CBC",
    nativeCurriculumCode: "KE_CBC",
    timezones: [{ name: "Africa/Nairobi", utcOffset: "+03:00" }],
  },
  {
    code: "UG",
    iso3: "UGA",
    name: "Uganda",
    officialName: "Republic of Uganda",
    flagEmoji: "🇺🇬",
    region: "Africa",
    subregion: "Eastern Africa",
    capital: "Kampala",
    currencyCode: "UGX",
    currencyName: "Ugandan Shilling",
    phoneCode: "+256",
    phoneMinLength: 9,
    phoneMaxLength: 9,
    nativeCurriculumName: "Uganda National Curriculum",
    nativeCurriculumCode: "UGANDA",
    timezones: [{ name: "Africa/Kampala", utcOffset: "+03:00" }],
  },
  {
    code: "TZ",
    iso3: "TZA",
    name: "Tanzania",
    officialName: "United Republic of Tanzania",
    flagEmoji: "🇹🇿",
    region: "Africa",
    subregion: "Eastern Africa",
    capital: "Dodoma",
    currencyCode: "TZS",
    currencyName: "Tanzanian Shilling",
    phoneCode: "+255",
    phoneMinLength: 9,
    phoneMaxLength: 9,
    nativeCurriculumName: "Tanzania National Curriculum",
    nativeCurriculumCode: "TANZANIA",
    timezones: [{ name: "Africa/Dar_es_Salaam", utcOffset: "+03:00" }],
  },
  {
    code: "RW",
    iso3: "RWA",
    name: "Rwanda",
    officialName: "Republic of Rwanda",
    flagEmoji: "🇷🇼",
    region: "Africa",
    subregion: "Eastern Africa",
    capital: "Kigali",
    currencyCode: "RWF",
    currencyName: "Rwandan Franc",
    phoneCode: "+250",
    phoneMinLength: 9,
    phoneMaxLength: 9,
    nativeCurriculumName: "Rwanda Competence Based Curriculum",
    nativeCurriculumCode: "RWANDA",
    timezones: [{ name: "Africa/Kigali", utcOffset: "+02:00" }],
  },
  {
    code: "US",
    iso3: "USA",
    name: "United States",
    officialName: "United States of America",
    flagEmoji: "🇺🇸",
    region: "Americas",
    subregion: "North America",
    capital: "Washington, D.C.",
    currencyCode: "USD",
    currencyName: "US Dollar",
    phoneCode: "+1",
    phoneMinLength: 10,
    phoneMaxLength: 10,
    nativeCurriculumName: "American Curriculum",
    nativeCurriculumCode: "US_GENERAL",
    timezones: [
      { name: "America/New_York" },
      { name: "America/Chicago" },
      { name: "America/Denver" },
      { name: "America/Los_Angeles" },
    ],
  },
  {
    code: "GB",
    iso3: "GBR",
    name: "United Kingdom",
    officialName: "United Kingdom of Great Britain and Northern Ireland",
    flagEmoji: "🇬🇧",
    region: "Europe",
    subregion: "Northern Europe",
    capital: "London",
    currencyCode: "GBP",
    currencyName: "Pound Sterling",
    phoneCode: "+44",
    phoneMinLength: 10,
    phoneMaxLength: 10,
    nativeCurriculumName: "British Curriculum",
    nativeCurriculumCode: "BRITISH",
    timezones: [{ name: "Europe/London", utcOffset: "+00:00" }],
  },
  {
    code: "IN",
    iso3: "IND",
    name: "India",
    officialName: "Republic of India",
    flagEmoji: "🇮🇳",
    region: "Asia",
    subregion: "Southern Asia",
    capital: "New Delhi",
    currencyCode: "INR",
    currencyName: "Indian Rupee",
    phoneCode: "+91",
    phoneMinLength: 10,
    phoneMaxLength: 10,
    nativeCurriculumName: "CBSE",
    nativeCurriculumCode: "CBSE",
    timezones: [{ name: "Asia/Kolkata", utcOffset: "+05:30" }],
  },
];

export async function seedGeo(prisma: PrismaClient) {
  for (const country of countries) {
    const created = await prisma.geoCountry.upsert({
      where: { code: country.code },
      update: {
        iso3: country.iso3,
        name: country.name,
        officialName: country.officialName,
        flagEmoji: country.flagEmoji,
        region: country.region,
        subregion: country.subregion,
        capital: country.capital,
        currencyCode: country.currencyCode,
        currencyName: country.currencyName,
        phoneCode: country.phoneCode,
        phoneMinLength: country.phoneMinLength,
        phoneMaxLength: country.phoneMaxLength,
        nativeCurriculumName: country.nativeCurriculumName,
        nativeCurriculumCode: country.nativeCurriculumCode,
        isActive: true,
      },
      create: {
        code: country.code,
        iso3: country.iso3,
        name: country.name,
        officialName: country.officialName,
        flagEmoji: country.flagEmoji,
        region: country.region,
        subregion: country.subregion,
        capital: country.capital,
        currencyCode: country.currencyCode,
        currencyName: country.currencyName,
        phoneCode: country.phoneCode,
        phoneMinLength: country.phoneMinLength,
        phoneMaxLength: country.phoneMaxLength,
        nativeCurriculumName: country.nativeCurriculumName,
        nativeCurriculumCode: country.nativeCurriculumCode,
        isActive: true,
      },
      select: { id: true, code: true },
    });

    await prisma.geoTimezone.deleteMany({
      where: { countryId: created.id },
    });

    if (country.timezones?.length) {
      await prisma.geoTimezone.createMany({
        data: country.timezones.map((tz) => ({
          countryId: created.id,
          name: tz.name,
          utcOffset: tz.utcOffset,
        })),
      });
    }
  }

  console.log(`✅ Seeded geo countries: ${countries.length}`);
}