# PNWTickets.com — Complete Platform Proposal

## Vision

PNWTickets.com is a multi-venue hospitality + entertainment platform built for a theater and two neighboring restaurants in the PNW. It handles event ticketing, dinner service, seat/table selection, artist/promoter management, email marketing, and cross-venue promotion — all under one system designed to eventually power a unified iPhone/Android app.

This is not a generic Eventbrite clone. It's the operating system for an entertainment + dining group.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| API | tRPC (end-to-end type safety, mobile-app ready) |
| Database | PostgreSQL + Drizzle ORM |
| Auth | Auth.js v5 (credentials + OAuth ready, JWT for mobile) |
| Payments | Stripe (strategy pattern for future providers) |
| Email Marketing | Resend (transactional + broadcast API) |
| Email Templates | React Email |
| Background Jobs | Inngest |
| File Storage | S3-compatible (presigned upload) |
| Deployment | Vercel (app) + Railway (Postgres) |
| Future Mobile | React Native + Expo (same tRPC API) |

---

## Complete Feature List

### Core Ticketing
- Multiple ticket types: paid, free, donation, comp
- Dynamic pricing with auto-transitioning tiers (early bird → regular → last-minute)
- Surge pricing option (price increases as capacity fills)
- Capacity management with atomic SQL + row-level locks to prevent overselling
- Ticket holds — reserve blocks from public sale for sponsors, production crew, ADA
- Hidden tickets unlockable via promo codes
- Per-ticket min/max purchase limits
- Sale window scheduling (tickets go on sale / stop selling at specific times)

### Seat & Table Selection
- Interactive venue map — visual seat picker (drag to zoom, tap to select)
- Configurable layouts per venue (theater rows + sections, dinner tables)
- Pricing by section (orchestra vs. balcony vs. VIP booth)
- ADA / wheelchair accessible seating clearly marked and reservable
- Assistive listening device reservation during checkout
- Seat holds — block specific seats for production, sound booth, ADA
- Table assignments for dinner events — parties assigned to tables
- Kitchen gets table-based meal reports (not just a flat list)

### Checkout & Payments
- Stripe integration with strategy/adapter pattern for future providers
- Guest checkout (no account required to buy)
- Promo codes with usage limits, expiry dates, ticket type scoping
- Sales tax calculation (configurable per organization, multiple rates)
- Service charges per ticket (fixed amount, percentage, or both)
- Fee absorption option — organizer chooses buyer-pays or organizer-absorbs
- Auto-gratuity for dinner events (configurable rate, e.g. 20%)
- Additional voluntary gratuity with preset buttons (18%/20%/25%/custom)
- Meal/menu selection during checkout for dinner events
- Dietary restriction collection per attendee
- Full upsell engine (see Upsell System section below for complete details)
- Scarcity/urgency indicators ("Only 8 seats left in Orchestra", "12 people viewing")
- Pending order expiry (15-minute reservation timer)
- Abandoned cart recovery emails (automated 1 hour after abandonment)
- Embeddable ticket widget (iframe/web component for external websites)

### Wallet & Ticket Delivery
- Apple Wallet (.pkpass) ticket generation — primary delivery method
- Google Wallet pass generation
- PDF ticket fallback with QR codes via @react-pdf/renderer
- QR codes with HMAC signing for forgery prevention
- .ics calendar attachment in confirmation emails
- Order lookup page (by shortId + email)
- Ticket re-download / re-send capability

### Orders & Refunds
- Order management dashboard with filtering, search, pagination
- Order detail with full line item + fee breakdown
- Full and partial refunds through payment provider
- Order cancellation with automatic capacity release
- Resend confirmation emails
- Human-friendly order IDs (PNW-A1B2C3)

### Attendee Management
- Attendee list with search and filtering
- CSV/XLSX export via background job
- Dietary restriction summary for kitchen
- Per-attendee check-in status

### Check-in System
- Camera-based QR code scanning (html5-qrcode, mobile-optimized)
- Multiple check-in lists with ticket type scoping
- Scan result UI: success / already scanned / invalid (with attendee details)
- Guest list check-in mode — name-based search at door
- Comp ticket check-in
- Real-time check-in stats (auto-refresh)
- Recent scans feed
- Age verification flag on scan result ("21+ VERIFIED" or "CHECK ID")

### Guest List, Comps & Holds
- Comp ticket allocations per promoter/artist
- Guest list entries (name-based, no ticket needed, with plus-count)
- Ticket holds — reserve blocks from public sale
- One-click release of holds back to general sale

### Waitlist
- Join waitlist when event is sold out
- Auto-conversion: when a cancellation/refund occurs, next in line gets a time-limited purchase offer
- Email + push notification to waitlist buyer
- Configurable offer expiry (e.g., 2 hours to complete purchase)

### Event Management
- Create/edit events with full details (title, description, venue, images)
- Event types: concert, theater, comedy, dinner_theater, private, festival, other
- Event status lifecycle: draft → published → paused → archived/cancelled
- Recurring event templates (weekly comedy night, monthly dinner series)
- Event calendar on dashboard (monthly/weekly, color-coded by status)
- Quick-add event from calendar date click
- SEO settings per event (title, description, keywords)
- Dynamic Open Graph image generation for social sharing
- Photo galleries for past events (upload post-event photos)
- Accessibility notes per event ("wheelchair accessible", "no elevator")
- Event countdown timers on public pages

### Venue & Seat Map Management
- Venue profiles with seat map configurations
- Multiple seat map layouts per venue (theater, dinner, standing, custom)
- Section-based pricing zones
- Visual seat map editor for organizers

### Dinner Theater Features
- Menu management per event (categories: entrée, dessert, etc.)
- Meal selection during checkout (per ticket)
- Dietary restriction collection
- Table assignment management
- Kitchen export: meal selections grouped by table + dietary needs
- Inventory forecasting based on menu selections
- Pre-order concessions (drinks, wine pairings)
- Auto-gratuity + optional additional gratuity
- Tip pool tracking and staff distribution

### Table & Bottle Service
- VIP table reservations for music/comedy shows
- Configurable packages per event:
  - "Silver Table" ($200 — table for 4 + 1 bottle)
  - "Gold Table" ($400 — table for 6 + 2 bottles + dedicated server)
  - "Platinum Table" ($750 — best table + 3 bottles + dedicated server + meet & greet)
- Minimum spend option instead of fixed price (e.g., "$300 minimum at the table")
- Bottle menu selection during checkout (pre-select your bottles, similar to dinner menu)
- Tables shown on the seat map as a selectable seat type
- Table inventory management (limited quantity per show)
- Table add-ons: extra bottles, mixers, food platters, sparkler presentation
- Server assignment per table (staff knows which tables they're covering)
- Tab tracking: if minimum spend, track against bottles ordered at venue
- Revenue reporting: bottle service revenue tracked separately from ticket revenue
- Highest-margin offering — bottles at 5-10x wholesale cost

### Venue Rental & Private Events
Monetize empty dates at The Chehalis Theater, McFiler's, and The Hub.

**Public Availability Calendar:**
- Shows available dates for each venue (auto-calculated from event calendar)
- Color-coded: booked (events), held (tentative), available, blacked out
- Embedded on venue websites or PNWTickets.com
- Potential renters can browse available dates without contacting anyone

**Rental Packages (configurable per venue):**

| Package | Example (Chehalis Theater) | Example (McFiler's) | Example (The Hub) |
|---------|---------------------------|---------------------|-------------------|
| Full venue | $2,500/evening | $1,200/evening | $1,000/evening |
| Partial / room | $1,000 (stage + floor only) | $500 (private dining room) | $400 (back patio) |
| Hourly | $300/hr (rehearsals, film screenings) | $150/hr (meetings) | $125/hr (workshops) |
| Multi-day | $4,000/2 days (weddings, festivals) | — | — |

**Inquiry → Booking Flow:**
1. Renter browses available dates on the public calendar
2. Submits inquiry form: date(s), event type, guest count, package interest, special requests
3. Organizer receives inquiry notification, reviews, and creates a quote
4. Quote sent to renter with line items: venue fee, add-on services, damage deposit, taxes
5. Renter approves quote → pays deposit (configurable: 25%, 50%, or full) via Stripe
6. Booking confirmed → date blocked on calendar → confirmation email with venue details
7. Balance due date set (e.g., 14 days before event) → automatic reminder emails
8. Post-event: damage deposit refunded (full or partial) or retained with documented reason

**Rental Add-On Services:**
- Sound system + tech (with or without technician): $200-500
- Lighting package: $150-300
- Stage/backline access: $100-200
- Projector/screen: $75-150
- Catering from McFiler's or The Hub (cross-venue revenue!)
  - "Theater rental + McFiler's catering" — bundled pricing
  - Menu selection flow similar to dinner theater checkout
  - Kitchen at McFiler's prepares, delivers to theater
- Bartending staff: $50/hr per bartender
- Security: $40/hr per guard
- Cleaning crew: $150 flat
- Tables/chairs setup: $100
- Parking lot attendant: $30/hr
- Day-of coordinator: $300

**Private Event Types:**
- Weddings & receptions
- Corporate events & holiday parties
- Birthday parties & anniversaries
- Film screenings & premieres
- Rehearsals & workshops
- Photo/video shoots
- Community meetings & fundraisers
- Live podcast recordings
- Private concerts / buyouts

**Cross-Venue Rental Bundles:**
- "Wedding Weekend" — Friday rehearsal dinner at McFiler's + Saturday ceremony/reception at The Chehalis Theater + Sunday brunch at The Hub
- "Corporate Retreat" — Theater for presentations + McFiler's for team dinner + Hub for casual networking
- Bundle pricing: discount vs. booking each venue separately

**Contract & Legal:**
- Digital contract/agreement generated from quote (terms, cancellation policy, liability)
- E-signature integration (or simple checkbox acceptance)
- Cancellation policy: configurable per venue (e.g., full refund 60+ days, 50% refund 30-60 days, no refund under 30 days)
- Damage deposit hold via Stripe (authorized but not captured, released after event)
- Insurance requirement notice (renter must provide proof of event insurance)

**Rental Dashboard:**
- List of all inquiries (new, quoted, booked, completed, cancelled)
- Pipeline view: inquiry → quote sent → deposit paid → balance paid → completed
- Revenue tracking: rental income, add-on services, catering cross-venue revenue
- Calendar view showing rentals alongside regular events
- Availability management: block out dates, set blackout periods (holidays, maintenance)

### Day-of-Show Operations
- Runsheet / timeline view (doors, soundcheck, opener, headliner, curfew)
- Staff assignment to time slots
- Checklist items with completion tracking
- Shareable with crew, artists, staff
- Incident / event notes log (timestamped, attributed to staff)
- Cash reconciliation for door sales
- Door sales mode — quick POS-style ticket sale

### Artist / Promoter Management
- Assign artists and promoters to events with roles (headliner, opener, promoter, co-promoter, support)
- Flexible deal structures (see Deal Types below)
- Multiple artists per event, each with independent deal terms
- Comp ticket allocation per artist/promoter
- Production / tech rider management (sound requirements, backline, green room)
- Tech rider stored as checklist — venue confirms each item
- Deal memo / contract notes field (rich text)

**Deal Types:**

| Deal Type | How It Works | Example |
|-----------|-------------|---------|
| **Flat Fee** | Fixed guaranteed payment regardless of sales | Artist gets $2,000 |
| **% of Gross** | Percentage of total ticket revenue (before expenses) | Artist gets 70% of gross |
| **% of Net** | Percentage of ticket revenue after expenses deducted | Artist gets 80% of net (after production costs) |
| **Door Split** | Venue and artist split revenue by percentage | 70/30 artist/venue split |
| **Guarantee vs. %** | Artist gets the HIGHER of a flat guarantee OR a % of gross | $1,500 guarantee OR 60% of gross, whichever is more |
| **Flat + %** | Flat fee plus a percentage of revenue above a threshold | $1,000 + 50% of gross after first $3,000 |
| **Custom** | Free-form formula stored as JSON for edge cases | Any combination with notes |

**Door Split specifics:**
- Configurable artist/venue percentage (e.g., 70/30, 60/40, 80/20)
- Split can be based on gross or net revenue
- Optional: split only applies after a threshold ("first $500 to venue, then 70/30")
- Multiple artists can have different splits on the same event (opener gets 15%, headliner gets 55%, venue keeps 30%)
- The percentages across all parties on an event should add up to 100% — the system validates this

**Guarantee vs. Percentage specifics:**
- Common in the industry — protects the artist on a slow night, rewards them on a big night
- System auto-calculates both amounts and uses the higher one
- Settlement clearly shows: "Guarantee: $1,500 | 60% of gross: $2,100 | **Artist receives: $2,100**"

**Flat + Percentage specifics:**
- Threshold field: revenue amount above which the percentage kicks in
- Example: $1,000 flat + 50% of gross above $3,000
- If gross is $5,000: artist gets $1,000 + 50% × ($5,000 - $3,000) = $1,000 + $1,000 = $2,000
- If gross is $2,000: artist gets $1,000 (threshold not met, no percentage)

### Promoter Portal (Restricted View)
- Separate dashboard with simplified layout (for logged-in promoters with accounts)
- Shows ONLY: ticket count sold, net revenue (no tax, fees, gratuity visible)
- For door split deals: shows gross revenue and their split percentage + calculated amount
- Sales timeline chart
- Comp ticket management from promoter's side
- Deal terms visible to the artist (they can see their own deal but not other artists' deals on the same event)

### No-Login Shareable Event Report Links
The primary way artists, booking agents, and promoters check on sales — no account needed.

**How it works:**
- From the talent management page, organizer clicks "Generate Report Link" for any artist/promoter on an event
- System creates a unique, cryptographically random URL: `pnwtickets.com/reports/evt_a8k2m9x4`
- The link opens a clean, standalone report page — no login, no nav, no other events visible
- Each link is scoped to ONE artist on ONE event — they can only see their own data

**What the report page shows:**
- Event name, date, venue (basic info)
- Tickets sold (count) + capacity remaining
- Net revenue (their share based on deal terms) — NO tax, fees, or gratuity shown
- Sales timeline chart (when tickets were sold, daily or hourly)
- Their deal terms (e.g., "70/30 door split" or "$2,000 guarantee vs. 60% of gross")
- For guarantee vs. % deals: live calculation showing which option is currently winning
- Comp tickets used vs. allocated
- Last updated timestamp
- Auto-refreshes — artist can bookmark it and check anytime

**What the report page does NOT show:**
- Tax collected, service charge revenue, gratuity
- Other artists on the same event or their deals
- Other events
- Any admin/organizer controls

**Link management:**
- Links can be set to expire (e.g., 30 days after event) or be permanent
- Organizer can revoke a link at any time (returns 404)
- Organizer can regenerate a new link (old one stops working)
- Multiple links can exist per artist per event (e.g., one for the artist, one for their manager)
- Track when links are accessed (last viewed timestamp + view count) — organizer can see if the artist is actually checking
- Optional: password-protect a link for extra security (artist enters a PIN to view)

**Delivery:**
- One-click "Copy Link" for the organizer to paste into a text/email
- One-click "Send via Email" — sends the artist a branded email with the link + event summary
- Link can also be sent via the automated talent assignment email when an artist is first added to an event

**Database:**
- `report_links` table: id, publicId, token (unique, indexed), eventTalentId (FK), eventId (FK), createdBy (FK users), expiresAt (nullable), revokedAt (nullable), pin (hashed, nullable), lastViewedAt, viewCount, createdAt, updatedAt

### Settlements & Payouts
- Auto-calculate payouts based on deal type (handles all 7 deal structures)
- Settlement breakdown adapts to deal type:
  - Flat fee: just shows the guaranteed amount
  - Door split: gross revenue × artist split % = artist amount, gross × venue split % = venue amount
  - Guarantee vs. %: shows both calculations, highlights which one applied
  - Flat + %: shows base + threshold + overage calculation
- Settlement breakdown: gross → minus tax → minus fees → minus gratuity → net → apply deal terms → talent amount
- Mark settlements as paid/unpaid
- Settlement PDF export
- Automated 1099 data tracking (for artists paid $600+/year)
- Tax year summary export per artist

### Analytics & Reporting
- Event analytics: total sales, revenue by ticket type, sales over time, orders by status, capacity gauge
- Dashboard home: summary stats + event calendar + recent orders
- Group-level analytics: cross-venue revenue, customer overlap
- Best-selling analysis: day of week, event type, price point, time-of-purchase
- Revenue forecasting based on sales velocity
- Customer lifetime value (CLV) tracking + tier segmentation
- Churn detection: flag customers absent 90/180/365 days
- "Fans also attended" recommendation engine (co-occurrence, no ML needed)
- Post-event survey results + NPS score tracking

### Email Marketing
- Subscriber management: import, manual add, auto-subscribe on checkout (opt-in)
- Per-venue subscription preferences
- Audience segmentation: by venue, event type, purchase history, CLV tier, engagement, location
- Campaign builder with visual editor
- Campaign scheduling
- Campaign analytics: delivered, opened, clicked, bounced, unsubscribed
- Automated flows: post-event thank you, win-back, birthday offers, abandoned cart recovery
- Pre-event reminders (24h + 2h before event)
- Unsubscribe / preference center (CAN-SPAM compliant)
- Cross-venue promotion: "Loved the show? Try dinner at Restaurant A"

### Post-Event Surveys
- Automated email 24h after event
- Quick 3-question survey: rating, highlights, improvements
- Net Promoter Score (NPS) tracking per event and over time
- Results feed into customer profiles and segmentation

### Referral Program
- Unique referral tracking links per customer
- Configurable reward: flat dollar amount or percentage off next purchase
- Referral dashboard showing performance
- Auto-credit or payout
- QR code flyers with tracking — physical marketing with digital analytics

### Customer Profiles
- Unified profile across all venues
- Purchase history, events attended, total spend, CLV tier
- Dietary preferences (persisted from dinner orders)
- Survey responses and NPS scores
- Referral activity
- Last visit date, favorite venue
- Foundation for email segmentation + future mobile app "My Account"

### Multi-Venue / Organization Group
- Parent entity ("Eddie's Hospitality Group") owns multiple organizations
- Shared customer database across all venues
- Per-venue branding (logo, colors, email templates)
- Cross-venue analytics and customer overlap
- Staff sharing across venues
- Gift cards work across all venues in the group

### Gift Cards
- Purchasable online (with custom message + email delivery)
- Physical gift card code entry support
- Redeemable as payment method during checkout
- Balance tracking, partial redemption
- Work across all venues in the organization group
- Gift card sales reporting

### Auth & Security
- Email/password registration + login
- OAuth-ready (Google, Facebook for future)
- JWT sessions (stateless, works for web + future mobile)
- Role-based access control: owner, admin, organizer, promoter, check_in_staff
- Two-factor authentication (TOTP via Google Authenticator)
- 2FA required for owner/admin roles
- Audit log: every admin action tracked (who, what, when)
- Rate limiting on public endpoints

### Accessibility
- ADA seating selection on seat maps
- Assistive listening device reservation
- Accessibility notes per event
- Keyboard navigation throughout
- ARIA labels and focus management
- Screen reader friendly

### Mobile App Readiness
- tRPC API is JSON-first (no server-rendered HTML in API responses)
- JWT auth works for mobile bearer tokens
- Push notification preferences table
- All file references use URLs
- React Native + Expo can import same tRPC client types
- Offline check-in capability designed for

### Data & Compliance
- GDPR right to access (customer data export)
- GDPR right to erasure (customer data deletion)
- Bulk data export for org owners (CSV/JSON)
- CAN-SPAM email compliance
- TCPA SMS compliance (future)

---

## Upsell System — Complete Specification

The upsell system is the primary cross-venue revenue engine connecting The Chehalis Theater, McFiler's, and The Hub.

### At-Checkout Upsells (shown during ticket purchase)

**Seat & Ticket Upgrades**
- "Upgrade to Orchestra for $20 more" — dynamically priced based on remaining inventory
- "Upgrade to VIP Table" — for dinner theater
- Price auto-decreases as event approaches (better to sell premium at discount than leave empty)
- Configurable floor price — organizer sets minimum upgrade price
- Only shown when better options are actually available

**Merchandise**
- Event-specific merch: posters, t-shirts, vinyl, artist-specific items
- Image, description, limited quantity tracking
- Margin tracking (cost vs. sell price) for profitability reporting
- Fulfilled at will-call/merch table or shipped

**Food & Drink Packages**
- 2-drink, 4-drink, unlimited wristband packages
- Pre-order intermission concessions (skip the line at the bar)
- Wine pairing add-on for dinner theater
- Designated driver package (free non-alcoholic drinks all night)

**Experience Add-Ons**
- Meet & greet with the artist (limited quantity, premium price)
- Soundcheck access — watch the band warm up
- Backstage tour
- After-party tickets
- Song request — pay to request a song (for appropriate acts)
- Front-row upgrade lottery — $5 for a chance at front-row (fun gamification)
- Professional photo package — event photos delivered next day

**Convenience & Parking**
- Reserved parking spot
- Coat check reservation
- Rideshare credit (partner with local services)

**Bundles — "Make It a Night"**
- "Date Night" — 2 tickets + dinner at McFiler's + bottle of wine (15% off bundle price)
- "Anniversary Package" — VIP table + prix fixe dinner + champagne + commemorative photo
- "Birthday Experience" — group table + cake + dedicated server + artist shoutout
- "Weekend Getaway" — Friday dinner at McFiler's + Saturday show at Chehalis Theater + Sunday brunch at The Hub
- Bundles are pre-configured with their own pricing and show as a single card in the upsell carousel

**Charity Add-On**
- "Add $5 for [Local PNW Charity]"
- Great PR, tiny effort, makes buyers feel good
- Tracked separately in reporting

### Cross-Venue Upsells — The Chehalis Theater ↔ McFiler's ↔ The Hub

This is where the three-venue group becomes a revenue multiplier. Every ticket purchase at one venue becomes a marketing opportunity for the other two.

**At Checkout (Theater → Restaurants):**
- "Pre-Show Dinner at McFiler's" — reserve a table, pre-order your meal, walk straight in
  - McFiler's is nearby = natural "grab dinner before the show" partner
  - Shows real-time availability for the selected date
  - Pre-ordered meals are ready when the guest arrives
- "Post-Show Drinks at McFiler's" — reserved table after the show, show your ticket stub for 10% off
- "This Week at The Hub" — 20% off dinner at The Hub within 7 days of the show
  - The Hub is ~4 miles away, so it's a "this week" offer rather than same-night

**At Checkout (Restaurants → Theater):**
- When McFiler's or The Hub sell event tickets (dinner events, wine tastings, live music)
- "Upcoming at The Chehalis Theater" — show upcoming events with a $5-off-per-ticket offer
- "Bundle: Dinner + Show" — add theater tickets to your dining reservation

**Cross-Venue Discount Mechanics:**
When a buyer adds a cross-venue upsell:
1. A unique discount code is auto-generated (e.g., `PNWX-A7K2M9`)
2. Code is scoped to the target venue and has an expiry window (e.g., 7 days after the show)
3. Code is emailed to the buyer with details: "Show this code at McFiler's for 20% off your meal"
4. Delivery options:
   - **Email code** — sent immediately after purchase
   - **In-app** (future) — shows in the mobile app wallet
   - **Automatic at venue** — linked to customer profile, applied when they check in at the other venue
5. When redeemed, the `cross_venue_discount_codes` table tracks which purchase generated it
6. Analytics show: "Theater ticket sales generated $4,200 in McFiler's revenue this month"

**Post-Purchase Cross-Venue Emails (Automated):**

Triggered automatically after ticket purchase, timed strategically:

| Email | When | Content | Example |
|-------|------|---------|---------|
| Pre-show dinner | 3 days before event | "Make it a complete night — reserve dinner at McFiler's before the show" | "Your show is Saturday at 8 PM. McFiler's has tables available at 6 PM. Book now and get 15% off with code PNWX-..." |
| Post-show offer | 2 hours after event ends | "Great show tonight? Continue the night at McFiler's — 20% off this week" | "Show your ticket or use code PNWX-... at McFiler's within 7 days" |
| The Hub promo | 1 day after event | "Loved The Chehalis Theater? Try The Hub this week — 20% off" | "The Hub is just 4 miles away. Use code PNWX-... for 20% off any meal this week" |
| Next show | 3 days after event | "Based on tonight, you'll love these upcoming shows" | Personalized by genre/artist similarity |

**Post-Purchase Upsells (Same Venue):**

| Email | When | Content |
|-------|------|---------|
| Dynamic seat upgrade | 48h before event | "Better seats just opened up — upgrade to Row C for $15" (one-click upgrade link) |
| Add-on reminder | 1 week before | "You bought tickets but didn't add the drink package — add it now for 20% off" |
| Merch reminder | 24h before | "Pre-order the limited edition poster — pick up at the show" |
| Last chance | 24h before | "Final chance to add dinner at McFiler's before tomorrow's show" |
| "Bring a friend" | Immediately after purchase | "Going with friends? Share this link so they can pick seats near you" |

**Post-Event Upsells:**

| Email | When | Content |
|-------|------|---------|
| Merch follow-up | 2h after event | "Didn't grab merch tonight? Order online — ships to your door" |
| Cross-venue dining | 2h after event | "Continue the night — McFiler's has your table ready" |
| Next show | 3 days after | "Loved [Artist]? Here's what's coming next at The Chehalis Theater" |
| Review request | 24h after | "How was the show? Rate your experience (takes 30 seconds)" (links to survey) |
| Loyalty trigger | After 3rd event | "You're becoming a regular — VIP pre-sale access unlocked for your next show" |

### Smart Upsell Engine

**"Buyers Also Added" Recommendations:**
- Track co-purchase frequency: "85% of VIP ticket buyers also added the drink package"
- Show most popular upsells first in the carousel
- No ML needed — simple co-occurrence counting

**Personalized Ranking:**
- Customer bought drink packages before → show that first
- Customer never bought merch → de-prioritize
- VIP CLV tier → show premium upgrades first
- Casual tier → show value bundles first
- First-time buyer → show "Date Night" bundle (proven conversion driver)

**Dynamic Upgrade Pricing:**
- Upgrade price = (premium seat price - current seat price) × discount factor
- Discount factor decreases as event approaches: 100% (7+ days) → 75% (3-7 days) → 50% (24-48h) → 25% (day-of, if mobile app)
- Floor price set by organizer — never goes below
- Dashboard shows: upgrade revenue vs. seats that would have been empty

**Time-Sensitive Offers:**
- Early bird upsell: add drink package within 24h of purchase for 25% off
- Last chance: 48h before event, final push at full price
- Countdown timers in emails
- Offer expiry tracked per `upsell_email_offers` row

### Upsell Analytics Dashboard

| Metric | Description |
|--------|-------------|
| Revenue by upsell type | Which categories generate the most revenue |
| Attach rate | % of ticket buyers who add each upsell |
| Top-performing upsells | Ranked by revenue and conversion rate |
| Bundle performance | Which bundles sell best, margin per bundle |
| Cross-venue attribution | "Theater ticket sales generated $X at McFiler's this month" |
| Cross-venue redemption rate | What % of issued cross-venue discount codes get used |
| Email upsell conversion | Which post-purchase emails drive the most upsell revenue |
| Upgrade revenue | Seat upgrade revenue vs. what those seats would have earned (or $0 if empty) |
| Merch margin | Revenue minus cost for merchandise items |
| Revenue by timing | Checkout vs. post-purchase vs. pre-event vs. post-event conversion |
| Per-event upsell revenue | Upsell revenue as % of total event revenue |
| Customer upsell affinity | Which customers are most likely to buy upsells (for targeting) |

### Real-World Scenarios

**Scenario 1: Saturday Night at The Chehalis Theater**
1. Buyer purchases 2 tickets to a comedy show ($35 each)
2. Checkout upsells shown:
   - "Date Night Bundle: Add dinner at McFiler's for 2 + bottle of wine — $89 (save $25)" → buyer adds
   - "Drink package: 4 drinks each — $40" → buyer adds
   - "Reserved parking — $10" → buyer skips
3. Total: $70 (tickets) + $89 (dinner bundle) + $40 (drinks) = $199
4. Post-purchase email (immediately): dinner reservation confirmation at McFiler's for 6 PM
5. Post-purchase email (3 days before): "Your dinner is confirmed! Add the wine pairing upgrade for $15/person?"
6. Post-event email (2h after show): "Great night? The Hub has brunch this weekend — 20% off with code PNWX-K8M2"
7. Result: One $70 ticket sale turned into $199+ across two venues

**Scenario 2: Dinner at McFiler's**
1. McFiler's hosts a "Live Jazz Dinner" event — buyer purchases 2 tickets ($65 each)
2. Checkout upsell: "This Friday at The Chehalis Theater: [Band Name] — $10 off with code PNWX-..."
3. Buyer attends jazz dinner, gets the email
4. 3 days later, uses the code to buy theater tickets
5. Cross-venue attribution tracks: McFiler's event → Chehalis Theater revenue

**Scenario 3: Dynamic Seat Upgrade**
1. Buyer purchased balcony seats ($25 each) 2 weeks ago
2. 48h before show: Orchestra seats still available ($55 each)
3. Email: "Orchestra seats just opened up — upgrade for $15/seat (normally $30 upgrade)"
4. Dynamic pricing: ($55 - $25) × 50% discount = $15 upgrade price
5. One-click upgrade link in email — pre-authenticated, just confirm
6. Result: Fills premium seats that might have stayed empty, buyer gets a deal

---

## Project Structure

```
src/
├── app/
│   ├── (public)/                              # Public-facing (no auth)
│   │   ├── page.tsx                           # Landing / homepage
│   │   ├── events/
│   │   │   ├── page.tsx                       # Browse events
│   │   │   └── [slug]/
│   │   │       ├── page.tsx                   # Event detail (SSR, SEO)
│   │   │       └── opengraph-image.tsx        # Dynamic OG image
│   │   ├── checkout/[orderId]/
│   │   │   ├── page.tsx                       # Checkout + Stripe + seat selection + gratuity
│   │   │   ├── confirmation/page.tsx          # Order confirmation
│   │   │   └── error/page.tsx                 # Payment error
│   │   ├── orders/[orderId]/
│   │   │   ├── page.tsx                       # Order lookup (shortId + email)
│   │   │   └── tickets/[ticketId]/page.tsx    # Ticket view + QR + wallet pass
│   │   ├── subscribe/page.tsx                 # Newsletter signup
│   │   ├── unsubscribe/page.tsx               # Email preference center
│   │   ├── gift-cards/
│   │   │   ├── page.tsx                       # Purchase gift cards
│   │   │   └── redeem/page.tsx                # Check balance
│   │   ├── survey/[surveyId]/page.tsx         # Post-event survey
│   │   ├── r/[referralCode]/page.tsx          # Referral redirect + tracking
│   │   ├── reports/[token]/page.tsx           # No-login artist/promoter event report
│   │   ├── venues/[venueSlug]/
│   │   │   ├── page.tsx                       # Public venue page (info, photos, capacity)
│   │   │   ├── availability/page.tsx          # Public availability calendar
│   │   │   └── rent/page.tsx                  # Rental inquiry form
│   │   └── embed/[eventId]/page.tsx           # Embeddable ticket widget
│   │
│   ├── (auth)/                                # Auth routes
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   └── two-factor/page.tsx                # 2FA setup + verification
│   │
│   ├── (dashboard)/                           # Organizer dashboard
│   │   ├── layout.tsx                         # Sidebar + topbar
│   │   ├── dashboard/page.tsx                 # Overview + event calendar
│   │   ├── events/
│   │   │   ├── page.tsx                       # Event list
│   │   │   ├── new/page.tsx                   # Create event (multi-step)
│   │   │   └── [eventId]/
│   │   │       ├── layout.tsx                 # Event sub-nav
│   │   │       ├── page.tsx                   # Event overview + stats
│   │   │       ├── edit/page.tsx              # Edit event details
│   │   │       ├── tickets/page.tsx           # Manage ticket types + pricing tiers
│   │   │       ├── seat-map/page.tsx          # Venue seat map configuration
│   │   │       ├── menu/page.tsx              # Dinner menu management
│   │   │       ├── upsells/page.tsx           # Configure checkout upsells + merch
│   │   │       ├── orders/
│   │   │       │   ├── page.tsx               # Order list
│   │   │       │   └── [orderId]/page.tsx     # Order detail + refund
│   │   │       ├── attendees/page.tsx         # Attendee list + export
│   │   │       ├── check-in/
│   │   │       │   ├── page.tsx               # Check-in lists
│   │   │       │   └── [listId]/page.tsx      # Scanner + recent scans
│   │   │       ├── guest-list/page.tsx        # Guest list + comps
│   │   │       ├── waitlist/page.tsx          # Waitlist management
│   │   │       ├── promo-codes/page.tsx       # Promo code management
│   │   │       ├── talents/page.tsx           # Artist/promoter assignments
│   │   │       ├── settlements/page.tsx       # Payout tracking
│   │   │       ├── runsheet/page.tsx          # Day-of-show timeline
│   │   │       ├── gallery/page.tsx           # Post-event photo gallery
│   │   │       ├── survey/page.tsx            # Survey results + NPS
│   │   │       ├── analytics/page.tsx         # Event analytics
│   │   │       └── audit-log/page.tsx         # Event-level audit trail
│   │   ├── venues/
│   │   │   ├── page.tsx                       # Venue list
│   │   │   └── [venueId]/
│   │   │       ├── page.tsx                   # Venue details
│   │   │       ├── seat-maps/page.tsx         # Seat map editor
│   │   │       ├── bottle-service/page.tsx    # Bottle menu + package management
│   │   │       ├── rentals/
│   │   │       │   ├── page.tsx               # Rental inquiries pipeline
│   │   │       │   ├── packages/page.tsx      # Rental packages + add-ons config
│   │   │       │   ├── calendar/page.tsx      # Availability calendar + blackouts
│   │   │       │   └── [inquiryId]/page.tsx   # Inquiry detail + quote builder
│   │   │       └── availability/page.tsx      # Public-facing availability embed
│   │   ├── customers/
│   │   │   ├── page.tsx                       # Customer list + CLV
│   │   │   └── [customerId]/page.tsx          # Customer profile detail
│   │   ├── gift-cards/
│   │   │   └── page.tsx                       # Gift card management + reporting
│   │   ├── referrals/
│   │   │   └── page.tsx                       # Referral program management
│   │   ├── marketing/
│   │   │   ├── page.tsx                       # Campaign list
│   │   │   ├── new/page.tsx                   # Create campaign
│   │   │   ├── [campaignId]/page.tsx          # Campaign detail + analytics
│   │   │   ├── subscribers/page.tsx           # Subscriber management
│   │   │   ├── segments/page.tsx              # Audience segments
│   │   │   └── automations/page.tsx           # Automated email flows
│   │   ├── settings/
│   │   │   ├── page.tsx                       # Account settings
│   │   │   ├── organization/page.tsx          # Venue settings
│   │   │   ├── team/page.tsx                  # Team management
│   │   │   ├── billing/page.tsx               # Stripe config
│   │   │   ├── fees/page.tsx                  # Tax + service charge config
│   │   │   ├── gratuity/page.tsx              # Auto-gratuity rules
│   │   │   ├── security/page.tsx              # 2FA, password, sessions
│   │   │   └── audit-log/page.tsx             # Organization-wide audit log
│   │   └── group/                             # Multi-venue group dashboard
│   │       ├── page.tsx                       # Cross-venue overview
│   │       └── analytics/page.tsx             # Group-wide analytics
│   │
│   ├── (promoter)/                            # Restricted promoter/artist portal
│   │   ├── layout.tsx
│   │   ├── page.tsx                           # Promoter dashboard
│   │   └── events/[eventId]/
│   │       ├── page.tsx                       # Event stats (net revenue only)
│   │       └── comps/page.tsx                 # Manage comp allocation
│   │
│   └── api/
│       ├── trpc/[trpc]/route.ts               # tRPC catch-all
│       ├── inngest/route.ts                   # Inngest serve endpoint
│       ├── webhooks/
│       │   ├── stripe/route.ts                # Stripe webhook
│       │   └── resend/route.ts                # Resend webhook (email analytics)
│       ├── tickets/[ticketId]/
│       │   ├── pdf/route.ts                   # PDF download
│       │   ├── apple-wallet/route.ts          # .pkpass generation
│       │   └── google-wallet/route.ts         # Google Wallet pass
│       └── embed/[eventId]/route.ts           # Widget embed script
│
├── server/
│   ├── db/
│   │   ├── index.ts                           # Drizzle client
│   │   ├── schema/
│   │   │   ├── index.ts                       # Barrel export
│   │   │   ├── enums.ts                       # All pgEnums
│   │   │   ├── accounts.ts                    # users, accounts, sessions, two_factor
│   │   │   ├── organizations.ts               # orgs, org_groups, org_members
│   │   │   ├── venues.ts                      # venues, seat_maps, sections, seats
│   │   │   ├── events.ts                      # events, recurring_templates
│   │   │   ├── tickets.ts                     # ticket_types, tickets, price_tiers
│   │   │   ├── orders.ts                      # orders, order_items
│   │   │   ├── payments.ts                    # payments, refunds
│   │   │   ├── fees.ts                        # tax_rates, fee_configs, gratuity_configs
│   │   │   ├── attendees.ts                   # attendees
│   │   │   ├── check-ins.ts                   # check_in_lists, check_ins
│   │   │   ├── guest-list.ts                  # guest_list_entries, comp_allocations, holds
│   │   │   ├── waitlist.ts                    # waitlist_entries
│   │   │   ├── promo-codes.ts                 # promo_codes, promo_code_ticket_types
│   │   │   ├── talents.ts                     # event_talents, settlements
│   │   │   ├── menu.ts                        # menu_items, menu_selections
│   │   │   ├── upsells.ts                     # upsell_configs, order_upsells
│   │   │   ├── gift-cards.ts                  # gift_cards, gift_card_transactions
│   │   │   ├── marketing.ts                   # subscribers, segments, campaigns, campaign_events, automations
│   │   │   ├── surveys.ts                     # surveys, survey_responses
│   │   │   ├── referrals.ts                   # referral_links, referral_conversions
│   │   │   ├── customers.ts                   # customer_profiles
│   │   │   ├── bottle-service.ts              # bottle_service_packages, bottle_menu_items, bottle_service_orders, bottle_selections
│   │   │   ├── rentals.ts                     # rental_packages, rental_add_ons, rental_inquiries, rental_quotes, rental_payments, venue_blackout_dates
│   │   │   ├── runsheets.ts                   # runsheet_items, incident_logs
│   │   │   ├── audit.ts                       # audit_log
│   │   │   ├── notifications.ts               # notification_preferences
│   │   │   └── images.ts                      # images
│   │   └── relations.ts                       # All Drizzle relations
│   │
│   ├── auth/
│   │   ├── index.ts
│   │   ├── config.ts
│   │   ├── permissions.ts                     # RBAC helpers
│   │   └── two-factor.ts                      # TOTP verification
│   │
│   ├── trpc/
│   │   ├── init.ts                            # tRPC init + middleware
│   │   ├── router.ts                          # Root appRouter
│   │   ├── context.ts                         # Session, DB, org context
│   │   └── routers/
│   │       ├── auth.ts                        # Login, register, 2FA, password reset
│   │       ├── events.ts                      # CRUD, status, recurring
│   │       ├── venues.ts                      # Venue + seat map management
│   │       ├── ticket-types.ts                # CRUD, reorder, price tiers
│   │       ├── checkout.ts                    # Initiate, confirm, promo, gratuity, upsells, gift cards
│   │       ├── orders.ts                      # List, detail, refund, cancel
│   │       ├── attendees.ts                   # List, search, export
│   │       ├── check-in.ts                    # Scan, lists, stats
│   │       ├── guest-list.ts                  # Comps, guest entries, holds
│   │       ├── waitlist.ts                    # Join, manage, convert
│   │       ├── promo-codes.ts                 # CRUD
│   │       ├── talents.ts                     # Artist/promoter assignments
│   │       ├── settlements.ts                 # Payouts, 1099 data
│   │       ├── menu.ts                        # Menu CRUD, selections, kitchen export
│   │       ├── upsells.ts                     # Upsell config, merch, concessions
│   │       ├── gift-cards.ts                  # Purchase, redeem, balance
│   │       ├── referrals.ts                   # Links, tracking, rewards
│   │       ├── analytics.ts                   # Event, group, CLV, forecasting
│   │       ├── marketing.ts                   # Campaigns, subscribers, segments, automations
│   │       ├── surveys.ts                     # Create, results, NPS
│   │       ├── bottle-service.ts              # Packages, bottle menu, orders, table tracking
│   │       ├── rentals.ts                     # Inquiries, quotes, packages, add-ons, payments, availability
│   │       ├── runsheets.ts                   # Day-of-show timeline, incidents
│   │       ├── customers.ts                   # Profiles, CLV, churn
│   │       ├── audit.ts                       # Audit log queries
│   │       ├── images.ts                      # Upload presigned URL
│   │       └── settings.ts                    # Account, org, team, fees, security
│   │
│   ├── services/
│   │   ├── payment/
│   │   │   ├── types.ts                       # PaymentProvider interface
│   │   │   ├── provider.ts                    # Factory function
│   │   │   ├── stripe.ts                      # Stripe implementation
│   │   │   └── mock.ts                        # Mock for testing
│   │   ├── email/
│   │   │   ├── client.ts                      # Resend client
│   │   │   └── templates/
│   │   │       ├── order-confirmation.tsx
│   │   │       ├── ticket-delivery.tsx
│   │   │       ├── password-reset.tsx
│   │   │       ├── welcome.tsx
│   │   │       ├── event-reminder.tsx
│   │   │       ├── abandoned-cart.tsx
│   │   │       ├── waitlist-offer.tsx
│   │   │       ├── survey-request.tsx
│   │   │       ├── referral-reward.tsx
│   │   │       ├── gift-card-delivery.tsx
│   │   │       ├── win-back.tsx
│   │   │       └── campaign.tsx
│   │   ├── marketing/
│   │   │   ├── campaigns.ts                   # Campaign send logic
│   │   │   ├── segmentation.ts                # Audience query builder
│   │   │   └── automations.ts                 # Automated flow engine
│   │   ├── storage/
│   │   │   ├── types.ts                       # StorageProvider interface
│   │   │   ├── s3.ts
│   │   │   └── provider.ts
│   │   ├── pdf/
│   │   │   ├── ticket-generator.ts
│   │   │   └── settlement-generator.ts
│   │   ├── wallet/
│   │   │   ├── apple-pass.ts                  # .pkpass generation
│   │   │   └── google-pass.ts                 # Google Wallet API
│   │   ├── qr/
│   │   │   └── generator.ts                   # QR code + HMAC
│   │   ├── fees/
│   │   │   └── calculator.ts                  # Tax, service, gratuity, dynamic pricing engine
│   │   └── analytics/
│   │       ├── clv.ts                         # Customer lifetime value calculation
│   │       ├── forecasting.ts                 # Revenue projection
│   │       └── recommendations.ts             # "Fans also attended" engine
│   │
│   └── inngest/
│       ├── client.ts
│       └── functions/
│           ├── send-order-confirmation.ts
│           ├── send-ticket-email.ts
│           ├── send-event-reminder.ts         # 24h + 2h before event
│           ├── send-abandoned-cart.ts          # 1h after cart abandonment
│           ├── send-waitlist-offer.ts          # When capacity opens
│           ├── send-survey.ts                 # 24h after event ends
│           ├── send-win-back.ts               # Churn detection trigger
│           ├── send-referral-reward.ts
│           ├── send-gift-card.ts
│           ├── generate-ticket-pdf.ts
│           ├── generate-wallet-pass.ts        # Apple + Google
│           ├── generate-settlement-pdf.ts
│           ├── process-refund.ts
│           ├── process-waitlist-conversion.ts  # Auto-offer to next in line
│           ├── export-attendees-csv.ts
│           ├── export-menu-selections.ts      # Kitchen export
│           ├── expire-pending-orders.ts       # Cron: every 5 min
│           ├── expire-waitlist-offers.ts      # Cron: every 5 min
│           ├── transition-price-tiers.ts      # Cron: check tier thresholds
│           ├── send-campaign.ts               # Bulk email send
│           ├── send-upsell-post-purchase.ts   # Post-purchase upsell emails
│           ├── send-upsell-pre-event.ts       # Pre-event upsell reminders
│           ├── send-upsell-post-event.ts      # Post-event cross-venue offers
│           ├── send-upgrade-offer.ts          # Dynamic seat upgrade emails
│           ├── generate-cross-venue-code.ts   # Create cross-venue discount codes
│           ├── expire-cross-venue-codes.ts    # Cron: expire old discount codes
│           ├── aggregate-upsell-analytics.ts  # Cron: daily upsell analytics rollup
│           ├── send-rental-inquiry-notification.ts  # Notify org of new inquiry
│           ├── send-rental-quote.ts           # Email quote to renter
│           ├── send-rental-balance-reminder.ts # Reminder for balance due
│           ├── send-rental-confirmation.ts    # Booking confirmed email
│           ├── refund-damage-deposit.ts       # Release Stripe hold post-event
│           ├── calculate-clv.ts               # Periodic CLV recalculation
│           └── sync-stripe-webhook.ts
│
├── lib/
│   ├── utils.ts                               # cn(), formatCurrency, etc.
│   ├── constants.ts
│   ├── env.ts                                 # @t3-oss/env-nextjs
│   └── validators/
│       ├── event.ts
│       ├── ticket-type.ts
│       ├── venue.ts
│       ├── seat-map.ts
│       ├── order.ts
│       ├── checkout.ts                        # Includes gratuity, meal, upsells, gift card
│       ├── promo-code.ts
│       ├── auth.ts
│       ├── talent.ts
│       ├── settlement.ts
│       ├── menu.ts
│       ├── upsell.ts
│       ├── gift-card.ts
│       ├── referral.ts
│       ├── marketing.ts
│       ├── survey.ts
│       ├── runsheet.ts
│       ├── fees.ts
│       └── shared.ts                          # Pagination, IDs, etc.
│
├── components/
│   ├── ui/                                    # shadcn/ui primitives
│   ├── layouts/
│   │   ├── public-header.tsx
│   │   ├── public-footer.tsx
│   │   ├── dashboard-sidebar.tsx
│   │   ├── dashboard-topbar.tsx
│   │   └── promoter-layout.tsx
│   ├── forms/
│   │   ├── event-form.tsx
│   │   ├── ticket-type-form.tsx
│   │   ├── checkout-form.tsx
│   │   ├── promo-code-form.tsx
│   │   ├── menu-form.tsx
│   │   ├── talent-form.tsx
│   │   ├── campaign-form.tsx
│   │   ├── survey-form.tsx
│   │   ├── gift-card-form.tsx
│   │   └── login-form.tsx
│   ├── events/
│   │   ├── event-card.tsx
│   │   ├── event-list.tsx
│   │   ├── event-calendar.tsx                 # Monthly/weekly calendar
│   │   ├── event-countdown.tsx                # Countdown timer
│   │   ├── ticket-selector.tsx
│   │   ├── menu-selector.tsx
│   │   ├── event-status-badge.tsx
│   │   ├── scarcity-indicator.tsx             # "Only X left"
│   │   └── photo-gallery.tsx
│   ├── venues/
│   │   ├── seat-map-viewer.tsx                # Interactive seat picker (buyer)
│   │   ├── seat-map-editor.tsx                # Seat map configuration (admin)
│   │   └── table-assignment.tsx               # Dinner table management
│   ├── checkout/
│   │   ├── gratuity-selector.tsx              # 18%/20%/25%/custom
│   │   ├── order-summary.tsx                  # Full breakdown
│   │   ├── meal-selection.tsx
│   │   ├── upsell-carousel.tsx                # "Add to your order"
│   │   ├── gift-card-input.tsx                # Redeem gift card
│   │   ├── seat-selection.tsx                 # Seat picker in checkout
│   │   └── promo-code-input.tsx
│   ├── orders/
│   │   ├── order-summary.tsx
│   │   └── order-table.tsx
│   ├── check-in/
│   │   ├── qr-scanner.tsx
│   │   ├── check-in-status.tsx
│   │   └── guest-list-check-in.tsx
│   ├── analytics/
│   │   ├── sales-chart.tsx
│   │   ├── stat-card.tsx
│   │   ├── capacity-gauge.tsx
│   │   ├── clv-chart.tsx
│   │   ├── forecast-chart.tsx
│   │   ├── nps-gauge.tsx
│   │   ├── promoter-dashboard.tsx
│   │   └── group-overview.tsx
│   ├── marketing/
│   │   ├── campaign-editor.tsx
│   │   ├── subscriber-table.tsx
│   │   ├── segment-builder.tsx
│   │   └── automation-flow.tsx
│   ├── runsheet/
│   │   ├── timeline-view.tsx
│   │   └── incident-log.tsx
│   ├── wallet/
│   │   ├── add-to-apple-wallet.tsx
│   │   └── add-to-google-wallet.tsx
│   └── providers/
│       ├── trpc-provider.tsx
│       ├── theme-provider.tsx
│       └── session-provider.tsx
│
├── hooks/
│   ├── use-debounce.ts
│   ├── use-media-query.ts
│   ├── use-checkout.ts                        # Checkout state machine
│   └── use-seat-selection.ts                  # Seat map interaction state
│
└── trpc/
    ├── client.ts
    ├── server.ts
    └── query-client.ts
```

---

## Database Schema (50+ tables)

### Enums

```
userRole           = ['owner', 'admin', 'organizer', 'promoter', 'check_in_staff']
eventStatus        = ['draft', 'published', 'paused', 'archived', 'cancelled']
eventType          = ['concert', 'theater', 'comedy', 'dinner_theater', 'private', 'festival', 'other']
ticketTypeKind     = ['paid', 'free', 'donation', 'comp']
priceTierTrigger   = ['date', 'quantity_sold', 'manual']
orderStatus        = ['pending', 'completed', 'cancelled', 'refunded', 'partially_refunded', 'expired']
paymentStatus      = ['pending', 'succeeded', 'failed', 'refunded', 'partially_refunded']
paymentProvider    = ['stripe', 'free', 'gift_card']
paymentMethod      = ['card', 'gift_card', 'cash', 'comp']
ticketStatus       = ['active', 'used', 'cancelled', 'expired']
promoCodeType      = ['percentage', 'fixed']
feeType            = ['percentage', 'fixed', 'percentage_plus_fixed']
feeTarget          = ['buyer', 'organizer']
settlementStatus   = ['pending', 'paid', 'disputed']
dealType           = ['flat_fee', 'percentage_gross', 'percentage_net', 'door_split', 'guarantee_vs_percentage', 'flat_plus_percentage', 'custom']
campaignStatus     = ['draft', 'scheduled', 'sending', 'sent', 'cancelled']
automationType     = ['post_event', 'win_back', 'birthday', 'abandoned_cart', 'welcome']
waitlistStatus     = ['waiting', 'offered', 'converted', 'expired', 'cancelled']
seatStatus         = ['available', 'held', 'reserved', 'sold', 'blocked']
upsellType         = ['ticket_upgrade', 'merch', 'food_drink', 'experience', 'cross_venue_dining', 'cross_venue_discount', 'parking', 'convenience', 'charity', 'bundle']
upsellShowAt       = ['checkout', 'post_purchase', 'pre_event', 'post_event', 'all']
discountDelivery   = ['automatic_at_venue', 'email_code', 'in_app']
giftCardStatus     = ['active', 'redeemed', 'expired', 'cancelled']
surveyQuestionType = ['rating', 'text', 'multiple_choice', 'nps']
imageType          = ['event_cover', 'event_thumbnail', 'organizer_logo', 'gallery', 'campaign_header', 'merch']
auditAction        = ['create', 'update', 'delete', 'status_change', 'refund', 'login', 'settings_change']
runsheetItemType   = ['milestone', 'task', 'note']
```

### Auth & Users

**`users`** — id, publicId (uuid), email (unique), passwordHash, firstName, lastName, emailVerifiedAt, avatarUrl, twoFactorSecret (encrypted, nullable), twoFactorEnabledAt, createdAt, updatedAt

**`accounts`** — id, userId (FK), type, provider, providerAccountId, refreshToken, accessToken, expiresAt, tokenType

**`sessions`** — id, sessionToken (unique), userId (FK), expires

### Organizations & Multi-Venue

**`organization_groups`** — id, publicId, name, slug (unique), createdAt, updatedAt

**`organizations`** — id, publicId, groupId (FK, nullable), name, slug (unique), description, logoUrl, website, stripeAccountId, currency (default 'USD'), timezone (default 'America/Los_Angeles'), createdAt, updatedAt

**`organization_members`** — id, organizationId (FK), userId (FK), role (userRole), invitedAt, acceptedAt, createdAt, updatedAt. *Unique (orgId, userId)*

### Venues & Seat Maps

**`venues`** — id, publicId, organizationId (FK), name, address, city, state, zip, country, latitude, longitude, timezone, defaultCapacity, accessibilityNotes, createdAt, updatedAt

**`seat_maps`** — id, publicId, venueId (FK), name (e.g. "Theater Layout", "Dinner Config"), mapData (jsonb — sections, rows, seats as SVG/coordinate data), isDefault, createdAt, updatedAt

**`sections`** — id, publicId, seatMapId (FK), name (e.g. "Orchestra", "Balcony", "VIP Booth"), color, sortOrder, capacity, createdAt, updatedAt

**`seats`** — id, publicId, sectionId (FK), row (varchar), number (varchar), seatType (e.g. "standard", "wheelchair", "companion"), x (decimal — map coordinate), y (decimal), isActive, createdAt, updatedAt. *Unique (sectionId, row, number)*

**`seat_holds`** — id, eventId (FK), seatId (FK), holdType (e.g. "production", "ada", "sponsor", "comp"), heldBy (FK users), releasedAt, createdAt. *Unique (eventId, seatId) where releasedAt is null*

**`event_seat_pricing`** — id, eventId (FK), sectionId (FK), ticketTypeId (FK), price (cents). *Links sections to ticket type pricing for an event*

### Events

**`events`** — id, publicId, organizationId (FK), venueId (FK, nullable), seatMapId (FK, nullable), title, slug, description, shortDescription, eventType (enum), startDate (timestamptz), endDate, timezone, venueName, venueAddress, venueCity, venueState, venueZip, venueCountry, venueLatitude, venueLongitude, isOnline, onlineUrl, coverImageUrl, thumbnailImageUrl, status (eventStatus), maxAttendees, isSeated (boolean), ageRestriction (varchar, nullable — e.g. "21+", "18+", "all ages"), accessibilityNotes, seoTitle, seoDescription, seoKeywords, recurringTemplateId (FK, nullable), publishedAt, createdAt, updatedAt

**`recurring_event_templates`** — id, publicId, organizationId (FK), title, recurrenceRule (iCal RRULE), templateData (jsonb), isActive, createdAt, updatedAt

### Tickets & Dynamic Pricing

**`ticket_types`** — id, publicId, eventId (FK), name, description, kind (ticketTypeKind), basePrice (cents), currentPrice (cents), minPerOrder, maxPerOrder, quantityTotal, quantitySold, saleStartDate, saleEndDate, sortOrder, isHidden, isDisabled, hasDynamicPricing, createdAt, updatedAt

**`price_tiers`** — id, publicId, ticketTypeId (FK), name (e.g. "Early Bird", "Regular", "Last Minute"), price (cents), triggerType (priceTierTrigger), triggerValue (int — date timestamp, quantity threshold, or null for manual), startsAt (timestamptz, nullable), endsAt (timestamptz, nullable), isActive, sortOrder, createdAt, updatedAt

**`tickets`** — id, publicId, shortId (unique), orderId (FK), orderItemId (FK), ticketTypeId (FK), eventId (FK), attendeeId (FK, nullable), seatId (FK, nullable), status (ticketStatus), qrCodeData (unique), pdfUrl, walletPassUrl, pdfGeneratedAt, walletPassGeneratedAt, createdAt, updatedAt

### Orders & Payments

**`orders`** — id, publicId, shortId (unique), eventId (FK), userId (FK, nullable), firstName, lastName, email, status (orderStatus), currency, subtotalAmount (cents), discountAmount (cents), taxAmount (cents), serviceFeeAmount (cents), autoGratuityAmount (cents), additionalGratuityAmount (cents), upsellAmount (cents), giftCardAmount (cents), totalAmount (cents), promoCodeId (FK, nullable), referralLinkId (FK, nullable), notes, expiresAt, completedAt, cancelledAt, abandonedCartSentAt (nullable), createdAt, updatedAt

**`order_items`** — id, orderId (FK), ticketTypeId (FK), seatId (FK, nullable), quantity, unitPrice (cents), totalPrice (cents), priceTierId (FK, nullable), createdAt

**`order_upsells`** — id, orderId (FK), upsellConfigId (FK), name, quantity, unitPrice (cents), totalPrice (cents), createdAt

**`payments`** — id, publicId, orderId (FK), provider (paymentProvider), method (paymentMethod), providerPaymentId, providerChargeId, amount (cents), currency, status (paymentStatus), providerData (jsonb), paidAt, failedAt, failureReason, createdAt, updatedAt

**`refunds`** — id, publicId, paymentId (FK), orderId (FK), amount (cents), reason, providerRefundId, status (paymentStatus), processedAt, processedBy (FK users), createdAt, updatedAt

### Fees, Tax & Gratuity

**`tax_rates`** — id, organizationId (FK), name, rate (decimal), isActive, isDefault, createdAt, updatedAt

**`fee_configurations`** — id, organizationId (FK), name, feeType (feeType), fixedAmount (cents, nullable), percentageRate (decimal, nullable), target (feeTarget), isActive, createdAt, updatedAt

**`gratuity_configurations`** — id, organizationId (FK), name, autoGratuityRate (decimal), allowAdditionalGratuity (boolean), suggestedRates (jsonb), appliesToEventTypes (jsonb), isActive, createdAt, updatedAt

### Attendees & Check-in

**`attendees`** — id, publicId, eventId (FK), ticketId (FK, nullable), orderId (FK), firstName, lastName, email, phone, dietaryRestrictions, ageVerified (boolean, default false), checkedInAt, checkedInBy (FK users), createdAt, updatedAt

**`check_in_lists`** — id, publicId, eventId (FK), name, description, activatesAt, expiresAt, createdAt, updatedAt

**`check_in_list_ticket_types`** — checkInListId (FK), ticketTypeId (FK). *Composite PK*

**`check_ins`** — id, ticketId (FK), checkInListId (FK), checkedInBy (FK users), checkedInAt, comment. *Unique (ticketId, checkInListId)*

### Guest List, Comps, Holds & Waitlist

**`comp_allocations`** — id, publicId, eventId (FK), ticketTypeId (FK), allocatedTo (FK users), quantity, quantityUsed, notes, createdAt, updatedAt

**`guest_list_entries`** — id, publicId, eventId (FK), name, email, phone, plusCount (default 0), addedBy (FK users), notes, checkedInAt, checkedInBy (FK users, nullable), createdAt

**`holds`** — id, publicId, eventId (FK), ticketTypeId (FK), name, quantity, releasedAt, createdBy (FK users), createdAt, updatedAt

**`waitlist_entries`** — id, publicId, eventId (FK), ticketTypeId (FK, nullable), email, firstName, lastName, quantity (int), status (waitlistStatus), offeredAt, offerExpiresAt, convertedOrderId (FK orders, nullable), createdAt, updatedAt

### Talents & Settlements

**`event_talents`** — id, publicId, eventId (FK), userId (FK, nullable), name, email, role (e.g. "headliner", "opener", "promoter", "co-promoter", "support"), dealType (dealType), dealConfig (jsonb — flexible structure per deal type, see below), dealMemo (text, nullable — contract notes), techRiderData (jsonb — checklist items), techRiderConfirmedAt, createdAt, updatedAt

`dealConfig` JSON structure by deal type:
- `flat_fee`: `{ "amount": 200000 }` — $2,000
- `percentage_gross`: `{ "percentage": 70 }` — 70% of gross
- `percentage_net`: `{ "percentage": 80 }` — 80% of net
- `door_split`: `{ "artistPercentage": 70, "venuePercentage": 30, "splitBasis": "gross", "thresholdAmount": null }` — or with threshold: `{ "artistPercentage": 70, "venuePercentage": 30, "splitBasis": "gross", "thresholdAmount": 50000 }` (split kicks in after $500)
- `guarantee_vs_percentage`: `{ "guaranteeAmount": 150000, "percentage": 60, "percentageBasis": "gross" }` — $1,500 guarantee OR 60% of gross
- `flat_plus_percentage`: `{ "flatAmount": 100000, "percentage": 50, "thresholdAmount": 300000, "percentageBasis": "gross" }` — $1,000 + 50% of gross above $3,000
- `custom`: `{ "description": "...", "terms": {...} }` — free-form with notes

**`settlements`** — id, publicId, eventTalentId (FK), eventId (FK), grossRevenue (cents), netRevenue (cents), taxDeducted (cents), feesDeducted (cents), gratuityDeducted (cents), dealType (dealType — snapshot at settlement time), dealConfig (jsonb — snapshot of deal terms), calculationBreakdown (jsonb — step-by-step calculation showing how talentAmount was derived), talentAmount (cents), venueAmount (cents — venue's share for door splits), guaranteeAmount (cents, nullable — for guarantee vs % deals, shows guarantee value), percentageAmount (cents, nullable — for guarantee vs % deals, shows percentage value), appliedMethod (varchar, nullable — "guarantee" or "percentage" for guarantee vs % deals), status (settlementStatus), paidAt, paidBy (FK users, nullable), notes, pdfUrl, taxYear (int), createdAt, updatedAt

**`report_links`** — id, publicId, token (varchar, unique, indexed — cryptographically random), eventTalentId (FK), eventId (FK), createdBy (FK users), label (varchar, nullable — e.g. "For manager", "For artist"), expiresAt (timestamptz, nullable — null = permanent), revokedAt (timestamptz, nullable), pin (varchar, nullable — hashed, for optional password protection), lastViewedAt (timestamptz, nullable), viewCount (int, default 0), createdAt, updatedAt

### Menu (Dinner Events)

**`menu_items`** — id, publicId, eventId (FK), category, name, description, isDefault, sortOrder, createdAt, updatedAt

**`menu_selections`** — id, ticketId (FK), menuItemId (FK), dietaryNotes, createdAt

### Upsells, Cross-Venue Promotions & Merchandise

**`upsell_configs`** — id, publicId, organizationId (FK), eventId (FK, nullable — null = org-wide or cross-venue), type (upsellType), name, description, imageUrl, price (cents, nullable — null for discount-only offers), compareAtPrice (cents, nullable — "was $X" strikethrough), costToOrganizer (cents, nullable — for margin tracking on merch), quantityTotal (nullable), quantitySold (default 0), sortOrder, isActive, showAt (upsellShowAt), showAfterMinutes (int, nullable — delay for post-purchase emails), expiresAfterMinutes (int, nullable — time-limited offers), crossVenueOrganizationId (FK organizations, nullable — target venue), crossVenueEventId (FK events, nullable — specific event at other venue), discountType (promoCodeType, nullable — for cross-venue discounts), discountValue (int, nullable — percentage or cents), discountDelivery (discountDelivery, nullable), discountValidDays (int, nullable — how many days the discount is valid), dynamicPricingEnabled (boolean, default false), dynamicPricingFloor (cents, nullable — min price for seat upgrades), bundleItems (jsonb, nullable — [{upsellConfigId, name, type}]), requiresTicketTypeId (FK ticket_types, nullable — only show for specific ticket types), excludeTicketTypeId (FK ticket_types, nullable — hide for specific ticket types), createdAt, updatedAt

**`order_upsells`** — id, orderId (FK), upsellConfigId (FK), name, quantity, unitPrice (cents), totalPrice (cents), seatId (FK, nullable — for seat upgrades), createdAt

**`upsell_email_offers`** — id, publicId, orderId (FK), upsellConfigId (FK), sentAt, clickedAt, convertedAt, convertedOrderId (FK orders, nullable), offerPrice (cents — may differ from base if dynamic/discounted), expiresAt, emailType ('post_purchase', 'pre_event', 'post_event', 'upgrade_available'), createdAt

**`cross_venue_discount_codes`** — id, publicId, upsellConfigId (FK), orderId (FK — the triggering purchase), code (unique, varchar), organizationId (FK — venue where discount is redeemable), discountType (promoCodeType), discountValue (int), isRedeemed (boolean, default false), redeemedAt, redeemedOrderId (FK orders, nullable), validFrom (timestamptz), validUntil (timestamptz), createdAt

**`upsell_analytics_daily`** — id, date (date), eventId (FK, nullable), upsellConfigId (FK), impressions (int), clicks (int), conversions (int), revenue (cents), attachRate (decimal), sourceType (upsellShowAt — where the conversion happened), createdAt

### Gift Cards

**`gift_cards`** — id, publicId, code (unique, varchar), organizationGroupId (FK), originalAmount (cents), currentBalance (cents), purchasedBy (FK users, nullable), recipientEmail, recipientName, personalMessage, status (giftCardStatus), expiresAt (nullable), purchasedAt, createdAt, updatedAt

**`gift_card_transactions`** — id, giftCardId (FK), orderId (FK, nullable), amount (cents), type ('purchase', 'redemption', 'refund_credit'), createdAt

### Email Marketing

**`subscribers`** — id, publicId, email (unique), firstName, lastName, organizationGroupId (FK, nullable), source, subscribedAt, unsubscribedAt, createdAt, updatedAt

**`subscriber_organizations`** — subscriberId (FK), organizationId (FK), isSubscribed (boolean). *Composite PK*

**`campaigns`** — id, publicId, organizationId (FK), name, subject, bodyHtml, bodyJson (jsonb), status (campaignStatus), segmentCriteria (jsonb), scheduledAt, sentAt, recipientCount, createdAt, updatedAt

**`campaign_events`** — id, campaignId (FK), subscriberId (FK), eventType, metadata (jsonb), occurredAt

**`automations`** — id, publicId, organizationId (FK), type (automationType), name, triggerConfig (jsonb), emailSubject, emailBodyHtml, emailBodyJson (jsonb), isActive, createdAt, updatedAt

### Surveys

**`surveys`** — id, publicId, eventId (FK), questions (jsonb — array of {type, text, options}), isActive, createdAt, updatedAt

**`survey_responses`** — id, publicId, surveyId (FK), attendeeId (FK, nullable), email, answers (jsonb), npsScore (int, nullable — 0-10), createdAt

### Referrals

**`referral_links`** — id, publicId, code (unique), organizationGroupId (FK), createdBy (FK users, nullable), eventId (FK, nullable — null = all events), rewardType ('fixed', 'percentage'), rewardValue (int), maxUses (nullable), timesUsed (default 0), isActive, expiresAt, createdAt, updatedAt

**`referral_conversions`** — id, referralLinkId (FK), orderId (FK), rewardAmount (cents), rewardPaidAt, createdAt

### Customers

**`customer_profiles`** — id, publicId, userId (FK, nullable), email (unique), firstName, lastName, phone, dietaryPreferences, totalSpend (cents), eventCount, averageOrderValue (cents), clvTier ('vip', 'regular', 'casual', 'new'), lastEventAt, firstSeenAt, npsAverage (decimal, nullable), createdAt, updatedAt

### Table & Bottle Service

**`bottle_service_packages`** — id, publicId, eventId (FK), name (e.g. "Silver Table", "Gold Table"), description, price (cents, nullable — null if minimum-spend model), minimumSpend (cents, nullable), tableCapacity (int — seats at the table), bottleCount (int — included bottles), includedAddOns (jsonb, nullable — [{name, description}]), quantityTotal (int), quantitySold (default 0), sortOrder, isActive, createdAt, updatedAt

**`bottle_menu_items`** — id, publicId, organizationId (FK), name (e.g. "Grey Goose", "Moët"), category ('vodka', 'whiskey', 'tequila', 'champagne', 'wine', 'non_alcoholic'), price (cents — venue price), costToOrganizer (cents — wholesale cost for margin tracking), description, isAvailable, sortOrder, createdAt, updatedAt

**`bottle_service_orders`** — id, publicId, orderId (FK — linked to the ticket order), packageId (FK bottle_service_packages), eventId (FK), tableAssignment (varchar, nullable — e.g. "VIP-1", "Table 3"), serverAssignedTo (FK users, nullable), status ('reserved', 'active', 'completed', 'cancelled'), currentSpend (cents — for minimum-spend tracking), notes, createdAt, updatedAt

**`bottle_selections`** — id, bottleServiceOrderId (FK), bottleMenuItemId (FK), quantity, unitPrice (cents), createdAt

### Venue Rental & Private Events

**`rental_packages`** — id, publicId, organizationId (FK), venueId (FK), name (e.g. "Full Venue Evening", "Private Dining Room"), description, pricingType ('flat', 'hourly', 'multi_day'), basePrice (cents — flat rate or per-hour rate), minimumHours (int, nullable), maximumHours (int, nullable), maxGuests (int, nullable), isActive, sortOrder, createdAt, updatedAt

**`rental_add_ons`** — id, publicId, organizationId (FK), name (e.g. "Sound System + Tech", "Catering from McFiler's"), description, price (cents), pricingType ('flat', 'per_hour', 'per_guest'), isActive, sortOrder, createdAt, updatedAt

**`rental_inquiries`** — id, publicId, organizationId (FK), venueId (FK), status ('new', 'reviewing', 'quoted', 'deposit_paid', 'balance_paid', 'confirmed', 'completed', 'cancelled', 'declined'), firstName, lastName, email, phone, company (nullable), eventType (varchar — e.g. "wedding", "corporate", "birthday"), eventDate (date), eventEndDate (date, nullable — for multi-day), startTime (time), endTime (time), guestCount (int), packageId (FK rental_packages, nullable), specialRequests (text, nullable), internalNotes (text, nullable), createdAt, updatedAt

**`rental_quotes`** — id, publicId, inquiryId (FK), createdBy (FK users), lineItems (jsonb — [{name, description, quantity, unitPrice, totalPrice}]), subtotal (cents), taxAmount (cents), depositAmount (cents), depositPercentage (int — e.g. 50 for 50%), totalAmount (cents), balanceDueDate (date), cancellationPolicy (text), termsAndConditions (text), validUntil (date), acceptedAt (timestamptz, nullable), declinedAt (timestamptz, nullable), createdAt, updatedAt

**`rental_payments`** — id, publicId, quoteId (FK), type ('deposit', 'balance', 'add_on', 'damage_deposit', 'damage_deposit_refund'), amount (cents), paymentId (FK payments, nullable — links to Stripe payment), paidAt, createdAt

**`venue_blackout_dates`** — id, venueId (FK), date (date), reason (varchar, nullable), createdBy (FK users), createdAt

### Day-of-Show Operations

**`runsheet_items`** — id, publicId, eventId (FK), type (runsheetItemType), title, description, startsAt (timestamptz), endsAt (timestamptz, nullable), assignedTo (FK users, nullable), isCompleted, sortOrder, createdAt, updatedAt

**`incident_logs`** — id, publicId, eventId (FK), reportedBy (FK users), description, severity ('low', 'medium', 'high'), occurredAt, createdAt

### Audit

**`audit_log`** — id, organizationId (FK), userId (FK), action (auditAction), entityType (varchar — e.g. 'event', 'order', 'ticket_type'), entityId (int), changes (jsonb — {field, oldValue, newValue}), ipAddress, userAgent, createdAt

### Images

**`images`** — id, publicId, organizationId (FK), type (imageType), fileName, mimeType, sizeBytes, s3Key, url, createdAt

### Future: Notifications

**`notification_preferences`** — id, userId (FK), organizationId (FK, nullable), eventReminders (boolean), marketingEmails (boolean), pushEnabled (boolean), createdAt, updatedAt

---

## Key Architecture Decisions

### Payment Provider Strategy Pattern

```typescript
interface PaymentProvider {
  createPaymentIntent(params: {
    amount: number;
    currency: string;
    metadata: Record<string, string>;
    idempotencyKey: string;
  }): Promise<{ providerPaymentId: string; clientSecret: string }>;
  confirmPayment(providerPaymentId: string): Promise<PaymentResult>;
  refundPayment(params: {
    providerPaymentId: string;
    amount: number;
    reason?: string;
  }): Promise<RefundResult>;
  constructWebhookEvent(payload: string | Buffer, signature: string): WebhookEvent;
  handleWebhookEvent(event: WebhookEvent): Promise<WebhookHandlerResult>;
}
```

Factory `getPaymentProvider(name)` returns the concrete implementation. Adding a new provider = implement interface + register in factory. Free orders and comp orders bypass the provider entirely.

### Fee Calculation Engine

```
base price         = ticket price (from current price tier if dynamic pricing)
subtotal           = sum of (base price × quantity) + upsell items
discount           = promo code applied
taxable amount     = subtotal - discount
tax                = taxable amount × tax rate(s)
service fee        = per-ticket fee (fixed + %) × quantity
auto gratuity      = (subtotal - discount) × auto gratuity rate (dinner events only)
additional gratuity = buyer-specified amount
gift card credit   = applied gift card amount (reduces payment, not total)
─────────────────────────────────────────────────
total              = taxable amount + tax + service fee + auto gratuity + additional gratuity
payment due        = total - gift card credit
```

Promoter view only sees: tickets sold, subtotal, discount, net revenue. Tax, service fees, gratuity, and upsells are hidden.

### Dynamic Pricing Engine

Price tiers can be triggered by:
- **Date**: "Early bird until March 1" → auto-transitions to next tier
- **Quantity sold**: "First 100 tickets at $25, then $35" → transitions when threshold hit
- **Manual**: Organizer manually activates next tier

An Inngest cron job (`transition-price-tiers`) checks date-based triggers every 5 minutes. Quantity-based transitions happen atomically during checkout when `quantitySold` is updated.

### Seat Map System

Seat maps are stored as JSON data (sections, rows, seats with x/y coordinates) rendered by a React canvas/SVG component. The viewer component shows available/sold/held status in real-time. During checkout, selected seats are temporarily reserved (same 15-minute expiry as orders). Seat selection integrates with the capacity system — selecting a seat atomically marks it as `reserved` and increments `quantitySold`.

### Wallet Pass Generation

- **Apple Wallet**: Uses `passkit-generator` npm package to create `.pkpass` files. Pass includes event name, date, venue, seat, QR code, and PNWTickets branding. Passes auto-update if event details change (push notification via Apple Push Notification Service).
- **Google Wallet**: Uses Google Wallet API to create passes. Similar content to Apple.
- Generated as Inngest background jobs alongside PDFs after order completion.

### Waitlist Auto-Conversion

When a refund or cancellation releases capacity:
1. Inngest function `process-waitlist-conversion` fires
2. Finds the oldest `waiting` entry for that event/ticket type
3. Changes status to `offered`, sets `offerExpiresAt` (2 hours)
4. Sends waitlist offer email with direct checkout link
5. If offer expires, Inngest cron marks it `expired` and offers to the next person
6. When buyer completes purchase, entry marked `converted` with `convertedOrderId`

### Abandoned Cart Recovery

When an order is created with status `pending`:
1. If not completed within 1 hour AND not expired, Inngest triggers `send-abandoned-cart`
2. Email includes event name, selected tickets, and a direct link to resume checkout
3. Optional: include a small incentive for high-value events
4. `abandonedCartSentAt` on the order prevents duplicate emails
5. Only sent once per order

### Embeddable Ticket Widget

- Standalone page at `/embed/[eventId]` with minimal chrome (no header/footer)
- Loaded via iframe or web component script on external sites
- PostMessage API for parent page communication (resize, redirect on completion)
- Supports the full checkout flow including seat selection

### Referral Tracking

Each referral link has a unique code. When someone visits `/r/[code]`, they're redirected to the event page with a tracking cookie/URL parameter. If they purchase, the `referralLinkId` is stored on the order and a `referral_conversion` is created. Reward payout is tracked but manual (or automated via Stripe if connected).

### Audit Log

Every mutation in the tRPC routers writes to `audit_log` via middleware. The middleware captures:
- Who (userId from session)
- What (action type, entity type, entity ID)
- Changes (diff of old vs. new values for updates)
- When + IP + user agent

This runs asynchronously (fire-and-forget insert) to not slow down the main operation.

### Customer Lifetime Value

CLV is calculated periodically via Inngest:
- `totalSpend` / months since `firstSeenAt` × projected lifetime (36 months)
- Tiered automatically: VIP ($1000+), Regular ($200-999), Casual (<$200), New (first purchase)
- Used for email segmentation and analytics dashboards

### Mobile App Readiness

- tRPC API is JSON-first
- JWT auth works for mobile bearer tokens
- Wallet passes work natively on mobile
- Notification preferences table ready for push notifications
- All file references use URLs
- React Native + Expo can import the same tRPC client types
- Offline check-in designed for (cache event ticket list on device)

---

## Implementation Phases

### Phase 1: Foundation
*Scaffold, database, auth, 2FA — the app boots and you can log in*

- Initialize Next.js 15 + TypeScript + Tailwind + shadcn/ui
- Set up full Drizzle schema (all 50+ tables) + initial migration
- Configure @t3-oss/env-nextjs for validated environment variables
- Auth.js v5 with credentials provider + Drizzle adapter
- Two-factor authentication (TOTP) setup + verification flow
- tRPC setup: init, context, middleware (auth, org-scoping, audit logging), auth router
- Login, register, forgot-password, reset-password, 2FA pages
- Dashboard layout shell (sidebar, topbar)
- Organization + organization group creation on registration
- Audit log middleware (auto-records all mutations)
- Resend client + welcome email template

**Deliverable:** User registers → auto-creates org → sets up 2FA → logs in → sees empty dashboard with sidebar nav. All admin actions are audit-logged.

### Phase 2: Venues, Events & Calendar
*Venue setup, seat maps, event creation, calendar view*

- Venues tRPC router: CRUD, seat map management
- Seat map data model + visual editor (section/row/seat configuration)
- Events tRPC router: full CRUD + status transitions + venue/seat map linking
- Multi-step event creation form (details → venue/seating → menu → SEO)
- Event list page with status filtering and search
- Event status lifecycle: draft → published → paused/archived/cancelled
- S3 storage provider + presigned URL image upload
- Public event detail page with SSR + SEO meta + dynamic OG image
- Public events listing with filters
- Interactive seat map viewer on public event page (shows available/sold)
- Event calendar component on dashboard (monthly/weekly, color-coded)
- Quick-add event from calendar date click
- Recurring event templates
- Accessibility notes per event + ADA seat marking
- Event countdown timer component

**Deliverable:** Organizer creates venues with seat maps, creates events (including seated + recurring), publishes them. Dashboard shows calendar. Public site displays events with interactive seat maps and SEO.

### Phase 3: Tickets, Dynamic Pricing, Fees & Checkout
*Purchase flow with seat selection, dynamic pricing, tax, fees, gratuity, upsells*

- Ticket type CRUD + reorder + dynamic pricing tiers
- Price tier management (early bird → regular → last-minute, date or quantity triggered)
- Inngest: transition-price-tiers cron
- Ticket selector + seat selection component on public event page
- Fee configuration settings page (tax rates, service charges, absorption rules)
- Gratuity configuration settings page
- Upsell configuration per event (merch, upgrades, cross-venue, concessions)
- Fee calculator service (full order breakdown including dynamic pricing)
- Payment provider strategy pattern + Stripe implementation
- Checkout tRPC router: initiate → seat reservation → apply promo → upsells → gratuity → confirm
- Checkout page with Stripe Elements + seat selection + meal selection + gratuity selector + upsell carousel + gift card input
- Scarcity indicators ("Only X left in Orchestra")
- Order summary component (subtotal, discount, tax, fees, gratuity, upsells, gift card, total)
- Atomic capacity management with row locking (seats + general admission)
- Stripe webhook handler
- Order confirmation page
- Inngest: expire-pending-orders cron
- Menu management page for dinner events
- Embeddable ticket widget (/embed/[eventId])

**Deliverable:** Full purchase flow with seat selection, dynamic pricing, tax, service charges, gratuity, upsells, and meal selection. Embeddable on external sites. Capacity enforced.

### Phase 4: Ticket Delivery & Wallet Passes
*PDF tickets, Apple/Google Wallet, QR codes, email delivery*

- QR code generation with HMAC signing
- PDF ticket template via @react-pdf/renderer (event, seat, QR, branding)
- Apple Wallet .pkpass generation (passkit-generator)
- Google Wallet pass generation
- Inngest: generate-ticket-pdf, generate-wallet-pass
- Inngest: send-order-confirmation, send-ticket-email (with PDF + wallet pass links)
- Inngest: send-event-reminder (24h + 2h before event)
- Inngest: send-abandoned-cart (1h after cart abandonment)
- React Email templates: confirmation, ticket, reminder, abandoned cart
- .ics calendar attachment in confirmation
- Ticket view page with QR + "Add to Apple Wallet" / "Add to Google Wallet" buttons
- PDF download endpoint
- Order lookup page (shortId + email)
- Abandoned cart tracking on orders

**Deliverable:** After purchase, buyer gets wallet passes + PDF tickets + confirmation email. Reminders sent automatically. Abandoned carts trigger recovery emails.

### Phase 5: Orders, Attendees, Guest Management & Waitlist
*Order management, refunds, comps, guest list, holds, waitlist*

- Orders tRPC router: list, detail, refund (full + partial), cancel, resend
- Order list page with filtering, search, pagination (DataTable)
- Order detail page with full breakdown (including seat, upsells, fees)
- Refund flow through payment provider + Inngest (auto-triggers waitlist)
- Attendees tRPC router: list, search, export
- Attendee list with search, filtering, age verification status
- CSV export via Inngest
- Comp allocations — assign comp ticket blocks to promoters
- Guest list — name-based door entry with plus-count
- Holds — reserve ticket/seat blocks, one-click release
- Waitlist — join when sold out, auto-conversion on cancellation/refund
- Inngest: process-waitlist-conversion, expire-waitlist-offers
- Waitlist management page
- Menu selection export — kitchen report by table + dietary needs
- Inventory forecasting from menu selections
- Reusable DataTable component (server-side pagination via URL params)

**Deliverable:** Full order management with refunds. Comps, guest list, holds, and waitlist all functional. Waitlist auto-converts when capacity opens. Kitchen gets table-based meal reports.

### Phase 6: Check-in & Day-of-Show
*QR scanning, guest list check-in, runsheet, door operations*

- Check-in tRPC router: scan, lists, stats, recent scans
- Check-in list management (create lists, assign ticket types)
- QR scanner (html5-qrcode, camera-based, mobile-optimized)
- Scan validation: HMAC → DB lookup → seat verification → duplicate detection
- Scan result UI: success (name, ticket, seat, age verification flag) / already scanned / invalid
- Guest list check-in mode — name search at door
- Real-time check-in stats (auto-refresh)
- Recent scans feed
- Door sales mode — quick POS-style sale for walk-ups
- Cash payment tracking
- Runsheet tRPC router: CRUD for timeline items
- Day-of-show timeline view (doors, soundcheck, sets, curfew)
- Staff assignment to runsheet items
- Checklist completion tracking
- Incident log — timestamped notes during event
- Cash reconciliation page

**Deliverable:** Staff scans QR codes and checks in guest list on mobile. Runsheet keeps the event on track. Door sales and cash tracked. Incidents logged.

### Phase 7: Analytics, Promoter Portal, Settlements & Surveys
*Dashboards, artist views, payouts, post-event feedback*

- Analytics tRPC router: event overview, sales timeline, dashboard summary, group summary, CLV, forecasting, best-selling analysis
- Event analytics page: sales, revenue by ticket/section, sales over time, orders by status, capacity gauge, seat map heatmap
- Dashboard home: summary stats + event calendar + recent orders
- Group-level analytics: cross-venue revenue, customer overlap, CLV distribution
- Best-selling analysis: day of week, event type, price point, purchase time
- Revenue forecasting based on sales velocity
- "Fans also attended" recommendation engine
- Promoter portal (separate route group, restricted layout):
  - Net revenue only (no tax, fees, gratuity, upsells)
  - Sales timeline + ticket count
  - Comp management
  - Shareable report links (time-limited, no login)
- Talent management: assign artists/promoters with deal terms
- Tech rider management (checklist format)
- Settlement tracking: calculate payouts, mark paid/unpaid, PDF export
- 1099 data tracking (artists $600+/year), tax year summary export
- Promo code CRUD + usage tracking + checkout integration
- Post-event survey system: auto-send 24h after event, NPS scoring
- Survey results page with NPS gauge
- Customer profiles page: CLV, purchase history, dietary prefs, NPS, churn risk
- Churn detection: flag inactive customers (90/180/365 days)
- Inngest: send-survey, calculate-clv
- Charts via Recharts

**Deliverable:** Full analytics suite. Promoters see restricted stats. Settlements calculated. Surveys collect NPS. Customer profiles track CLV and churn.

### Phase 8: Referrals, Gift Cards & Customer Intelligence
*Referral program, gift cards, CLV segmentation, recommendations*

- Referral link management: create links, set rewards, track performance
- Referral tracking in checkout flow (cookie + URL param)
- Referral conversion tracking + reward management
- Referral dashboard with performance metrics
- QR code generation for physical flyers with tracking
- Gift card system: purchase online, email delivery, balance tracking
- Gift card redemption in checkout (as payment method)
- Partial redemption support
- Gift card management page (issued, redeemed, balances)
- Cross-venue gift card support (organization group level)
- Customer CLV tier segmentation (VIP/Regular/Casual/New)
- "Fans also attended" recommendations on event pages
- Customer profile detail page (full purchase history across venues)
- Inngest: send-referral-reward, send-gift-card

**Deliverable:** Referral program drives organic growth. Gift cards work across all venues. Customer intelligence powers segmentation.

### Phase 9: Email Marketing & Polish
*Campaigns, automation, and production hardening*

- Subscriber management: import, manual add, auto-subscribe on checkout (opt-in)
- Per-venue subscription preferences
- Audience segmentation: venue, event type, CLV tier, purchase history, engagement, churn risk
- Campaign builder with visual editor
- Campaign scheduling + sending via Inngest
- Campaign analytics: delivered, opened, clicked, bounced, unsubscribed
- Automated flows: post-event thank you, win-back, birthday, abandoned cart, welcome
- Unsubscribe / preference center (CAN-SPAM compliant)
- Resend webhook handler for email analytics
- Error boundaries + loading skeletons across all pages
- Optimistic updates for key mutations (check-in, status changes)
- Rate limiting on public endpoints (checkout, auth, subscribe)
- Mobile responsiveness pass on all pages
- Accessibility audit (keyboard nav, ARIA, focus management)
- Settings pages: account, org, team, fees, gratuity, security (2FA), audit log
- Photo gallery upload for past events
- GDPR: customer data export + right to erasure
- Production deployment config (Vercel + Railway)
- End-to-end smoke testing

**Deliverable:** Full email marketing with automation. Production-ready platform deployed.

---

## Phase 0: Hi.Events Data Migration

Before building the new platform, we need to extract all existing data from the current Hi.Events instance and import it into PNWTickets. This runs as a pre-phase — the migration tooling is built during Phase 1 and executed before go-live.

### Extraction Strategy

Two available paths for getting data out of Hi.Events:

**Path A: Direct Database Access (Recommended)**
- Connect directly to the Hi.Events PostgreSQL database (read-only)
- Full access to all historical data including soft-deleted records
- Most reliable — no API pagination limits or rate limiting
- Can run as a single transaction for consistency

**Path B: REST API Extraction (Fallback)**
- Hi.Events exposes a full REST API for all entities
- Requires authentication (admin account)
- May be paginated — need to handle large datasets
- Useful if direct DB access isn't available (e.g., managed hosting)

### Data Mapping: Hi.Events → PNWTickets

| Hi.Events Entity | PNWTickets Table | Notes |
|-------------------|-----------------|-------|
| `accounts` | `organizations` | Hi.Events account = PNWTickets org |
| `account_users` | `organization_members` | Map roles (owner stays owner) |
| `users` | `users` | Email, name, password hash (bcrypt compatible) |
| `organizers` | `organizations` (metadata) | Merge organizer profile into org |
| `events` | `events` | Map status, dates, venue info |
| `event_settings` | `events` (fields) | Fold settings into event record |
| `event_statistics` | Recalculated | Don't migrate stats — recalculate from orders |
| `products` | `ticket_types` | Map product types to ticket kinds |
| `product_prices` | `ticket_types` + `price_tiers` | Current price → ticket type, historical → tiers |
| `product_categories` | — | Flatten or map to ticket type names |
| `orders` | `orders` | Map all monetary fields (float → int cents) |
| `order_items` | `order_items` | Link to new ticket type IDs |
| `attendees` | `attendees` + `tickets` | Hi.Events attendee = PNWTickets attendee + issued ticket |
| `attendee_check_ins` | `check_ins` | Preserve check-in timestamps |
| `check_in_lists` | `check_in_lists` | Map event references |
| `promo_codes` | `promo_codes` | Map discount types, applicable product IDs → ticket type IDs |
| `questions` | — | Custom questions not in MVP, store as JSON backup |
| `question_answers` | — | Store as JSON backup for future import |
| `stripe_payments` | `payments` | Map Stripe payment intent IDs, amounts (float → cents) |
| `invoices` | — | Store as JSON backup |
| `tax_and_fees` | `tax_rates` + `fee_configurations` | Map to new fee structure |
| `images` | `images` | Copy S3 objects to new bucket, update URLs |
| `affiliates` | `referral_links` | Map affiliate data to referral system |
| `waitlist_entries` | `waitlist_entries` | Map status values |
| `webhooks` | — | Not migrated (new webhook system post-MVP) |
| `messages` / `outgoing_messages` | — | Not migrated (new email system) |

### Critical Transformations

**Monetary Values: Float → Integer Cents**
Hi.Events stores money as floats (e.g., `45.50`). PNWTickets uses integer cents (e.g., `4550`). Every monetary field must be converted: `Math.round(floatValue * 100)`. This prevents floating-point precision errors.

**Password Hashes**
Hi.Events uses Laravel's bcrypt hashing. Auth.js supports bcrypt verification, so password hashes can be migrated directly — users won't need to reset passwords.

**ID Mapping**
All Hi.Events integer IDs must be mapped to new PNWTickets IDs. The migration script maintains a mapping table (`old_id → new_id`) for each entity type to correctly re-link foreign keys.

**Stripe Payment References**
Stripe PaymentIntent IDs and Charge IDs are preserved in the `payments` table so that refunds on old orders still work through Stripe. The `providerPaymentId` field stores the original Stripe reference.

**Soft-Deleted Records**
Decision point: past events and completed orders should be migrated (for historical reporting). Soft-deleted draft events, cancelled-and-abandoned orders, and test data should be excluded.

**Images / S3 Assets**
- Copy all event images from the Hi.Events S3 bucket to the PNWTickets S3 bucket
- Update all URL references in the migrated data
- Verify all images are accessible after migration

### Migration Script Structure

```
scripts/
├── migrate/
│   ├── index.ts                  # Main migration orchestrator
│   ├── extract/
│   │   ├── database.ts           # Direct DB extraction (Path A)
│   │   └── api.ts                # API extraction fallback (Path B)
│   ├── transform/
│   │   ├── users.ts              # User + account transformation
│   │   ├── events.ts             # Event + settings transformation
│   │   ├── tickets.ts            # Product → ticket type mapping
│   │   ├── orders.ts             # Order + items + monetary conversion
│   │   ├── attendees.ts          # Attendee + ticket issuance
│   │   ├── payments.ts           # Stripe payment mapping
│   │   ├── promos.ts             # Promo code mapping
│   │   └── images.ts             # S3 copy + URL rewrite
│   ├── load/
│   │   └── insert.ts             # Bulk insert into PNWTickets DB
│   ├── verify/
│   │   └── integrity.ts          # Post-migration verification
│   └── id-map.ts                 # Old ID → New ID tracking
```

### Migration Execution Plan

1. **Pre-migration backup** — Full backup of Hi.Events database
2. **Dry run** — Run migration against a staging PNWTickets database, verify data integrity
3. **Verification checks:**
   - Total event count matches
   - Total order count matches (excluding filtered soft-deletes)
   - Total revenue matches (sum of order totals)
   - All Stripe payment IDs preserved
   - All images accessible at new URLs
   - Sample spot-check: 10 random orders verified field-by-field
4. **Go-live migration** — Run against production PNWTickets database
5. **Parallel operation** — Run both systems for 1-2 weeks, new events on PNWTickets only
6. **Cutover** — Redirect PNWTickets.com to new platform, decommission Hi.Events

### What Gets Migrated

| Data | Migrated? | Notes |
|------|-----------|-------|
| Users + passwords | Yes | Bcrypt hashes transfer directly |
| All events (past + upcoming) | Yes | Full history preserved |
| All completed orders | Yes | With monetary conversion to cents |
| All attendees | Yes | Linked to new tickets |
| Stripe payment references | Yes | Refunds on old orders still work |
| Check-in records | Yes | Historical check-in data preserved |
| Promo codes (active) | Yes | With new ticket type ID mapping |
| Event images | Yes | Copied to new S3 bucket |
| Tax/fee configurations | Yes | Mapped to new fee structure |
| Custom question answers | Backup | Stored as JSON for future import |
| Webhook configs | No | New system, different architecture |
| Email templates/messages | No | New email system (Resend) |
| Soft-deleted test data | No | Excluded from migration |

### Customer Profile Seeding

During migration, we also seed the `customer_profiles` table:
- Aggregate all orders by email across migrated data
- Calculate initial `totalSpend`, `eventCount`, `lastEventAt`, `firstSeenAt`
- Assign initial CLV tiers based on historical spend
- This gives the analytics and email marketing systems a head start with real data

### Subscriber List Seeding

Attendees who opted into marketing (`marketing_opt_in_at` is not null in Hi.Events) are imported as subscribers in the new email marketing system, preserving their opt-in consent.

---

## Post-MVP Roadmap

These features are designed for in the data model but not built in MVP:

- **React Native + Expo mobile app** (same tRPC API)
- **Push notifications** (notification_preferences table ready)
- **SMS marketing** (Twilio integration)
- **Payment plans / installments** (Afterpay/Klarna)
- **A/B testing** for event pages
- **Social login** (Google, Facebook OAuth)
- **"Who's Going"** social proof (opt-in attendee list)
- **Webhook system** for external automation (Zapier/Make)
- **API keys** for third-party integrations
- **Staff scheduling** tied to events

- **Multi-currency** support
- **White-label** capability
- **Offline check-in** (mobile app feature)
- **Full POS system** for door + bar + merch

---

## Verification Plan

### Auth & Security
1. Register → auto-create org → set up 2FA → logout → login with 2FA → dashboard
2. Verify audit log records the registration, login, and 2FA setup

### Venues & Seat Maps
3. Create venue → configure seat map (sections, rows, seats) → mark ADA seats
4. Verify seat map renders correctly on public event page

### Events
5. Create draft event → attach venue + seat map → add cover image → publish
6. Verify public page SEO (meta tags, OG image)
7. Create recurring template → generate 4 weekly instances → verify calendar display
8. Create dinner_theater event → add menu items → verify menu appears at checkout

### Tickets & Dynamic Pricing
9. Create ticket type with 3 price tiers (early bird, regular, last-minute)
10. Verify tier auto-transitions on date threshold
11. Verify tier transitions on quantity sold threshold

### Checkout
12. Select tickets + seats → checkout → verify tax + service fee + seat pricing
13. Apply promo code → verify discount calculation
14. Add upsell items → verify total
15. Dinner checkout: select meals → see auto-gratuity → add additional gratuity → verify total
16. Apply gift card → verify payment reduction
17. Pay with Stripe test card → confirm → verify wallet pass + PDF generated
18. Verify scarcity indicator shows correct remaining count
19. Test embeddable widget on external page

### Wallet & Tickets
20. Verify Apple Wallet pass downloads and displays correctly
21. Verify Google Wallet pass works
22. Verify PDF ticket contains correct QR code, seat, and event info
23. Verify .ics calendar attachment in confirmation email

### Capacity & Waitlist
24. Buy all tickets → verify sold out state
25. Join waitlist → process refund on existing order → verify waitlist offer email sent
26. Complete waitlist purchase → verify conversion tracked
27. Let waitlist offer expire → verify next person gets offered

### Orders & Refunds
28. Process full refund → verify Stripe refund + capacity released + waitlist triggered
29. Process partial refund → verify correct amounts
30. Verify abandoned cart email sent 1 hour after incomplete checkout

### Comps & Guest List
31. Allocate 5 comps to promoter → verify capacity held
32. Issue comp tickets → verify no payment required
33. Add guest list entries → check in by name search at door

### Check-in & Day-of-Show
34. Scan QR on mobile → success → scan again → duplicate detected
35. Verify age verification flag appears for 21+ events
36. Guest list check-in → verify plus-count tracked
37. Create runsheet → assign staff → mark items complete
38. Log incident → verify timestamped and attributed

### Promoter Portal & No-Login Report Links
39. Login as promoter → verify only net revenue visible
40. Verify tax, fees, gratuity, upsells are NOT shown
41. Generate no-login report link for artist → open in incognito → verify event stats load without login
42. Verify report link shows: ticket count, net revenue, sales timeline, deal terms, comp usage
43. Verify report link does NOT show: tax, fees, gratuity, other artists' deals, other events
44. Set link to expire in 24h → wait → verify link returns expired message
45. Revoke a link → verify it returns 404
46. Generate PIN-protected link → verify PIN prompt appears → enter PIN → verify report loads
47. Generate two links for same artist (one for artist, one for manager) → verify both work independently
48. Send link via email → verify branded email delivered with report URL
49. Verify view count increments and last-viewed timestamp updates when artist checks the link
50. For guarantee vs % deal: verify report shows live calculation of both options + which is currently winning

### Settlements
51. Flat fee deal: assign artist $2,000 flat → verify settlement shows $2,000 regardless of sales
52. Door split deal: assign 70/30 artist/venue → $10,000 gross → verify artist gets $7,000, venue gets $3,000
53. Door split with threshold: first $500 to venue, then 70/30 → $10,000 gross → verify venue gets $500 + 30% of $9,500
54. Guarantee vs %: $1,500 guarantee OR 60% of gross → test with $2,000 gross (guarantee wins) AND $5,000 gross (percentage wins)
55. Flat + %: $1,000 + 50% above $3,000 → $5,000 gross → verify $1,000 + $1,000 = $2,000
56. Multiple artists on same event with different deals → verify all percentages sum correctly
57. Export settlement PDF → verify calculation breakdown shown step-by-step
58. Verify 1099 tracking for artist over $600
59. Promoter portal: verify artist sees their own deal terms but not other artists' deals

### Analytics
60. After purchases → verify dashboard stats, sales charts, capacity gauges
61. Verify group-level cross-venue analytics
62. Verify CLV calculation and tier assignment
63. Verify "fans also attended" recommendations appear
64. Verify revenue forecast based on sales velocity

### Upsells & Cross-Venue Promotions
65. Add merch upsell to event → verify appears in checkout carousel
66. Add drink package upsell → purchase at checkout → verify on order detail
67. Create "Date Night Bundle" (tickets + McFiler's dinner) → verify bundle price + components
68. Configure cross-venue discount: "20% off at McFiler's after the show"
69. Purchase theater ticket → verify cross-venue discount code auto-generated + emailed
70. Redeem cross-venue code at McFiler's checkout → verify discount applied + tracked
71. Verify post-purchase upsell email sent (add-on reminder, 1 week before event)
72. Configure dynamic seat upgrade → verify upgrade email sent 48h before with correct discounted price
73. Click one-click upgrade link in email → verify seat changed + price difference charged
74. Verify post-event cross-venue email sent 2h after show ("20% off at The Hub this week")
75. Verify cross-venue code expires after configured window
76. Verify "buyers also added" shows correct co-purchase recommendations
77. Verify upsell analytics: attach rate, revenue by type, cross-venue attribution
78. Create upsell scoped to VIP ticket type only → verify it only shows for VIP buyers
79. Verify merch margin tracking (revenue minus cost)
80. End-to-end Scenario: Buy theater tickets → add McFiler's dinner bundle → attend show → receive Hub discount email → redeem at Hub → verify full attribution chain

### Table & Bottle Service
81. Create bottle service packages for event (Silver, Gold, Platinum) → verify on event page
82. Purchase Gold Table → select 2 bottles from bottle menu → verify order includes table + bottles
83. Verify table shown as reserved on seat map after purchase
84. Assign server to table → verify server sees their tables on dashboard
85. Minimum-spend table: verify spend tracking against minimum threshold
86. Verify bottle margin reporting (sell price vs. wholesale cost)

### Venue Rental
87. Set up rental packages for Chehalis Theater → verify public availability calendar shows open dates
88. Submit rental inquiry from public page → verify organizer receives notification
89. Create quote with line items (venue + sound system + McFiler's catering) → send to renter
90. Renter accepts quote → pays 50% deposit via Stripe → verify booking confirmed + date blocked
91. Verify balance-due reminder email sent 14 days before event
92. Renter pays balance → verify status moves to fully paid
93. Post-event: release damage deposit → verify Stripe hold released
94. Create cross-venue rental bundle (Theater + McFiler's catering) → verify bundled pricing
95. Set blackout dates → verify they don't show as available on public calendar
96. Cancel rental → verify refund processed per cancellation policy + date unblocked

### Referrals & Gift Cards
97. Create referral link → share → purchase through link → verify conversion tracked
98. Purchase gift card → verify email delivery → redeem at checkout → verify balance
99. Verify gift card works across venues in group

### Surveys
100. Event ends → verify survey email sent 24h later
101. Submit survey → verify NPS calculated → verify results appear in dashboard

### Email Marketing
102. Import subscribers → create segment → build campaign → send test → send to segment
103. Verify campaign analytics (opens, clicks)
104. Verify automated flows trigger (abandoned cart, post-event, win-back)
105. Verify unsubscribe center works

### Data Migration (Hi.Events → PNWTickets)
106. Run migration dry run → verify event count matches source
107. Verify order count and total revenue match (float→cents conversion accurate)
108. Verify Stripe payment IDs preserved → test refund on a migrated order
109. Verify user can login with old password (bcrypt hash migrated)
110. Verify all event images accessible at new S3 URLs
111. Spot-check 10 random orders: line items, attendees, amounts all correct
112. Verify customer profiles seeded with correct CLV from historical data
113. Verify marketing opt-in subscribers imported to new subscriber list
114. Verify past events visible in dashboard with correct historical data
115. Verify check-in records preserved for past events

### General
116. Mobile responsiveness on all critical flows
117. Verify audit log captures all admin actions with correct diffs
118. Verify 2FA required for owner/admin roles
