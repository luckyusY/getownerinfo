// Real-estate photos (Unsplash CDN, verified) for the location card backgrounds.
const U = (id) => `https://images.unsplash.com/photo-${id}?w=720&q=70&auto=format&fit=crop`;

export const POPULAR_LOCATIONS = [
  { name: "Kacyiru", district: "Gasabo", eyebrow: "Diplomatic calm", tagline: "Homes near offices, embassies, and Kigali business corridors.", photo: U("1564013799919-ab600027ffc6"), href: "/listings?location=Kacyiru" },
  { name: "Nyarutarama", district: "Gasabo", eyebrow: "Luxury living", tagline: "Premium villas, quiet streets, golf views, and executive rentals.", photo: U("1568605114967-8130f3a36994"), href: "/listings?location=Nyarutarama" },
  { name: "Kibagabaga", district: "Gasabo", eyebrow: "Family homes", tagline: "Spacious houses, modern apartments, and fast access to Gasabo.", photo: U("1570129477492-45c003edd2be"), href: "/listings?location=Kibagabaga" },
  { name: "Gacuriro", district: "Gasabo", eyebrow: "Modern estates", tagline: "Gated comfort, new developments, and polished family living.", photo: U("1512917774080-9991f1c4c750"), href: "/listings?location=Gacuriro" },
  { name: "Kimihurura", district: "Gasabo", eyebrow: "Central energy", tagline: "Restaurants, offices, apartments, and walkable city convenience.", photo: U("1493809842364-78817add7ffb"), href: "/listings?location=Kimihurura" },
  { name: "Rebero", district: "Kicukiro", eyebrow: "Hilltop views", tagline: "Elegant homes with skyline views and peaceful residential roads.", photo: U("1600596542815-ffad4c1539a9"), href: "/listings?location=Rebero" },
];

export const RWANDA_LOCATIONS = [
  "Kigali",
  "Kacyiru",
  "Nyarutarama",
  "Kibagabaga",
  "Gacuriro",
  "Kimihurura",
  "Kiyovu",
  "Remera",
  "Rebero",
  "Kimironko",
  "Kicukiro",
  "Kagarama",
  "Kanombe",
  "Musanze",
  "Kinigi",
];
