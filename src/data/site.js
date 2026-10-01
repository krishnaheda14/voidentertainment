/* ==========================================================================
   VOID ENTERTAINMENT — SITE CONTENT
   --------------------------------------------------------------------------
   Day-to-day edits (weekly schedule, WhatsApp number, brand info) go in
   `./content.json`, not this file — see the note below. Venues, past nights,
   stats and how-it-works still live here, further down.

   >>> STEP 1: PUT YOUR REAL WHATSAPP NUMBER IN `brand.whatsapp` IN content.json. <<<
       Format: country code + number, digits only, no +, no spaces.
       Example for +91 98765 43210  ->  '919876543210'
   ========================================================================== */

/* --------------------------------------------------------------------------
   `brand`, `weekLabel` and `week` now live in `./content.json`, not here.
   That is the file the admin panel (the lock icon in the nav) edits and
   commits straight to GitHub — see src/lib/admin.js and api/save-content.js.
   To change them by hand, just edit content.json the same way you always
   edited this file; nothing else about the shape has changed.
   -------------------------------------------------------------------------- */
import content from './content.json'

export const brand = content.brand
export const weekLabel = content.weekLabel
export const week = content.week

/* --------------------------------------------------------------------------
   VENUES
   Coordinates and addresses are real. `image` points at /public/media/venues/.
   Drop a JPG at that exact path and it appears automatically. If the file is
   missing, the card falls back to a generated gradient — nothing breaks.
   -------------------------------------------------------------------------- */
export const venues = [
  {
    slug: 'mercii',
    name: 'MERCII',
    area: 'Santacruz West',
    pin: '400054',
    coords: [19.0812, 72.8347],
    door: '20:00',
    close: '01:30',
    floor: 'Lower ground',
    capacity: '220',
    sound: 'House · Commercial · Open format',
    dress: 'Smart. No shorts, no slides, no sportswear.',
    address:
      'B1, Lower Ground Floor, Crest Building, Plot 81C, Linking Road, Santacruz West, Mumbai 400054',
    maps: 'https://www.google.com/maps/search/?api=1&query=MERCII+Mumbai&query_place_id=ChIJRYf96DvJ5zsR0lMIKkVyCK8',
    blurb:
      'The dressed-up room on Linking Road. Dinner runs early, then the lights drop around eleven and the whole floor turns. Tightest door in Santacruz — which is exactly why you want us on it.',
    best: 'Friday',
    tags: ['Dinner into party', 'Tight door', 'Big-spend crowd'],
    image: '/media/venues/mercii.jpg',
  },
  {
    slug: 'baglami',
    name: 'BAĞLAMI',
    area: 'BKC · Bandra East',
    pin: '400098',
    coords: [19.0669, 72.866],
    door: '19:00',
    close: '01:30',
    floor: 'INS Tower, G Block',
    capacity: '400',
    sound: 'Bollywood · Turkish · Open format',
    dress: 'Party smart. Collars help after midnight.',
    address:
      'INS Tower, G Block, BKC 7, opposite NMACC, Bandra Kurla Complex, Bandra East, Mumbai 400098',
    maps: 'https://www.google.com/maps/search/?api=1&query=Baglami+Mumbai+BKC&query_place_id=ChIJgynv30zJ5zsRQFUvz43Dn-Q',
    blurb:
      'Anatolian room opposite NMACC that runs a strict two-hour dining slot, then flips into the loudest Bollywood floor in BKC. Miss your slot and you lose the table — so let us hold it.',
    best: 'Saturday',
    tags: ['Slot system', 'Bolly floor', 'Corporate crowd'],
    image: '/media/venues/baglami.jpg',
  },
  {
    slug: 'onrique',
    name: 'ONRIQUE',
    area: 'Santacruz West',
    pin: '400054',
    coords: [19.0819, 72.8348],
    door: '19:30',
    close: '01:30',
    floor: 'Rooftop',
    capacity: '180',
    sound: 'Afro house · Melodic · Latin',
    dress: 'Rooftop smart casual. Layer up in winter.',
    address:
      'Rooftop, Krishna Heritage, 12–14 Linking Road, above Landmark Cars, Santacruz West, Mumbai 400054',
    maps: 'https://www.google.com/maps/search/?api=1&query=Onrique+Mumbai&query_place_id=ChIJhbOxfc_J5zsR2WMZGQL67C0',
    blurb:
      'Open sky above Linking Road. Slower burn than the basements — Caribbean and Afro house, actual conversation until midnight, then it lifts. Best sunset seat in Santacruz and there are only nine of them.',
    best: 'Thursday',
    tags: ['Rooftop', 'Sunset seating', 'Afro house'],
    image: '/media/venues/onrique.jpg',
  },
  {
    slug: 'bastian-beach',
    name: 'BASTIAN BEACH CLUB',
    area: 'Juhu',
    pin: '400049',
    coords: [19.1093, 72.8244],
    door: '17:00',
    close: '01:00',
    floor: 'Sun-N-Sand, ground',
    capacity: '600',
    sound: 'Open format · Deep house · Sundowner sets',
    dress: 'Resort. Linen, not lounge-wear.',
    address:
      'Ground Floor, Sun-N-Sand Hotel, off Juhu Road, Juhu, Mumbai 400049',
    maps: 'https://www.google.com/maps/search/?api=1&query=Bastian+Beach+Club+Mumbai&query_place_id=ChIJTSkdptHJ5zsR_lpkPAHGFj0',
    blurb:
      'The big one. Indoor room plus an outdoor pool deck facing the water, Caribbean build, and a cover charge that hurts if you walk up cold. Weekend tables go a week out. This is the one people call us for.',
    best: 'Sunday',
    tags: ['Poolside', 'Sundowner', 'High cover — we cut it'],
    image: '/media/venues/bastian.jpg',
  },
  {
    slug: 'megumi',
    name: 'MEGUMI',
    area: 'Santacruz West',
    pin: '400054',
    coords: [19.0805, 72.8365],
    door: '20:00',
    close: '01:30',
    floor: 'Ground + mezzanine',
    capacity: '160',
    sound: 'Japanese lounge · Deep house · Late-night DJ sets',
    dress: 'Elevated smart. Dress sharp after nine.',
    address: 'Ground Floor, Turner Road, Santacruz West, Mumbai 400054',
    maps: 'https://www.google.com/maps/search/?api=1&query=Megumi+Santacruz+Mumbai',
    blurb:
      'Omakase counter up front, a DJ booth in the back. The quietest-looking door in Santacruz hides the loudest room past midnight — small floor, serious sound system, and a table map we know cold.',
    best: 'Wednesday',
    tags: ['Omakase to floor', 'Intimate room', 'Late-night DJs'],
    image: '/media/venues/megumi.jpg',
  },
  {
    slug: 'all-saints',
    name: 'ALL SAINTS',
    area: 'Bandra West',
    pin: '400050',
    coords: [19.0596, 72.8295],
    door: '20:00',
    close: '01:30',
    floor: 'First floor',
    capacity: '250',
    sound: 'House · Techno · Underground bookings',
    dress: 'Streetwear smart. No formals, no flip-flops.',
    address: 'First Floor, All Saints Road, Bandra West, Mumbai 400050',
    maps: 'https://www.google.com/maps/search/?api=1&query=All+Saints+Road+Bandra+Mumbai',
    blurb:
      'The Bandra underground room, named for the road it sits on. Real bookings, a proper rig, and a crowd that came for the music first — no bottle-service theatre here.',
    best: 'Saturday',
    tags: ['Underground bookings', 'Real sound system', 'Bandra crowd'],
    image: '/media/venues/all-saints.jpg',
  },
  {
    // Verified: Savoy Chambers address, PIN, hours, founders and concept
    // via India Food Network's launch coverage and Zomato's listing.
    // Coordinates decoded from Mappls' listing for the same building
    // (Takumi, also in Savoy Chambers). `door`, `floor` and `best` are
    // reasonable defaults, not independently confirmed — edit freely from
    // /admin if you have the exact details.
    slug: 'linking-house',
    name: 'LINKING HOUSE',
    area: 'Santacruz West',
    pin: '400054',
    coords: [19.0855, 72.8349],
    door: '19:00',
    close: '01:30',
    floor: 'Ground floor',
    capacity: '250',
    sound: 'All-day lounge · Karaoke nights · Sufi sessions',
    dress: 'Smart casual. Relaxed by day, sharper after dark.',
    address: 'Savoy Chambers, Linking Road Extension, Hasmukh Nagar, Santacruz West, Mumbai 400054',
    maps: 'https://www.google.com/maps/search/?api=1&query=Linking+House+Santacruz+West+Mumbai',
    blurb:
      'An all-day social culinary house on Linking Road — opens with coffee, closes with cocktails. Fire-led dinners and migratory-bird cocktails up front; a back room with a pool table and board games that turns into karaoke and Sufi nights once the kitchen slows down.',
    best: 'Thursday',
    tags: ['All-day café to bar', 'Fire-led kitchen', 'Karaoke & Sufi nights'],
    image: '/media/venues/linking-house.jpg',
  },
]

/* --------------------------------------------------------------------------
   PAST NIGHTS — video + photo wall. Lives in ./content.json now too, same
   as brand/weekLabel/week — the admin panel's "What it looks like" editor
   and photo/video uploader both write here. For each item you can supply
   EITHER:
     youtube: 'VIDEO_ID'        (from https://youtube.com/watch?v=VIDEO_ID)
     OR video: '/media/videos/your-file.mp4'
   `poster` is the still frame. Missing files fall back to a gradient tile.
   -------------------------------------------------------------------------- */
export const pastNights = content.pastNights

export const stats = [
  { value: '10+', label: 'Venues', note: 'All over Mumbai' },
  { value: '11k+', label: 'Entries sorted', note: 'Since 2022' },
  { value: '6k+', label: 'Tables booked', note: 'Confirmed on WhatsApp' },
]

export const howItWorks = [
  {
    step: 'Message the desk',
    body: 'One WhatsApp with your date, headcount and which room you want. No forms, no app, no deposit to talk.',
  },
  {
    step: 'We price the door',
    body: 'You get back the real number — guestlist cutoff, stag rate, minimum spend if you want a table. Straight comparison against walking up cold.',
  },
  {
    step: 'Name goes down',
    body: 'Confirmed on WhatsApp with the door time and who to ask for. Turn up, say Void, walk in.',
  },
]
