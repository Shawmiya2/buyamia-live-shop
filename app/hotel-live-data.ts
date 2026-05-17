export type LiveStatus = "Live now" | "Upcoming" | "Replay";

export type VerificationStatus =
  | "Not Verified"
  | "Verification in Progress"
  | "Verified Account";

export type HotelExperience = {
  category: string;
  title: string;
  description: string;
  status: LiveStatus;
  action: string;
  image: string;
};

export type VerifiedReview = {
  guest: string;
  hotel: string;
  date: string;
  comment: string;
  overall: number;
  cleanliness: number;
  service: number;
  rooms: number;
  spa: number;
  food: number;
  value: number;
  badges: string[];
};

export const verificationStatuses: VerificationStatus[] = [
  "Not Verified",
  "Verification in Progress",
  "Verified Account",
];

export const hotelExperiences: HotelExperience[] = [
  {
    category: "Rooms",
    title: "Ocean suite walkthrough",
    description:
      "A host opens the suite live, shows storage, balcony views, lighting, and sound insulation.",
    status: "Live now",
    action: "Watch live",
    image:
      "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=900&q=86",
  },
  {
    category: "Spa",
    title: "Signature spa ritual preview",
    description:
      "See treatment rooms, therapist setup, privacy standards, and wellness facilities before booking.",
    status: "Upcoming",
    action: "Book or request access",
    image:
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=86",
  },
  {
    category: "Hotel",
    title: "Lobby to rooftop tour",
    description:
      "A replay of the arrival flow, reception, common areas, elevators, and rooftop service.",
    status: "Replay",
    action: "View details",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=86",
  },
  {
    category: "Food & Brunch",
    title: "Sunday brunch counter live",
    description:
      "Watch chefs plate brunch, inspect buffet freshness, and see dietary options in real time.",
    status: "Live now",
    action: "Watch live",
    image:
      "https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=900&q=86",
  },
  {
    category: "Facilities",
    title: "Gym, kids club, and business lounge",
    description:
      "A facilities host answers live questions about opening hours, access rules, and service levels.",
    status: "Upcoming",
    action: "Book or request access",
    image:
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=900&q=86",
  },
  {
    category: "Beach Side",
    title: "Beach access at golden hour",
    description:
      "A verified replay showing beach distance, loungers, towel service, and sunset crowd levels.",
    status: "Replay",
    action: "View details",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=86",
  },
  {
    category: "Offers",
    title: "Weekend suite and spa package",
    description:
      "Hotel team explains inclusions, blackout dates, room categories, and partner protection options.",
    status: "Upcoming",
    action: "Book or request access",
    image:
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=86",
  },
  {
    category: "Experiences",
    title: "Private dining and local excursions",
    description:
      "Discover on-property dining, cultural tours, beach clubs, and bookable guest experiences.",
    status: "Live now",
    action: "Watch live",
    image:
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=900&q=86",
  },
];

export const verifiedReviews: VerifiedReview[] = [
  {
    guest: "Verified guest A.",
    hotel: "Auralis Beach Resort",
    date: "April 22, 2026",
    comment:
      "The live room tour matched the actual suite. Staff answered questions about noise, breakfast timing, and beach access before we booked.",
    overall: 4.8,
    cleanliness: 4.9,
    service: 4.8,
    rooms: 4.7,
    spa: 4.6,
    food: 4.9,
    value: 4.5,
    badges: ["Verified guest", "Watched live", "Verified booking"],
  },
  {
    guest: "Verified guest B.",
    hotel: "Maison Verde Hotel",
    date: "March 18, 2026",
    comment:
      "The replay showed the restaurant and common areas honestly. The brunch quality and room finish were consistent with the live preview.",
    overall: 4.6,
    cleanliness: 4.7,
    service: 4.6,
    rooms: 4.5,
    spa: 4.2,
    food: 4.8,
    value: 4.4,
    badges: ["Verified guest", "Watched live", "Identity checked"],
  },
  {
    guest: "Verified guest C.",
    hotel: "Cliffside Atelier Suites",
    date: "February 27, 2026",
    comment:
      "The hotel partner showed both premium and standard rooms. That made the booking decision feel much more reliable than edited photos.",
    overall: 4.9,
    cleanliness: 4.8,
    service: 4.9,
    rooms: 4.9,
    spa: 4.7,
    food: 4.6,
    value: 4.6,
    badges: ["Verified booking", "Watched live", "Identity checked"],
  },
];

export const protectionCards = [
  [
    "Booking protection",
    "Booking support can be proposed through certified partners when the stay product supports it.",
  ],
  [
    "Cancellation protection",
    "Cancellation options should be displayed from hotel rules or approved protection providers.",
  ],
  [
    "Damage protection",
    "Damage coverage must be handled by a qualified partner, not by storing sensitive guest data here.",
  ],
  [
    "Travel assistance",
    "Assistance services can be surfaced as partner-backed options for eligible destinations.",
  ],
  [
    "Secure verified stay",
    "Verified accounts, verified bookings, and partner KYC reduce fake-account risk.",
  ],
];
