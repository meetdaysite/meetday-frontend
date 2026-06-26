import type { VibeCategory, AttendeeEventCard } from "@/types/attendee"

// ---------------------------------------------------------------------------
// Vibe categories — used on landing hero strip and explore filter chips
// ---------------------------------------------------------------------------

export const VIBE_CATEGORIES: VibeCategory[] = [
	{
		id: "fitness",
		label: "Fitness & Outdoor Activities",
		image: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&q=80",
		gradient: "from-blue-900/80 via-blue-900/50 to-transparent",
	},
	{
		id: "wellness",
		label: "Wellness & Mental Health",
		image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80",
		gradient: "from-amber-600/80 via-amber-500/50 to-transparent",
	},
	{
		id: "career",
		label: "Career, Learning & Networking",
		image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600&q=80",
		gradient: "from-sky-700/80 via-sky-600/50 to-transparent",
	},
	{
		id: "social",
		label: "Social & Hangout",
		image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80",
		gradient: "from-teal-800/80 via-teal-700/50 to-transparent",
	},
	{
		id: "music",
		label: "Music, Parties & Nightlife",
		image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80",
		gradient: "from-purple-900/80 via-purple-800/50 to-transparent",
	},
]

// ---------------------------------------------------------------------------
// Attendee-facing events — Kolkata-centric mock data
// ---------------------------------------------------------------------------

export const MOCK_ATTENDEE_EVENTS: AttendeeEventCard[] = [
	{
		id: "night-rituals-1",
		title: "Night Rituals",
		category: "Music",
		date: "2025-05-23",
		time: "20:00",
		venue: "Skyline Rooftop",
		city: "Kolkata, West Bengal",
		cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80",
		price: 799,
		hostName: "Beat Curate",
		attendeeCount: 45,
		capacity: 60,
		isTrending: true,
		tags: ["music", "rooftop", "nightlife"],
		genre: "Electronic • House",
	},
	{
		id: "creator-sessions-1",
		title: "Creator Sessions",
		category: "Career & Learning",
		date: "2025-05-24",
		time: "18:00",
		venue: "The Co-Lab",
		city: "Kolkata, West Bengal",
		cover: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80",
		price: 499,
		hostName: "MakerHub KOL",
		attendeeCount: 28,
		capacity: 40,
		isNew: true,
		tags: ["creators", "networking", "workshop"],
	},
	{
		id: "sunset-sessions-1",
		title: "Sunset Sessions",
		category: "Music",
		date: "2025-05-24",
		time: "17:00",
		venue: "Victoria Memorial Grounds",
		city: "Kolkata, West Bengal",
		cover: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80",
		price: 349,
		hostName: "Kolkata Vibes",
		attendeeCount: 110,
		capacity: 150,
		isTrending: true,
		tags: ["music", "outdoor", "sunset"],
	},
	{
		id: "after-hours-social",
		title: "After Hours Social",
		category: "Social & Hangout",
		date: "2025-05-25",
		time: "21:00",
		venue: "The Social Lab",
		city: "Kolkata, West Bengal",
		cover: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80",
		price: null,
		hostName: "Social Lab KOL",
		attendeeCount: 34,
		capacity: 50,
		tags: ["social", "meetup", "free"],
	},
	{
		id: "wellness-circle-1",
		title: "Wellness Circle",
		category: "Wellness",
		date: "2025-06-04",
		time: "07:00",
		venue: "Eco Park, Zone 5",
		city: "Kolkata, West Bengal",
		cover: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80",
		price: 199,
		hostName: "Inner Compass",
		attendeeCount: 18,
		capacity: 30,
		isNew: true,
		tags: ["yoga", "wellness", "morning"],
	},
	{
		id: "rooftop-social-kol",
		title: "Rooftop Social",
		category: "Social & Hangout",
		date: "2025-06-05",
		time: "19:00",
		venue: "Park Street Terrace",
		city: "Kolkata, West Bengal",
		cover: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80",
		price: 599,
		hostName: "Park Street Events",
		attendeeCount: 72,
		capacity: 80,
		isTrending: true,
		tags: ["rooftop", "social", "networking"],
	},
	{
		id: "art-after-dark-1",
		title: "Art After Dark",
		category: "Arts & Culture",
		date: "2025-06-06",
		time: "19:00",
		venue: "Birla Academy",
		city: "Kolkata, West Bengal",
		cover: "https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=600&q=80",
		price: 399,
		hostName: "ArtSpace KOL",
		attendeeCount: 56,
		capacity: 80,
		isNew: true,
		tags: ["art", "culture", "evening"],
	},
	{
		id: "run-club-kol",
		title: "Run Club KOL",
		category: "Fitness & Outdoor",
		date: "2025-06-07",
		time: "06:00",
		venue: "Maidan Grounds",
		city: "Kolkata, West Bengal",
		cover: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=600&q=80",
		price: null,
		hostName: "Run Kolkata",
		attendeeCount: 89,
		capacity: 120,
		tags: ["running", "fitness", "morning"],
	},
	{
		id: "tech-talks-kol",
		title: "Tech Talks KOL",
		category: "Career & Learning",
		date: "2025-06-08",
		time: "10:00",
		venue: "ITC Sonar Convention Hall",
		city: "Kolkata, West Bengal",
		cover: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=600&q=80",
		price: 299,
		hostName: "TechHub Kolkata",
		attendeeCount: 134,
		capacity: 200,
		isTrending: true,
		tags: ["tech", "startup", "networking"],
	},
	{
		id: "brunch-and-beats",
		title: "Brunch & Beats",
		category: "Social & Hangout",
		date: "2025-06-09",
		time: "11:00",
		venue: "The Urban Table",
		city: "Kolkata, West Bengal",
		cover: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80",
		price: 699,
		hostName: "Weekend Collective",
		attendeeCount: 41,
		capacity: 60,
		isNew: true,
		tags: ["brunch", "music", "social"],
	},
]

// ---------------------------------------------------------------------------
// Trending sidebar — Kolkata events with distance for the explore page panel
// ---------------------------------------------------------------------------

export interface TrendingEvent {
	id: string
	title: string
	time: string
	venue: string
	distance: string
	cover: string
	rating: number
	reviewCount: number
}

export const MOCK_TRENDING_EVENTS: TrendingEvent[] = [
	{
		id: "night-rituals-1",
		title: "Night Rituals",
		time: "20:00",
		venue: "Skyline Rooftop",
		distance: "2.5km away",
		cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=120&q=80",
		rating: 4.9,
		reviewCount: 200,
	},
	{
		id: "creator-sessions-1",
		title: "Creator Sessions",
		time: "18:00",
		venue: "The Co-Lab",
		distance: "1.8km away",
		cover: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=120&q=80",
		rating: 4.7,
		reviewCount: 85,
	},
	{
		id: "sunset-sessions-1",
		title: "Sunset Sessions",
		time: "17:00",
		venue: "Victoria Memorial",
		distance: "3.2km away",
		cover: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=120&q=80",
		rating: 4.8,
		reviewCount: 312,
	},
	{
		id: "after-hours-social",
		title: "After Hours Social",
		time: "21:00",
		venue: "The Social Lab",
		distance: "4.1km away",
		cover: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=120&q=80",
		rating: 4.6,
		reviewCount: 67,
	},
]
