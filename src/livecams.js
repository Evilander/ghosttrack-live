// Live Cams — world cameras rendered as map markers with embedded video player

const LIVE_CAMS = [
  // ═══════════════════════════════════════════════════
  // URBAN / STREET
  // ═══════════════════════════════════════════════════
  {
    id: 'kensington-philly',
    name: 'Kensington Avenue',
    location: 'Philadelphia, PA',
    category: 'urban',
    coords: [-75.1327, 39.9968],
    embed: 'https://www.youtube.com/embed/live_stream?channel=UCvUKbnCPoSgHtOiPkSLyJOg&autoplay=1&mute=1',
    fallback: 'https://worldcams.tv/united-states/philadelphia/kensington-avenue',
  },
  {
    id: 'kensington-philly-2',
    name: 'Kensington & Allegheny',
    location: 'Philadelphia, PA',
    category: 'urban',
    coords: [-75.1321, 39.9945],
    embed: 'https://www.youtube.com/embed/NEE-lS4NgjE?autoplay=1&mute=1',
    fallback: 'https://worldcams.tv/united-states/philadelphia/kensington-avenue',
  },
  {
    id: 'times-square',
    name: 'Times Square',
    location: 'New York, NY',
    category: 'urban',
    coords: [-73.9855, 40.7580],
    embed: 'https://www.youtube.com/embed/live_stream?channel=UC8oPEsQe9a0v6TqvlKnkdlQ&autoplay=1&mute=1',
    fallback: 'https://www.earthcam.com/usa/newyork/timessquare/',
  },
  {
    id: 'times-square-2',
    name: 'Times Square Crossroads',
    location: 'New York, NY',
    category: 'urban',
    coords: [-73.9860, 40.7575],
    embed: 'https://www.youtube.com/embed/live_stream?channel=UC1Rp_0bp86QEUt9TlMN5tlQ&autoplay=1&mute=1',
    fallback: null,
  },
  {
    id: 'shibuya-crossing',
    name: 'Shibuya Crossing',
    location: 'Tokyo, Japan',
    category: 'urban',
    coords: [139.7005, 35.6595],
    embed: 'https://www.youtube.com/embed/live_stream?channel=UCgdHxnHSXvcAi4PaMIY1Ltg&autoplay=1&mute=1',
    fallback: null,
  },
  {
    id: 'shinjuku-kabukicho',
    name: 'Shinjuku Kabukicho',
    location: 'Tokyo, Japan',
    category: 'urban',
    coords: [139.7032, 35.6938],
    embed: 'https://www.youtube.com/embed/live_stream?channel=UCCLnJzwda_Kcdkok3et7n0A&autoplay=1&mute=1',
    fallback: 'https://worldcams.tv/japan/tokyo/kabukicho',
  },
  {
    id: 'shinjuku-station',
    name: 'Shinjuku JR Yamanote Line',
    location: 'Tokyo, Japan',
    category: 'urban',
    coords: [139.7003, 35.6898],
    embed: 'https://www.youtube.com/embed/live_stream?channel=UC1kDVgEX2DsE295Bkum_K9Q&autoplay=1&mute=1',
    fallback: 'https://worldcams.tv/japan/tokyo/jr-yamanote-line-shinjuku',
  },
  {
    id: 'abbey-road',
    name: 'Abbey Road Crossing',
    location: 'London, UK',
    category: 'urban',
    coords: [-0.1780, 51.5320],
    embed: 'https://www.youtube.com/embed/live_stream?channel=UCYKxnJIBz0ghKNRXVSayBFQ&autoplay=1&mute=1',
    fallback: null,
  },
  {
    id: 'london-skyline',
    name: 'London Skyline',
    location: 'London, UK',
    category: 'urban',
    coords: [-0.0876, 51.5074],
    embed: 'https://www.youtube.com/embed/live_stream?channel=UCYBug3X2e44dhTsoi0Q3Nng&autoplay=1&mute=1',
    fallback: 'https://worldcams.tv/united-kingdom/london/city-views',
  },
  {
    id: 'skid-row-la',
    name: 'Skid Row',
    location: 'Los Angeles, CA',
    category: 'urban',
    coords: [-118.2437, 34.0440],
    embed: 'https://www.youtube.com/embed/NsmJg4oSDVg?autoplay=1&mute=1',
    fallback: 'https://worldcams.tv/united-states/los-angeles/skid-row',
  },
  {
    id: 'amsterdam-dam-square',
    name: 'Dam Square',
    location: 'Amsterdam, Netherlands',
    category: 'urban',
    coords: [4.8936, 52.3731],
    embed: 'https://www.youtube.com/embed/live_stream?channel=UCmP2ra7DF80Yb1cy0HW3gxg&autoplay=1&mute=1',
    fallback: 'https://worldcams.tv/netherlands/amsterdam/dam-square',
  },
  {
    id: 'las-vegas-strip',
    name: 'Las Vegas Strip',
    location: 'Las Vegas, NV',
    category: 'urban',
    coords: [-115.1728, 36.1147],
    embed: 'https://www.youtube.com/embed/live_stream?channel=UC1Rp_0bp86QEUt9TlMN5tlQ&autoplay=1&mute=1',
    fallback: 'https://worldcams.tv/united-states/las-vegas/strip',
  },
  {
    id: 'hong-kong-skyline',
    name: 'Victoria Harbour',
    location: 'Hong Kong, China',
    category: 'urban',
    coords: [114.1694, 22.3193],
    embed: 'https://www.youtube.com/embed/jttO_OKVWsU?autoplay=1&mute=1',
    fallback: 'https://worldcams.tv/china/hong-kong/city-views',
  },
  {
    id: 'bangkok-sukhumvit',
    name: 'Sukhumvit Road',
    location: 'Bangkok, Thailand',
    category: 'urban',
    coords: [100.5583, 13.7384],
    embed: 'https://www.youtube.com/embed/UemFRPrl1hk?autoplay=1&mute=1',
    fallback: 'https://worldcams.tv/thailand/bangkok/sukhumvit',
  },
  {
    id: 'seoul-gangnam',
    name: 'Seoul City Views',
    location: 'Seoul, South Korea',
    category: 'urban',
    coords: [127.0246, 37.4979],
    embed: 'https://www.youtube.com/embed/live_stream?channel=UCQKQTgZJo3PlxA-9V1Z51XA&autoplay=1&mute=1',
    fallback: 'https://worldcams.tv/south-korea/seoul/city-views',
  },
  {
    id: 'dublin-temple-bar',
    name: 'Temple Bar',
    location: 'Dublin, Ireland',
    category: 'urban',
    coords: [-6.2624, 53.3454],
    embed: 'https://www.youtube.com/embed/3nyPER2kzqk?autoplay=1&mute=1',
    fallback: 'https://worldcams.tv/ireland/dublin/temple-bar',
  },
  {
    id: 'bourbon-street-nola',
    name: "Cat's Meow Bourbon St",
    location: 'New Orleans, LA',
    category: 'urban',
    coords: [-90.0686, 29.9574],
    embed: 'https://www.youtube.com/embed/Ksrleaxxxhw?autoplay=1&mute=1',
    fallback: 'https://worldcams.tv/united-states/new-orleans/cats-meow-bar',
  },
  {
    id: 'jackson-hole-square',
    name: 'Town Square',
    location: 'Jackson Hole, WY',
    category: 'urban',
    coords: [-110.7624, 43.4799],
    embed: 'https://www.youtube.com/embed/1EiC9bvVGnk?autoplay=1&mute=1',
    fallback: 'https://worldcams.tv/united-states/jackson-hole/town-square',
  },
  {
    id: 'kyoto-station',
    name: 'Kyoto Station Terminal',
    location: 'Kyoto, Japan',
    category: 'urban',
    coords: [135.7587, 34.9858],
    embed: 'https://www.youtube.com/embed/v9rQqa_VTEY?autoplay=1&mute=1',
    fallback: 'https://worldcams.tv/japan/kyoto/station-terminal',
  },
  {
    id: 'copacabana-beach',
    name: 'Copacabana Beach',
    location: 'Rio de Janeiro, Brazil',
    category: 'urban',
    coords: [-43.1789, -22.9711],
    embed: 'https://www.youtube.com/embed/gX73YiJp-RU?autoplay=1&mute=1',
    fallback: 'https://worldcams.tv/brazil/rio-de-janeiro/copacabana',
  },
  {
    id: 'brooklyn-bridge',
    name: 'Brooklyn Bridge',
    location: 'New York, NY',
    category: 'urban',
    coords: [-73.9969, 40.7061],
    embed: 'https://www.youtube.com/embed/la90mA4VLa4?autoplay=1&mute=1',
    fallback: 'https://worldcams.tv/united-states/new-york/brooklyn-bridge',
  },
  {
    id: 'taiwan-traffic',
    name: 'Taiwan Traffic Cams',
    location: 'Taipei, Taiwan',
    category: 'urban',
    coords: [121.5654, 25.0330],
    embed: 'https://www.youtube.com/embed/live_stream?channel=UCk-EAKT8Q5O2tm_TlhTmgOw&autoplay=1&mute=1',
    fallback: 'https://worldcams.tv/china/taiwan/traffic',
  },

  // ═══════════════════════════════════════════════════
  // CONFLICT / WAR ZONES
  // ═══════════════════════════════════════════════════
  {
    id: 'kyiv-maidan',
    name: 'Maidan Nezalezhnosti',
    location: 'Kyiv, Ukraine',
    category: 'conflict',
    coords: [30.5234, 50.4501],
    embed: 'https://www.youtube.com/embed/live_stream?channel=UCQ2wRKybgCzs3jsmYJeeZ1g&autoplay=1&mute=1',
    fallback: 'https://webcamera24.com/countries/ukraine/',
  },
  {
    id: 'kyiv-euromaidan',
    name: 'European Square',
    location: 'Kyiv, Ukraine',
    category: 'conflict',
    coords: [30.5281, 50.4479],
    embed: 'https://www.youtube.com/embed/live_stream?channel=UCIBaDRgcDgMrhbgCMPHlWxg&autoplay=1&mute=1',
    fallback: null,
  },
  {
    id: 'odesa-port',
    name: 'Odesa Port',
    location: 'Odesa, Ukraine',
    category: 'conflict',
    coords: [30.7326, 46.4825],
    embed: 'https://www.youtube.com/embed/live_stream?channel=UC_1OaXMUOSIhh0sB_bKLPBQ&autoplay=1&mute=1',
    fallback: null,
  },
  {
    id: 'kyiv-skyline',
    name: 'Kyiv Skyline',
    location: 'Kyiv, Ukraine',
    category: 'conflict',
    coords: [30.5238, 50.4547],
    embed: 'https://www.skylinewebcams.com/en/webcam/ukraine/kyiv-city-council/kyiv/ukraine-conflict.html',
    fallback: 'https://webcamera24.com/countries/ukraine/',
  },
  {
    id: 'tel-aviv-skyline',
    name: 'Tel Aviv Skyline',
    location: 'Tel Aviv, Israel',
    category: 'conflict',
    coords: [34.7818, 32.0853],
    embed: 'https://www.skylinewebcams.com/en/webcam/israel/tel-aviv/tel-aviv/tel-aviv.html',
    fallback: 'https://www.webcamtaxi.com/en/israel/tel-aviv.html',
  },
  {
    id: 'jerusalem-panorama',
    name: 'Jerusalem Panorama',
    location: 'Jerusalem, Israel',
    category: 'conflict',
    coords: [35.2304, 31.7857],
    embed: 'https://www.youtube.com/embed/fTaKsyMuP_M?autoplay=1&mute=1',
    fallback: 'https://worldcams.tv/israel/jerusalem/panoramic-view',
  },
  {
    id: 'jerusalem-wall',
    name: 'Western Wall',
    location: 'Jerusalem, Israel',
    category: 'religious',
    coords: [35.2342, 31.7767],
    embed: 'https://www.youtube.com/embed/live_stream?channel=UCvcdHbNAQvbe2GuIDLhlwaw&autoplay=1&mute=1',
    fallback: 'https://worldcams.tv/israel/jerusalem/western-wall',
  },

  // ═══════════════════════════════════════════════════
  // LANDMARKS
  // ═══════════════════════════════════════════════════
  {
    id: 'pyramids-giza',
    name: 'Pyramids of Giza',
    location: 'Cairo, Egypt',
    category: 'landmark',
    coords: [31.1342, 29.9792],
    embed: 'https://embed.skylinewebcams.com/player/8c7e7d6b-5a4c-4ef5-8b43-16bb36529c98?autoplay=1&mute=1',
    fallback: 'https://www.skylinewebcams.com/en/webcam/egypt/cairo/cairo/great-pyramid-of-giza.html',
  },
  {
    id: 'pyramids-sphinx',
    name: 'Pyramids & Sphinx',
    location: 'Cairo, Egypt',
    category: 'landmark',
    coords: [31.1376, 29.9753],
    embed: 'https://www.skylinewebcams.com/en/webcam/egypt/cairo/cairo/pyramids-giza-sphinx.html',
    fallback: null,
  },
  {
    id: 'venice-grand-canal',
    name: 'Grand Canal',
    location: 'Venice, Italy',
    category: 'landmark',
    coords: [12.3345, 45.4408],
    embed: 'https://embed.skylinewebcams.com/player/5c3f2d6c-7d43-49c5-8f38-2b37fcf61abd?autoplay=1&mute=1',
    fallback: null,
  },
  {
    id: 'venice-rolling',
    name: 'Venice Rolling Cam',
    location: 'Venice, Italy',
    category: 'landmark',
    coords: [12.3388, 45.4340],
    embed: 'https://www.youtube.com/embed/live_stream?channel=UCMpn1qLudF-zb4M4bqxLIbw&autoplay=1&mute=1',
    fallback: 'https://worldcams.tv/italy/venice/rolling-cam',
  },
  {
    id: 'eiffel-tower',
    name: 'Eiffel Tower',
    location: 'Paris, France',
    category: 'landmark',
    coords: [2.2945, 48.8584],
    embed: 'https://www.youtube.com/embed/OzYp4NRZlwQ?autoplay=1&mute=1',
    fallback: 'https://www.skylinewebcams.com/en/webcam/france/ile-de-france/paris/tour-eiffel.html',
  },
  {
    id: 'colosseum-rome',
    name: 'Colosseum',
    location: 'Rome, Italy',
    category: 'landmark',
    coords: [12.4924, 41.8902],
    embed: 'https://www.skylinewebcams.com/en/webcam/italia/lazio/roma/roma-colosseo.html',
    fallback: null,
  },
  {
    id: 'us-capitol',
    name: 'United States Capitol',
    location: 'Washington, DC',
    category: 'landmark',
    coords: [-77.0090, 38.8899],
    embed: 'https://www.youtube.com/embed/1wV9lLe14aU?autoplay=1&mute=1',
    fallback: 'https://worldcams.tv/united-states/washington/united-states-capitol',
  },
  {
    id: 'christ-redeemer-rio',
    name: 'Christ the Redeemer',
    location: 'Rio de Janeiro, Brazil',
    category: 'landmark',
    coords: [-43.2105, -22.9519],
    embed: 'https://www.youtube.com/embed/vuK024hR8k8?autoplay=1&mute=1',
    fallback: 'https://worldcams.tv/brazil/rio-de-janeiro/christ-the-redeemer',
  },
  {
    id: 'golden-gate-bridge',
    name: 'Golden Gate Bridge',
    location: 'San Francisco, CA',
    category: 'landmark',
    coords: [-122.4783, 37.8199],
    embed: 'https://www.youtube.com/embed/BSWhGNXxT9A?autoplay=1&mute=1',
    fallback: 'https://worldcams.tv/united-states/san-francisco/bay',
  },
  {
    id: 'big-ben-london',
    name: 'Big Ben & Westminster',
    location: 'London, UK',
    category: 'landmark',
    coords: [-0.1246, 51.5007],
    embed: 'https://www.skylinewebcams.com/en/webcam/united-kingdom/england/london/big-ben.html',
    fallback: 'https://www.visitlondon.com/things-to-do/sightseeing/london-attraction/webcams-of-london',
  },
  {
    id: 'sagrada-familia',
    name: 'Sagrada Familia',
    location: 'Barcelona, Spain',
    category: 'landmark',
    coords: [2.1744, 41.4036],
    embed: 'https://www.skylinewebcams.com/en/webcam/espana/cataluna/barcelona/sagrada-familia.html',
    fallback: 'https://www.sagradafamilia.tv/',
  },
  {
    id: 'dubai-burj-khalifa',
    name: 'Burj Khalifa & Dubai',
    location: 'Dubai, UAE',
    category: 'landmark',
    coords: [55.2744, 25.1972],
    embed: 'https://www.skylinewebcams.com/en/webcam/united-arab-emirates/dubai/dubai/dubai.html',
    fallback: 'https://www.webcamtaxi.com/en/united-arab-emirates/dubai/burj-khalifa-lake-dubai.html',
  },
  {
    id: 'brandenburg-gate',
    name: 'Brandenburg Gate',
    location: 'Berlin, Germany',
    category: 'landmark',
    coords: [13.3777, 52.5163],
    embed: 'https://www.skylinewebcams.com/en/webcam/deutschland/hauptstadtregion-berlin-brandenburg/berlin/brandenburg-gate.html',
    fallback: 'https://www.earthtv.com/en/webcam/berlin-brandenburger-tor',
  },
  {
    id: 'machu-picchu',
    name: 'Machu Picchu',
    location: 'Cusco, Peru',
    category: 'landmark',
    coords: [-72.5450, -13.1631],
    embed: 'https://www.skylinewebcams.com/en/webcam/peru/cusco/urubamba/machu-picchu-aguas-calientes.html',
    fallback: null,
  },

  // ═══════════════════════════════════════════════════
  // SPACE
  // ═══════════════════════════════════════════════════
  {
    id: 'iss-earth',
    name: 'ISS Earth View',
    location: 'Low Earth Orbit',
    category: 'space',
    coords: [-95.3698, 29.7604],
    embed: 'https://www.youtube.com/embed/vytmBNhc9ig?autoplay=1&mute=1',
    fallback: 'https://worldcams.tv/space/international-space-station',
  },
  {
    id: 'iss-nasa-live',
    name: 'NASA TV Live',
    location: 'Low Earth Orbit',
    category: 'space',
    coords: [-95.3500, 29.7500],
    embed: 'https://www.youtube.com/embed/86YLFOog4GM?autoplay=1&mute=1',
    fallback: 'https://www.nasa.gov/live/',
  },
  {
    id: 'spacex-starbase',
    name: 'SpaceX Starbase',
    location: 'Boca Chica, TX',
    category: 'space',
    coords: [-97.1547, 25.9970],
    embed: 'https://www.youtube.com/embed/live_stream?channel=UCFwMITSkc1Fms6PoJoh1OUQ&autoplay=1&mute=1',
    fallback: 'https://worldcams.tv/united-states/boca-chica/spacex-launch-facility',
  },

  // ═══════════════════════════════════════════════════
  // AIRPORTS
  // ═══════════════════════════════════════════════════
  {
    id: 'lax-runway',
    name: 'LAX Runways 24L/24R',
    location: 'Los Angeles, CA',
    category: 'airport',
    coords: [-118.4085, 33.9416],
    embed: 'https://www.youtube.com/embed/12KqO5IBLeY?autoplay=1&mute=1',
    fallback: 'https://worldcams.tv/united-states/los-angeles/airport',
  },
  {
    id: 'sfo-airport',
    name: 'SFO Airport',
    location: 'San Francisco, CA',
    category: 'airport',
    coords: [-122.3790, 37.6213],
    embed: 'https://www.youtube.com/embed/live_stream?channel=UCNxmgfWTi3e_SRVZ3PCx2BQ&autoplay=1&mute=1',
    fallback: null,
  },
  {
    id: 'haneda-airport',
    name: 'Haneda Airport',
    location: 'Tokyo, Japan',
    category: 'airport',
    coords: [139.7798, 35.5494],
    embed: 'https://www.youtube.com/embed/A0FCKcTuRHo?autoplay=1&mute=1',
    fallback: 'https://worldcams.tv/japan/tokyo/haneda-airport',
  },
  {
    id: 'princess-juliana',
    name: 'Princess Juliana Airport',
    location: 'Sint Maarten',
    category: 'airport',
    coords: [-63.1089, 18.0410],
    embed: 'https://www.youtube.com/embed/2IQmpCXbOmM?autoplay=1&mute=1',
    fallback: 'https://worldcams.tv/sint-maarten/princess-juliana-airport',
  },
  {
    id: 'st-barth-airport',
    name: 'St. Barth Airport',
    location: 'Saint Barthelemy',
    category: 'airport',
    coords: [-62.8443, 17.9023],
    embed: 'https://www.skylinewebcams.com/en/webcam/caraibi/saint-barthelemy/saint-barthelemy/saint-jean-airport.html',
    fallback: 'https://worldcams.tv/saint-barthelemy/saint-jean/st-barth-airport',
  },
  {
    id: 'chicago-midway',
    name: 'Chicago Midway Airport',
    location: 'Chicago, IL',
    category: 'airport',
    coords: [-87.7524, 41.7868],
    embed: 'https://www.youtube.com/embed/live_stream?channel=UCnNqAk9WmDG_Dw7cPPyemWg&autoplay=1&mute=1',
    fallback: 'https://worldcams.tv/united-states/chicago/midway-airport',
  },

  // ═══════════════════════════════════════════════════
  // NATURE
  // ═══════════════════════════════════════════════════
  {
    id: 'northern-lights',
    name: 'Northern Lights',
    location: 'Churchill, Manitoba',
    category: 'nature',
    coords: [-94.1756, 58.7684],
    embed: 'https://www.youtube.com/embed/live_stream?channel=UCB2bVpJqOCP94DqR9x6cslA&autoplay=1&mute=1',
    fallback: null,
  },
  {
    id: 'niagara-falls',
    name: 'Niagara Falls',
    location: 'Ontario, Canada',
    category: 'nature',
    coords: [-79.0849, 43.0896],
    embed: 'https://www.youtube.com/embed/3KhQK5KG7VU?autoplay=1&mute=1',
    fallback: 'https://worldcams.tv/canada/niagara-falls',
  },
  {
    id: 'etna-volcano',
    name: 'Mount Etna Volcano',
    location: 'Sicily, Italy',
    category: 'nature',
    coords: [14.9934, 37.7510],
    embed: 'https://www.youtube.com/embed/EGk3Mr0OshE?autoplay=1&mute=1',
    fallback: 'https://worldcams.tv/italy/catania/etna-volcano',
  },
  {
    id: 'popocatepetl-volcano',
    name: 'Popocatepetl Volcano',
    location: 'Puebla, Mexico',
    category: 'nature',
    coords: [-98.6228, 19.0225],
    embed: 'https://www.youtube.com/embed/fhsFI8nTCV8?autoplay=1&mute=1',
    fallback: 'https://worldcams.tv/mexico/puebla/popocatepetl-volcano',
  },
  {
    id: 'iceland-volcano-aurora',
    name: 'Iceland Volcano & Aurora',
    location: 'Grindavik, Iceland',
    category: 'nature',
    coords: [-22.4328, 63.8547],
    embed: 'https://www.youtube.com/embed/4B-xBkUX4jM?autoplay=1&mute=1',
    fallback: 'https://afar.tv/streams/iceland/',
  },
  {
    id: 'mayon-volcano',
    name: 'Mayon Volcano 4K',
    location: 'Albay, Philippines',
    category: 'nature',
    coords: [123.6852, 13.2575],
    embed: 'https://www.youtube.com/embed/UDAZWxehMAI?autoplay=1&mute=1',
    fallback: 'https://afar.tv/',
  },
  {
    id: 'fuego-volcano',
    name: 'Fuego Volcano',
    location: 'Sacatepequez, Guatemala',
    category: 'nature',
    coords: [-90.8809, 14.4734],
    embed: 'https://www.youtube.com/embed/UdZxw7rKqrw?autoplay=1&mute=1',
    fallback: 'https://afar.tv/',
  },
  {
    id: 'merapi-volcano',
    name: 'Merapi Volcano',
    location: 'Java, Indonesia',
    category: 'nature',
    coords: [110.4457, -7.5407],
    embed: 'https://www.youtube.com/embed/ZO4l5BksP_0?autoplay=1&mute=1',
    fallback: 'https://afar.tv/',
  },
  {
    id: 'semeru-bromo',
    name: 'Bromo Tengger Semeru',
    location: 'East Java, Indonesia',
    category: 'nature',
    coords: [112.9500, -8.0700],
    embed: 'https://www.youtube.com/embed/4vmPmQYKzcQ?autoplay=1&mute=1',
    fallback: 'https://afar.tv/',
  },
  {
    id: 'africa-safari-waterhole',
    name: 'African Safari Waterhole',
    location: 'Mpumalanga, South Africa',
    category: 'nature',
    coords: [31.4849, -24.9916],
    embed: 'https://www.youtube.com/embed/live_stream?channel=UC2P9wURjFXsOSzFbR0hnYag&autoplay=1&mute=1',
    fallback: 'https://worldcams.tv/rsa/south-africa-wild',
  },
  {
    id: 'brooks-falls-bears',
    name: 'Brooks Falls Bear Cam',
    location: 'Katmai, Alaska',
    category: 'nature',
    coords: [-155.7822, 58.7544],
    embed: 'https://www.youtube.com/embed/live_stream?channel=UC-2KSeUU5SMCX6XLRD-AEvw&autoplay=1&mute=1',
    fallback: 'https://explore.org/livecams/brown-bears/brown-bear-salmon-cam-brooks-falls',
  },
  {
    id: 'panda-cam-chengdu',
    name: 'Giant Pandas',
    location: 'Chengdu, China',
    category: 'nature',
    coords: [104.1467, 30.7400],
    embed: 'https://www.youtube.com/embed/live_stream?channel=UCtEgLf0_j1vJLz0aNEdO2SQ&autoplay=1&mute=1',
    fallback: 'https://worldcams.tv/china/chengdu/giant-pandas',
  },
  {
    id: 'bc-rainforest',
    name: 'BC Rainforest',
    location: 'British Columbia, Canada',
    category: 'nature',
    coords: [-123.3656, 48.4284],
    embed: 'https://www.youtube.com/embed/F2KrH4QQnms?autoplay=1&mute=1',
    fallback: 'https://afar.tv/',
  },
  {
    id: 'maui-humpback-whales',
    name: 'Maui Humpback Whales',
    location: 'Maui, Hawaii',
    category: 'nature',
    coords: [-156.4600, 20.8000],
    embed: 'https://www.youtube.com/embed/Ge3mUVk8qjY?autoplay=1&mute=1',
    fallback: 'https://afar.tv/streams/maui/',
  },
  {
    id: 'waimea-bay-surf',
    name: 'Waimea Bay',
    location: 'Oahu, Hawaii',
    category: 'nature',
    coords: [-158.0659, 21.6424],
    embed: 'https://www.youtube.com/embed/TxqCfNa7R6E?autoplay=1&mute=1',
    fallback: 'https://afar.tv/',
  },
  {
    id: 'rhine-falls',
    name: 'Rhine Falls',
    location: 'Schaffhausen, Switzerland',
    category: 'nature',
    coords: [8.6155, 47.6779],
    embed: 'https://www.skylinewebcams.com/en/webcam/schweiz/schaffhausen/neuhausen-am-rheinfall/rheinfall.html',
    fallback: 'https://worldcams.tv/switzerland/schaffhausen/rhine-falls',
  },
  {
    id: 'santa-maria-volcano',
    name: 'Santa Maria Volcano',
    location: 'Quetzaltenango, Guatemala',
    category: 'nature',
    coords: [-91.5530, 14.7569],
    embed: 'https://www.youtube.com/embed/Y-lO5NFg8Ww?autoplay=1&mute=1',
    fallback: 'https://afar.tv/',
  },

  // ═══════════════════════════════════════════════════
  // RELIGIOUS / CULTURAL
  // ═══════════════════════════════════════════════════
  {
    id: 'mecca-kaaba',
    name: 'Masjid al-Haram',
    location: 'Mecca, Saudi Arabia',
    category: 'religious',
    coords: [39.8262, 21.4225],
    embed: 'https://www.youtube.com/embed/live_stream?channel=UCos52azQNBgW63_9uDJoPDA&autoplay=1&mute=1',
    fallback: 'https://worldcams.tv/saudi-arabia/mecca/great-mosque',
  },
  {
    id: 'mecca-kaaba-2',
    name: 'Makkah Live TV',
    location: 'Mecca, Saudi Arabia',
    category: 'religious',
    coords: [39.8268, 21.4220],
    embed: 'https://www.youtube.com/embed/live_stream?channel=UCnVkS0JKShb2BoNqP08MPCw&autoplay=1&mute=1',
    fallback: 'https://www.makkah.live/',
  },
  {
    id: 'vatican-st-peters',
    name: "St. Peter's Square",
    location: 'Vatican City',
    category: 'religious',
    coords: [12.4534, 41.9022],
    embed: 'https://www.youtube.com/embed/live_stream?channel=UC7E-LYc1wivk33iyt5bR5zQ&autoplay=1&mute=1',
    fallback: 'https://worldcams.tv/vatican/vatican/st-peters-square',
  },
  {
    id: 'fatima-sanctuary',
    name: 'Sanctuary of Fatima',
    location: 'Fatima, Portugal',
    category: 'religious',
    coords: [-8.6726, 39.6308],
    embed: 'https://www.youtube.com/embed/Ymu8JZMWqD0?autoplay=1&mute=1',
    fallback: 'https://worldcams.tv/portugal/fatima/santuario-of-fatima',
  },
  {
    id: 'lourdes-sanctuary',
    name: 'Our Lady of Lourdes',
    location: 'Lourdes, France',
    category: 'religious',
    coords: [-0.0482, 43.0962],
    embed: 'https://www.skylinewebcams.com/en/webcam/france/midi-pyrenees/lourdes/lourdes.html',
    fallback: 'https://worldcams.tv/france/lourdes/sanctuary-our-lady-of-lourdes',
  },

  // ═══════════════════════════════════════════════════
  // BORDER CROSSINGS
  // ═══════════════════════════════════════════════════
  {
    id: 'us-mexico-zaragoza',
    name: 'US-Mexico Border',
    location: 'Zaragoza, Mexico',
    category: 'border',
    coords: [-106.3793, 31.6576],
    embed: 'https://www.skylinewebcams.com/en/webcam/mexico/chihuahua/zaragoza/border.html',
    fallback: 'https://www.borderreport.com/live-cameras/',
  },

  // ═══════════════════════════════════════════════════
  // CRIME / POVERTY / REAL STREETS
  // ═══════════════════════════════════════════════════
  {
    id: 'sf-tenderloin',
    name: 'Tenderloin - Market St',
    location: 'San Francisco, CA',
    category: 'urban',
    coords: [-122.4142, 37.7825],
    embed: 'https://www.youtube.com/embed/live_stream?channel=UCoFUleuZUyRUVDjO4JcCSTQ&autoplay=1&mute=1',
    fallback: 'https://www.webcamtaxi.com/en/usa/california/sanfrancisco-tenderloin-cam.html',
  },
  {
    id: 'vancouver-harbour',
    name: 'Vancouver Harbour',
    location: 'Vancouver, Canada',
    category: 'urban',
    coords: [-123.1139, 49.2888],
    embed: 'https://www.youtube.com/embed/live_stream?channel=UCiV79ONTbmAbfgFMmLAqbQg&autoplay=1&mute=1',
    fallback: 'https://vancouver-webcams.com/',
  },
  {
    id: 'detroit-river',
    name: 'Detroit RiverCam',
    location: 'Detroit, MI',
    category: 'urban',
    coords: [-82.9735, 42.3484],
    embed: 'https://www.youtube.com/embed/live_stream?channel=UCc81wtBaU_xhHKwGBcUpxSA&autoplay=1&mute=1',
    fallback: 'https://www.detroithistorical.org/visit/dossin-great-lakes-museum/detroit-river-watch-webcam',
  },
  {
    id: 'baltimore-harbour',
    name: 'Baltimore Inner Harbor',
    location: 'Baltimore, MD',
    category: 'urban',
    coords: [-76.6122, 39.2854],
    embed: 'https://www.skylinewebcams.com/en/webcam/united-states/maryland/baltimora/port.html',
    fallback: 'https://www.earthcam.com/usa/maryland/baltimore/',
  },
  {
    id: 'birmingham-uk',
    name: 'Birmingham City Centre',
    location: 'Birmingham, UK',
    category: 'urban',
    coords: [-1.8998, 52.4796],
    embed: 'https://www.skylinewebcams.com/en/webcam/united-kingdom/england/birmingham.html',
    fallback: 'https://worldcams.tv/united-kingdom/birmingham/black-sabbath-bench',
  },
  {
    id: 'johannesburg-rand',
    name: 'Rand Airport',
    location: 'Johannesburg, South Africa',
    category: 'urban',
    coords: [28.1510, -26.2425],
    embed: 'https://www.youtube.com/embed/live_stream?channel=UCQbx0LTxxPSxMJHfZk9GJRA&autoplay=1&mute=1',
    fallback: 'https://henleyair.tv/',
  },
  {
    id: 'sao-paulo-airport',
    name: 'GRU Airport',
    location: 'São Paulo, Brazil',
    category: 'urban',
    coords: [-46.4734, -23.4356],
    embed: 'https://www.youtube.com/embed/iXaLq43GXyM?autoplay=1&mute=1',
    fallback: 'https://worldcams.tv/brazil/sao-paulo/airport',
  },
  {
    id: 'sao-paulo-paulista',
    name: 'Paulista Avenue',
    location: 'São Paulo, Brazil',
    category: 'urban',
    coords: [-46.6546, -23.5632],
    embed: 'https://www.skylinewebcams.com/en/webcam/brasil/sao-paulo/sao-paulo/sao-paulo.html',
    fallback: 'https://worldcams.tv/brazil/sao-paulo/',
  },
  {
    id: 'naples-vesuvius',
    name: 'Naples & Vesuvius',
    location: 'Naples, Italy',
    category: 'urban',
    coords: [14.2681, 40.8518],
    embed: 'https://www.skylinewebcams.com/en/webcam/italia/campania/napoli/napoli-vesuvio.html',
    fallback: 'https://camstreamer.com/live/stream/68653782',
  },
  {
    id: 'marseille-vieux-port',
    name: 'Vieux Port',
    location: 'Marseille, France',
    category: 'urban',
    coords: [5.3698, 43.2965],
    embed: 'https://www.skylinewebcams.com/webcam/france/provence-alpes-cote-dazur/marseille/marseille.html',
    fallback: 'https://www.earthtv.com/en/webcam/marseille-great-seaport',
  },

  // ═══════════════════════════════════════════════════
  // WAR / CONFLICT ZONES (expanded)
  // ═══════════════════════════════════════════════════
  {
    id: 'kharkiv-city',
    name: 'Kharkiv City View',
    location: 'Kharkiv, Ukraine',
    category: 'conflict',
    coords: [36.2304, 49.9935],
    embed: 'https://www.youtube.com/embed/H7ZbVufqW3s?autoplay=1&mute=1',
    fallback: 'https://webcamera24.com/countries/ukraine/kharkov/',
  },
  {
    id: 'kharkiv-pisochyn',
    name: 'Kharkiv - Pisochyn',
    location: 'Kharkiv Oblast, Ukraine',
    category: 'conflict',
    coords: [36.1834, 49.9128],
    embed: 'https://www.youtube.com/embed/jtOKYCxP6iY?autoplay=1&mute=1',
    fallback: null,
  },
  {
    id: 'lviv-city',
    name: 'Lviv City View',
    location: 'Lviv, Ukraine',
    category: 'conflict',
    coords: [24.0297, 49.8397],
    embed: 'https://www.youtube.com/embed/m9r5rpGq9mU?autoplay=1&mute=1',
    fallback: 'https://webcamera24.com/countries/ukraine/',
  },
  {
    id: 'zaporizhzhia-city',
    name: 'Zaporizhzhia City',
    location: 'Zaporizhzhia, Ukraine',
    category: 'conflict',
    coords: [35.1396, 47.8388],
    embed: 'https://www.youtube.com/embed/fkshRv7l_WE?autoplay=1&mute=1',
    fallback: 'https://webcamera24.com/countries/ukraine/',
  },
  {
    id: 'zaporizhzhia-park',
    name: 'Zaporizhzhia Oak Grove Park',
    location: 'Zaporizhzhia, Ukraine',
    category: 'conflict',
    coords: [35.1448, 47.8425],
    embed: 'https://www.youtube.com/embed/jrDGHQ5-fTc?autoplay=1&mute=1',
    fallback: null,
  },
  {
    id: 'mykolaiv-centre',
    name: 'Mykolaiv City Center',
    location: 'Mykolaiv, Ukraine',
    category: 'conflict',
    coords: [31.9946, 46.9750],
    embed: 'https://www.youtube.com/embed/pTcdr5grL2o?autoplay=1&mute=1',
    fallback: 'https://webcamera24.com/countries/ukraine/',
  },
  {
    id: 'mykolaiv-cathedral',
    name: 'Mykolaiv Cathedral Square',
    location: 'Mykolaiv, Ukraine',
    category: 'conflict',
    coords: [31.9974, 46.9738],
    embed: 'https://www.youtube.com/embed/oOCOOKN18lw?autoplay=1&mute=1',
    fallback: null,
  },
  {
    id: 'mykolaiv-chornovil',
    name: 'Mykolaiv Chornovil Square',
    location: 'Mykolaiv, Ukraine',
    category: 'conflict',
    coords: [32.0001, 46.9683],
    embed: 'https://www.youtube.com/embed/tCIWTxiQNO0?autoplay=1&mute=1',
    fallback: null,
  },
  {
    id: 'kyiv-sophia',
    name: 'Sophia Square',
    location: 'Kyiv, Ukraine',
    category: 'conflict',
    coords: [30.5127, 50.4530],
    embed: 'https://www.youtube.com/embed/NZK0ChTLb4I?autoplay=1&mute=1',
    fallback: 'https://zvamy.org/live-webcams-ukraine/',
  },
  {
    id: 'kyiv-maidan-dw',
    name: 'Maidan Nezalezhnosti (DW)',
    location: 'Kyiv, Ukraine',
    category: 'conflict',
    coords: [30.5241, 50.4504],
    embed: 'https://www.youtube.com/embed/-Q7FuPINDjA?autoplay=1&mute=1',
    fallback: 'https://zvamy.org/live-webcams-ukraine/',
  },
  {
    id: 'dnipro-city',
    name: 'Dnipro City',
    location: 'Dnipro, Ukraine',
    category: 'conflict',
    coords: [35.0462, 48.4647],
    embed: 'https://www.skylinewebcams.com/en/webcam/ukraine.html',
    fallback: 'https://webcamera24.com/countries/ukraine/',
  },
  {
    id: 'odesa-deribasovskaya',
    name: 'Deribasovskaya Street',
    location: 'Odesa, Ukraine',
    category: 'conflict',
    coords: [30.7400, 46.4850],
    embed: 'https://www.youtube.com/embed/live_stream?channel=UCvLCdNi-fitoRvWeHrzJp_A&autoplay=1&mute=1',
    fallback: 'https://zvamy.org/live-webcams-ukraine/',
  },
  {
    id: 'severodonetsk',
    name: 'Severodonetsk',
    location: 'Luhansk Oblast, Ukraine',
    category: 'conflict',
    coords: [38.4913, 48.9484],
    embed: 'https://www.youtube.com/embed/kzQdh7Sd7ZM?autoplay=1&mute=1',
    fallback: null,
  },
  {
    id: 'kamianets-podilskyi',
    name: 'Kamianets-Podilskyi',
    location: 'Khmelnytskyi, Ukraine',
    category: 'conflict',
    coords: [26.5672, 48.6827],
    embed: 'https://www.youtube.com/embed/7hq9Gy9pBhk?autoplay=1&mute=1',
    fallback: null,
  },
  {
    id: 'beirut-skyline',
    name: 'Beirut Skyline',
    location: 'Beirut, Lebanon',
    category: 'conflict',
    coords: [35.5018, 33.8938],
    embed: 'https://www.youtube.com/embed/ON4JiEjXUyw?autoplay=1&mute=1',
    fallback: 'https://www.skylinewebcams.com/en/webcam/lebanon/beirut/beirut/beirut.html',
  },

  // ═══════════════════════════════════════════════════
  // POLITICAL / GOVERNMENT
  // ═══════════════════════════════════════════════════
  {
    id: 'white-house',
    name: 'The White House',
    location: 'Washington, DC',
    category: 'political',
    coords: [-77.0365, 38.8977],
    embed: 'https://www.youtube.com/embed/live_stream?channel=UCRuyAVeVd7oUwh0LWmxxBBQ&autoplay=1&mute=1',
    fallback: 'https://www.earthtv.com/en/webcam/washington-white-house',
  },
  {
    id: 'moscow-taganskaya',
    name: 'Moscow Taganskaya Square',
    location: 'Moscow, Russia',
    category: 'political',
    coords: [37.6527, 55.7394],
    embed: 'https://www.youtube.com/embed/live_stream?channel=UCuguVwsWh3-y-C29fO1krXg&autoplay=1&mute=1',
    fallback: 'https://worldcams.tv/russia/moscow/city-views',
  },
  {
    id: 'hong-kong-tsimshatsui',
    name: 'Tsim Sha Tsui',
    location: 'Hong Kong, China',
    category: 'political',
    coords: [114.1722, 22.2988],
    embed: 'https://www.youtube.com/embed/jmwM1hA3JE0?autoplay=1&mute=1',
    fallback: 'https://worldcams.tv/china/hong-kong/city-views',
  },
  {
    id: 'hong-kong-peak',
    name: 'Victoria Peak',
    location: 'Hong Kong, China',
    category: 'political',
    coords: [114.1495, 22.2759],
    embed: 'https://www.youtube.com/embed/8hPXD8gXk4M?autoplay=1&mute=1',
    fallback: 'https://worldcams.tv/china/hong-kong/city-views',
  },
  {
    id: 'taipei-traffic',
    name: 'Taipei Traffic',
    location: 'Taipei, Taiwan',
    category: 'political',
    coords: [121.5654, 25.0330],
    embed: 'https://www.youtube.com/embed/pmM2CeSAx0I?autoplay=1&mute=1',
    fallback: 'https://worldcams.tv/china/taiwan/traffic',
  },
  {
    id: 'caracas-avila',
    name: 'Caracas - Avila Mountain',
    location: 'Caracas, Venezuela',
    category: 'political',
    coords: [-66.9036, 10.4806],
    embed: 'https://www.skylinewebcams.com/en/webcam/venezuela.html',
    fallback: 'https://www.worldcamera.net/en/webcams/south-america/venezuela/208-caracas-city-camera',
  },

  // ═══════════════════════════════════════════════════
  // TRAFFIC / CHAOS
  // ═══════════════════════════════════════════════════
  {
    id: 'hcmc-traffic',
    name: 'Ho Chi Minh City Streets',
    location: 'Ho Chi Minh City, Vietnam',
    category: 'traffic',
    coords: [106.6297, 10.8231],
    embed: 'https://www.skylinewebcams.com/en/webcam/vietnam/southeast/ho-chi-minh/streets.html',
    fallback: 'https://trafficvision.live/blog/ho-chi-minh-city-traffic-cameras',
  },
  {
    id: 'jakarta-thamrin',
    name: 'Jakarta Thamrin District',
    location: 'Jakarta, Indonesia',
    category: 'traffic',
    coords: [106.8219, -6.1945],
    embed: 'https://www.skylinewebcams.com/en/webcam/indonesia/jakarta/jakarta/streets.html',
    fallback: 'https://www.earthtv.com/en/webcam/jakarta-thamrin-district',
  },
  {
    id: 'cairo-pyramids-traffic',
    name: 'Cairo / Giza',
    location: 'Cairo, Egypt',
    category: 'traffic',
    coords: [31.2357, 30.0444],
    embed: 'https://www.skylinewebcams.com/en/webcam/egypt/cairo/cairo/great-pyramid-of-giza.html',
    fallback: 'https://www.webcamtaxi.com/en/egypt/greater-cairo/pyramids-giza.html',
  },
];

const CATEGORY_COLORS = {
  urban: '#00CED1',
  conflict: '#ff4444',
  landmark: '#FFD700',
  space: '#c8a0ff',
  airport: '#00ff88',
  nature: '#7CFC00',
  religious: '#FF69B4',
  border: '#FF8C00',
  political: '#E040FB',
  traffic: '#FF6F00',
};

const CATEGORY_LABELS = {
  urban: 'URBAN',
  conflict: 'CONFLICT ZONE',
  landmark: 'LANDMARK',
  space: 'SPACE',
  airport: 'AIRPORT',
  nature: 'NATURE',
  religious: 'RELIGIOUS',
  border: 'BORDER',
  political: 'POLITICAL',
  traffic: 'TRAFFIC',
};

function toGeoJSON() {
  return {
    type: 'FeatureCollection',
    features: LIVE_CAMS.map(cam => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: cam.coords },
      properties: {
        id: cam.id,
        name: cam.name,
        location: cam.location,
        category: cam.category,
        color: CATEGORY_COLORS[cam.category] || '#00CED1',
        embed: cam.embed,
        fallback: cam.fallback || '',
      },
    })),
  };
}

function createCamIcon(color, size = 24) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);

  // Camera body
  const bx = size * 0.15, by = size * 0.3;
  const bw = size * 0.55, bh = size * 0.4;
  ctx.fillStyle = color;
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, 2);
  ctx.fill();
  ctx.stroke();

  // Lens triangle
  ctx.beginPath();
  ctx.moveTo(bx + bw, by + bh * 0.2);
  ctx.lineTo(size * 0.9, by);
  ctx.lineTo(size * 0.9, by + bh);
  ctx.lineTo(bx + bw, by + bh * 0.8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Record dot
  ctx.beginPath();
  ctx.arc(bx + 5, by + 5, 2, 0, Math.PI * 2);
  ctx.fillStyle = '#ff0000';
  ctx.fill();

  const imageData = ctx.getImageData(0, 0, size, size);
  return { width: size, height: size, data: new Uint8Array(imageData.data.buffer) };
}

let playerEl = null;
let activeCamera = null;

function getDirectUrl(cam) {
  const embed = cam.embed || '';
  // YouTube embed → direct watch URL
  if (embed.includes('youtube.com/embed/live_stream')) {
    const ch = embed.match(/channel=([^&]+)/);
    if (ch) return `https://www.youtube.com/channel/${ch[1]}/live`;
  }
  if (embed.includes('youtube.com/embed/')) {
    const vid = embed.match(/embed\/([^?]+)/);
    if (vid) return `https://www.youtube.com/watch?v=${vid[1]}`;
  }
  return cam.fallback || embed;
}

function openCamPlayer(cam) {
  if (!playerEl) {
    playerEl = document.getElementById('cam-player');
  }
  if (!playerEl) return;

  activeCamera = cam;

  const titleEl = playerEl.querySelector('.cam-player-title');
  const locationEl = playerEl.querySelector('.cam-player-location');
  const categoryEl = playerEl.querySelector('.cam-player-category');
  const iframeEl = playerEl.querySelector('.cam-player-iframe');
  const fallbackEl = playerEl.querySelector('.cam-player-fallback');
  const directEl = playerEl.querySelector('.cam-player-direct');

  if (titleEl) titleEl.textContent = cam.name;
  if (locationEl) locationEl.textContent = cam.location;
  if (categoryEl) {
    categoryEl.textContent = CATEGORY_LABELS[cam.category] || cam.category.toUpperCase();
    categoryEl.style.color = CATEGORY_COLORS[cam.category] || '#00CED1';
    categoryEl.style.borderColor = CATEGORY_COLORS[cam.category] || '#00CED1';
  }

  if (iframeEl) {
    iframeEl.src = cam.embed;
  }

  // Direct link — always visible for blocked embeds
  const directUrl = getDirectUrl(cam);
  if (directEl) {
    directEl.href = directUrl;
    directEl.style.display = '';
  }

  if (fallbackEl) {
    if (cam.fallback && cam.fallback !== directUrl) {
      fallbackEl.href = cam.fallback;
      fallbackEl.style.display = '';
    } else {
      fallbackEl.style.display = 'none';
    }
  }

  playerEl.classList.remove('hidden');
}

function closeCamPlayer() {
  if (!playerEl) return;
  const iframeEl = playerEl.querySelector('.cam-player-iframe');
  if (iframeEl) iframeEl.src = 'about:blank';
  playerEl.classList.add('hidden');
  activeCamera = null;
}

export function initLiveCams(map) {
  // Canvas-rendered camera icons per category
  for (const [cat, color] of Object.entries(CATEGORY_COLORS)) {
    map.addImage(`cam-${cat}`, createCamIcon(color));
  }

  map.addSource('livecams', {
    type: 'geojson',
    data: toGeoJSON(),
  });

  // Pulsing outer glow
  map.addLayer({
    id: 'livecams-glow',
    type: 'circle',
    source: 'livecams',
    paint: {
      'circle-radius': 8,
      'circle-color': ['get', 'color'],
      'circle-opacity': 0.15,
      'circle-blur': 1,
    },
  }, 'tcas-lines');

  // Icon markers
  map.addLayer({
    id: 'livecams-icons',
    type: 'symbol',
    source: 'livecams',
    layout: {
      'icon-image': ['concat', 'cam-', ['get', 'category']],
      'icon-size': ['interpolate', ['linear'], ['zoom'], 2, 0.5, 6, 0.8, 10, 1.0],
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'text-field': ['step', ['zoom'], '', 5, ['get', 'name']],
      'text-size': 9,
      'text-offset': [0, 1.4],
      'text-anchor': 'top',
      'text-font': ['Noto Sans Regular'],
      'text-optional': true,
    },
    paint: {
      'text-color': ['get', 'color'],
      'text-opacity': 0.6,
      'text-halo-color': 'rgba(10, 14, 23, 0.9)',
      'text-halo-width': 1.5,
    },
  }, 'tcas-lines');

  // Click handler
  function handleCamClick(e) {
    if (!e.features || !e.features.length) return;
    const props = e.features[0].properties;
    const cam = LIVE_CAMS.find(c => c.id === props.id);
    if (cam) {
      openCamPlayer(cam);
      map.flyTo({ center: cam.coords, zoom: Math.max(map.getZoom(), 8), duration: 1500 });
    }
  }
  map.on('click', 'livecams-icons', handleCamClick);
  map.on('click', 'livecams-glow', handleCamClick);

  map.on('mouseenter', 'livecams-icons', () => {
    map.getCanvas().style.cursor = 'pointer';
  });
  map.on('mouseleave', 'livecams-icons', () => {
    map.getCanvas().style.cursor = '';
  });

  // Close button
  const closeBtn = document.getElementById('cam-player-close');
  if (closeBtn) closeBtn.addEventListener('click', closeCamPlayer);

  // Cam list navigation
  const listEl = document.getElementById('cam-player-list');
  if (listEl) {
    for (const cam of LIVE_CAMS) {
      const btn = document.createElement('button');
      btn.className = 'cam-list-btn';
      btn.dataset.camId = cam.id;
      btn.innerHTML = `<span class="cam-list-dot" style="background:${CATEGORY_COLORS[cam.category]}"></span>${cam.name}`;
      btn.addEventListener('click', () => {
        openCamPlayer(cam);
        map.flyTo({ center: cam.coords, zoom: Math.max(map.getZoom(), 8), duration: 1500 });
      });
      listEl.appendChild(btn);
    }
  }
}

export function toggleLiveCams(map, visible) {
  const vis = visible ? 'visible' : 'none';
  if (map.getLayer('livecams-glow')) map.setLayoutProperty('livecams-glow', 'visibility', vis);
  if (map.getLayer('livecams-icons')) map.setLayoutProperty('livecams-icons', 'visibility', vis);
  if (!visible) closeCamPlayer();
}

