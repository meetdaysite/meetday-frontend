export type Country = {
	code: string    // ISO 3166-1 alpha-2
	name: string
	dialCode: string
}

export const COUNTRIES: Country[] = [
	{ code: "IN", name: "India",                dialCode: "+91"  },
	{ code: "US", name: "United States",        dialCode: "+1"   },
	{ code: "GB", name: "United Kingdom",       dialCode: "+44"  },
	{ code: "AU", name: "Australia",            dialCode: "+61"  },
	{ code: "CA", name: "Canada",               dialCode: "+1"   },
	{ code: "AE", name: "UAE",                  dialCode: "+971" },
	{ code: "SG", name: "Singapore",            dialCode: "+65"  },
	{ code: "MY", name: "Malaysia",             dialCode: "+60"  },
	{ code: "NZ", name: "New Zealand",          dialCode: "+64"  },
	{ code: "ZA", name: "South Africa",         dialCode: "+27"  },
	{ code: "DE", name: "Germany",              dialCode: "+49"  },
	{ code: "FR", name: "France",               dialCode: "+33"  },
	{ code: "IT", name: "Italy",                dialCode: "+39"  },
	{ code: "ES", name: "Spain",                dialCode: "+34"  },
	{ code: "NL", name: "Netherlands",          dialCode: "+31"  },
	{ code: "SE", name: "Sweden",               dialCode: "+46"  },
	{ code: "NO", name: "Norway",               dialCode: "+47"  },
	{ code: "DK", name: "Denmark",              dialCode: "+45"  },
	{ code: "FI", name: "Finland",              dialCode: "+358" },
	{ code: "CH", name: "Switzerland",          dialCode: "+41"  },
	{ code: "JP", name: "Japan",                dialCode: "+81"  },
	{ code: "KR", name: "South Korea",          dialCode: "+82"  },
	{ code: "CN", name: "China",                dialCode: "+86"  },
	{ code: "HK", name: "Hong Kong",            dialCode: "+852" },
	{ code: "TW", name: "Taiwan",               dialCode: "+886" },
	{ code: "PH", name: "Philippines",          dialCode: "+63"  },
	{ code: "ID", name: "Indonesia",            dialCode: "+62"  },
	{ code: "TH", name: "Thailand",             dialCode: "+66"  },
	{ code: "VN", name: "Vietnam",              dialCode: "+84"  },
	{ code: "BD", name: "Bangladesh",           dialCode: "+880" },
	{ code: "PK", name: "Pakistan",             dialCode: "+92"  },
	{ code: "LK", name: "Sri Lanka",            dialCode: "+94"  },
	{ code: "NP", name: "Nepal",                dialCode: "+977" },
	{ code: "BR", name: "Brazil",               dialCode: "+55"  },
	{ code: "MX", name: "Mexico",               dialCode: "+52"  },
	{ code: "AR", name: "Argentina",            dialCode: "+54"  },
	{ code: "CO", name: "Colombia",             dialCode: "+57"  },
	{ code: "NG", name: "Nigeria",              dialCode: "+234" },
	{ code: "KE", name: "Kenya",                dialCode: "+254" },
	{ code: "GH", name: "Ghana",                dialCode: "+233" },
	{ code: "ET", name: "Ethiopia",             dialCode: "+251" },
	{ code: "EG", name: "Egypt",                dialCode: "+20"  },
	{ code: "SA", name: "Saudi Arabia",         dialCode: "+966" },
	{ code: "QA", name: "Qatar",                dialCode: "+974" },
	{ code: "KW", name: "Kuwait",               dialCode: "+965" },
	{ code: "BH", name: "Bahrain",              dialCode: "+973" },
	{ code: "OM", name: "Oman",                 dialCode: "+968" },
	{ code: "IL", name: "Israel",               dialCode: "+972" },
	{ code: "TR", name: "Turkey",               dialCode: "+90"  },
	{ code: "RU", name: "Russia",               dialCode: "+7"   },
]

export const DEFAULT_COUNTRY = COUNTRIES[0]

export function findCountryByDialCode(dialCode: string): Country {
	return COUNTRIES.find(c => c.dialCode === dialCode) ?? DEFAULT_COUNTRY
}
