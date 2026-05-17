"use client";

import { useMemo, useState } from "react";
import {
  hotelExperiences,
  protectionCards,
  verificationStatuses,
  verifiedReviews,
  type LiveStatus,
  type VerificationStatus,
} from "./hotel-live-data";

const liveInviteLink = "https://buyamia.example/live/hotel/auralis-suite";

const statusStyles: Record<LiveStatus, string> = {
  "Live now": "bg-[#b85438] text-white",
  Upcoming: "bg-[#234f5f] text-white",
  Replay: "bg-[#efe5d2] text-[#596540]",
};

const verificationCopy: Record<VerificationStatus, string> = {
  "Not Verified":
    "Start a secure identity check before joining protected hotel lives or leaving trusted reviews.",
  "Verification in Progress":
    "A certified KYC or identity verification provider should process the document review outside this front-end.",
  "Verified Account":
    "The account can display trust badges for lives, bookings, and reviews without exposing sensitive documents.",
};

const accountOptions = [
  [
    "Traveler / Guest",
    "Discover live rooms, request access, save replays, and leave verified reviews after a real stay.",
  ],
  [
    "Hotel / Partner",
    "Broadcast rooms, facilities, spa, brunch, packages, and on-site experiences to create trust.",
  ],
];

export function HotelLiveAccess() {
  const [accountType, setAccountType] = useState(accountOptions[0][0]);
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>(verificationStatuses[0]);
  const [copied, setCopied] = useState(false);

  const averageRating = useMemo(() => {
    const total = verifiedReviews.reduce((sum, review) => sum + review.overall, 0);
    return (total / verifiedReviews.length).toFixed(1);
  }, []);

  const copyLiveLink = async () => {
    setCopied(false);

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(liveInviteLink);
      setCopied(true);
      return;
    }

    setCopied(true);
  };

  const linkedInShare = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    liveInviteLink,
  )}`;

  return (
    <section id="hotel-live-access" className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-5 lg:grid-cols-[1.02fr_.98fr] lg:items-stretch">
          <div className="relative min-h-[620px] overflow-hidden rounded-[2rem] border border-[#d6cbb6] bg-[#15282f] p-5 text-[#fffaf0] shadow-2xl shadow-[#8a7d61]/14 sm:p-7">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-78"
              style={{
                backgroundImage:
                  "linear-gradient(to bottom, rgba(21,40,47,.08), rgba(21,40,47,.38) 48%, rgba(21,40,47,.94)), url(https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1500&q=88)",
              }}
            />
            <div className="relative z-10 flex min-h-[570px] flex-col justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#b85438] px-3 py-1 text-xs font-black">
                  HOTEL LIVE ACCESS
                </span>
                <span className="rounded-full bg-[#fffaf0]/14 px-3 py-1 text-xs font-bold">
                  Verified stays, live rooms, true reviews
                </span>
              </div>

              <div className="max-w-3xl">
                <p className="text-sm font-semibold text-[#cbd8a7]">
                  Explore hotels through real live experiences
                </p>
                <h2 className="mt-3 font-serif text-3xl leading-tight sm:text-5xl">
                  See the room, spa, brunch, beach, and service before you trust
                  the booking.
                </h2>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-[#eee5d4] sm:text-base">
                  Hotel partners can host live walkthroughs, publish replays,
                  answer guest questions, and connect verified reviews to real
                  bookings. No identity document is stored in this interface.
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="#hotel-categories"
                    className="rounded-full bg-[#fffaf0] px-5 py-3 text-center text-sm font-bold text-[#15282f] transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#fffaf0]/70"
                  >
                    Watch hotel lives
                  </a>
                  <a
                    href="#hotel-partner"
                    className="rounded-full bg-[#6f7f4f] px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-[#596540] focus:outline-none focus:ring-2 focus:ring-[#cbd8a7]/50"
                  >
                    Broadcast your hotel
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div id="hotel-auth" className="grid gap-5">
            <div className="rounded-[2rem] border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-xl shadow-[#8a7d61]/8 sm:p-6">
              <p className="text-sm font-semibold text-[#6f7f4f]">
                Sign In / Create Account
              </p>
              <h3 className="mt-2 font-serif text-2xl leading-tight">
                Choose the right account type.
              </h3>
              <div className="mt-5 grid gap-3">
                {accountOptions.map(([name, detail]) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setAccountType(name)}
                    className={`rounded-[1.4rem] border p-4 text-left transition ${
                      accountType === name
                        ? "border-[#234f5f] bg-[#e8f0ef] shadow-sm"
                        : "border-[#ded4c2] bg-white/45 hover:bg-[#f6efe2]"
                    }`}
                  >
                    <span className="block text-sm font-semibold">{name}</span>
                    <span className="mt-2 block text-xs leading-5 text-[#675f50]">
                      {detail}
                    </span>
                  </button>
                ))}
              </div>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  className="rounded-full bg-[#1f251a] px-4 py-3 text-sm font-bold text-[#fffaf0] transition hover:bg-[#596540]"
                >
                  Sign in
                </button>
                <button
                  type="button"
                  className="rounded-full bg-[#234f5f] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#183942]"
                >
                  Create account
                </button>
              </div>
            </div>

            <div id="verified-account" className="rounded-[2rem] border border-[#d6cbb6] bg-[#1f251a] p-5 text-[#fffaf0] shadow-xl shadow-[#8a7d61]/12 sm:p-6">
              <p className="text-sm font-semibold text-[#cbd8a7]">
                Verified Account
              </p>
              <h3 className="mt-2 font-serif text-2xl leading-tight">
                Identity status without sensitive storage.
              </h3>
              <div className="mt-5 flex flex-wrap gap-2">
                {verificationStatuses.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setVerificationStatus(status)}
                    className={`rounded-full px-3.5 py-2 text-xs font-bold transition ${
                      verificationStatus === status
                        ? "bg-[#cbd8a7] text-[#1f251a]"
                        : "bg-[#fffaf0]/10 text-[#fffaf0] hover:bg-[#fffaf0]/16"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
              <div className="mt-5 rounded-[1.4rem] bg-white/[.08] p-4">
                <p className="text-xs font-bold uppercase tracking-[.16em] text-[#cbd8a7]">
                  Secure KYC handoff
                </p>
                <p className="mt-2 text-sm leading-6 text-[#ded7c9]">
                  {verificationCopy[verificationStatus]}
                </p>
                <p className="mt-3 text-xs leading-5 text-[#ded7c9]">
                  Document identity checks must be handled by a certified KYC or
                  identity verification provider. This mock UI never stores
                  passports, ID cards, selfies, or sensitive personal data.
                </p>
              </div>
            </div>
          </div>
        </div>

        <section id="hotel-categories" className="pt-10">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold text-[#6f7f4f]">
                Hotel live categories
              </p>
              <h3 className="mt-2 font-serif text-2xl leading-tight sm:text-4xl">
                Rooms, spa, facilities, beach side, offers, and experiences.
              </h3>
            </div>
            <p className="max-w-md text-sm leading-6 text-[#675f50]">
              Guests can choose live access, upcoming sessions, or replays
              instead of relying only on polished marketing photos.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {hotelExperiences.map((experience) => (
              <article
                key={experience.title}
                className="group overflow-hidden rounded-[1.7rem] border border-[#d6cbb6] bg-[#fffaf0] shadow-sm transition duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#8a7d61]/12"
              >
                <div
                  className="relative h-52 bg-cover bg-center transition duration-700 group-hover:scale-[1.02]"
                  style={{ backgroundImage: `url(${experience.image})` }}
                >
                  <span
                    className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-black ${
                      statusStyles[experience.status]
                    }`}
                  >
                    {experience.status}
                  </span>
                </div>
                <div className="p-5">
                  <p className="text-xs font-bold uppercase tracking-[.16em] text-[#6f7f4f]">
                    {experience.category}
                  </p>
                  <h4 className="mt-2 text-lg font-semibold">
                    {experience.title}
                  </h4>
                  <p className="mt-2 text-sm leading-6 text-[#675f50]">
                    {experience.description}
                  </p>
                  <button
                    type="button"
                    className="mt-5 w-full rounded-full bg-[#1f251a] px-4 py-3 text-sm font-bold text-[#fffaf0] transition hover:bg-[#596540]"
                  >
                    {experience.action}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="grid gap-5 pt-10 lg:grid-cols-[.92fr_1.08fr]">
          <section id="hotel-partner" className="rounded-[2rem] border border-[#d6cbb6] bg-[#e8f0ef] p-6 shadow-sm">
            <p className="text-sm font-semibold text-[#234f5f]">
              Become a hotel partner
            </p>
            <h3 className="mt-3 font-serif text-3xl leading-tight">
              Present rooms, services, offers, and packages through live trust.
            </h3>
            <p className="mt-4 text-sm leading-7 text-[#4f5f58]">
              Hotels can show suites, spa, brunch, beach side areas, restaurant
              quality, common spaces, and special packages while collecting
              requests from guests who watched the experience.
            </p>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {["Rooms and suites", "Spa and brunch", "Packages and offers", "On-site experiences"].map(
                (item) => (
                  <span
                    key={item}
                    className="rounded-2xl bg-[#fffaf0]/78 px-4 py-3 text-sm font-bold text-[#234f5f]"
                  >
                    {item}
                  </span>
                ),
              )}
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className="rounded-full bg-[#234f5f] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#183942]"
              >
                List your hotel
              </button>
              <button
                type="button"
                className="rounded-full bg-[#1f251a] px-5 py-3 text-sm font-bold text-[#fffaf0] transition hover:bg-[#596540]"
              >
                Broadcast your hotel
              </button>
            </div>
          </section>

          <section id="share-live" className="rounded-[2rem] border border-[#d6cbb6] bg-[#fffaf0] p-6 shadow-xl shadow-[#8a7d61]/8">
            <p className="text-sm font-semibold text-[#6f7f4f]">
              Invite and share a live
            </p>
            <h3 className="mt-3 font-serif text-3xl leading-tight">
              Send a secure invitation link to join the hotel live.
            </h3>
            <p className="mt-4 text-sm leading-7 text-[#675f50]">
              A traveler can copy the live link or share it on LinkedIn and
              other social platforms. These buttons are simple front-end sharing
              actions, not a LinkedIn API integration.
            </p>
            <div className="mt-5 rounded-[1.3rem] bg-[#f3ecdc] p-4">
              <p className="break-all text-sm font-semibold text-[#1f251a]">
                {liveInviteLink}
              </p>
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={copyLiveLink}
                className="rounded-full bg-[#1f251a] px-4 py-3 text-sm font-bold text-[#fffaf0] transition hover:bg-[#596540]"
              >
                {copied ? "Link copied" : "Copy live link"}
              </button>
              <a
                href={linkedInShare}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-[#234f5f] px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-[#183942]"
              >
                Share on LinkedIn
              </a>
              <button
                type="button"
                className="rounded-full border border-[#d6cbb6] bg-white/50 px-4 py-3 text-sm font-bold text-[#1f251a] transition hover:bg-white"
              >
                Share on social platforms
              </button>
            </div>
          </section>
        </div>

        <section id="verified-reviews" className="pt-10">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold text-[#6f7f4f]">
                Verified Reviews / True Reviews
              </p>
              <h3 className="mt-2 font-serif text-2xl leading-tight sm:text-4xl">
                Reviews connected to watched lives, verified stays, and checked
                identity signals.
              </h3>
            </div>
            <div className="rounded-[1.4rem] bg-[#1f251a] px-5 py-4 text-[#fffaf0]">
              <p className="text-xs font-bold uppercase tracking-[.16em] text-[#cbd8a7]">
                Average rating
              </p>
              <p className="mt-1 text-3xl font-semibold">{averageRating}/5</p>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {verifiedReviews.map((review) => (
              <article
                key={`${review.hotel}-${review.date}`}
                className="rounded-[1.7rem] border border-[#d6cbb6] bg-[#fffaf0] p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{review.hotel}</p>
                    <p className="mt-1 text-xs text-[#675f50]">
                      {review.guest} - {review.date}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#6f7f4f] px-3 py-1 text-xs font-black text-white">
                    {review.overall}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-7 text-[#675f50]">
                  {review.comment}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {review.badges.map((badge) => (
                    <span
                      key={badge}
                      className="rounded-full bg-[#e8f0ef] px-3 py-1 text-xs font-bold text-[#234f5f]"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
                <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
                  {[
                    ["Cleanliness", review.cleanliness],
                    ["Service", review.service],
                    ["Rooms", review.rooms],
                    ["Spa", review.spa],
                    ["Food", review.food],
                    ["Value", review.value],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl bg-[#f3ecdc] p-3">
                      <p className="font-bold text-[#1f251a]">{value}/5</p>
                      <p className="mt-1 text-[#675f50]">{label}</p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="insurance-protection" className="pt-10">
          <div className="rounded-[2rem] border border-[#d6cbb6] bg-[#1f251a] p-6 text-[#fffaf0] shadow-xl shadow-[#8a7d61]/12">
            <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
              <div>
                <p className="text-sm font-semibold text-[#cbd8a7]">
                  Insurance & Protection
                </p>
                <h3 className="mt-3 font-serif text-3xl leading-tight">
                  Reassurance without making unsupported insurance promises.
                </h3>
                <p className="mt-4 text-sm leading-7 text-[#ded7c9]">
                  These protections are presented as eligible partner-backed
                  options. Real coverage, pricing, claims, and legal terms must
                  come from certified insurance or assistance providers.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {protectionCards.map(([title, body]) => (
                  <div
                    key={title}
                    className="rounded-[1.4rem] border border-white/10 bg-white/[.06] p-4"
                  >
                    <p className="font-semibold text-[#cbd8a7]">{title}</p>
                    <p className="mt-2 text-sm leading-6 text-[#ded7c9]">
                      {body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
