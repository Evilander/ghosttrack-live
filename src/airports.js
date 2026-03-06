// ============================================================
// airports.js — ~550 major world airports by ICAO code
// Compact lookup: ICAO -> [lat, lon]
// ============================================================

const AIRPORTS = {

  // ========================
  // UNITED STATES (120+)
  // ========================

  // --- Major Hubs ---
  'KATL': [33.6407, -84.4277],   // Atlanta Hartsfield-Jackson
  'KLAX': [33.9425, -118.4081],  // Los Angeles
  'KORD': [41.9742, -87.9073],   // Chicago O'Hare
  'KDFW': [32.8998, -97.0403],   // Dallas/Fort Worth
  'KDEN': [39.8561, -104.6737],  // Denver
  'KJFK': [40.6413, -73.7781],   // New York JFK
  'KSFO': [37.6213, -122.3790],  // San Francisco
  'KLAS': [36.0840, -115.1537],  // Las Vegas
  'KSEA': [47.4502, -122.3088],  // Seattle-Tacoma
  'KMCO': [28.4312, -81.3081],   // Orlando
  'KEWR': [40.6895, -74.1745],   // Newark
  'KLGA': [40.7769, -73.8740],   // New York LaGuardia
  'KMIA': [25.7959, -80.2870],   // Miami
  'KPHL': [39.8744, -75.2424],   // Philadelphia
  'KBOS': [42.3656, -71.0096],   // Boston Logan
  'KMSP': [44.8848, -93.2223],   // Minneapolis-St Paul
  'KFLL': [26.0742, -80.1506],   // Fort Lauderdale
  'KDTW': [42.2124, -83.3534],   // Detroit
  'KIAH': [29.9902, -95.3368],   // Houston Intercontinental
  'KBWI': [39.1754, -76.6684],   // Baltimore-Washington
  'KDCA': [38.8512, -77.0402],   // Washington Reagan
  'KIAD': [38.9531, -77.4565],   // Washington Dulles
  'KSNA': [33.6757, -117.8683],  // Orange County / John Wayne
  'KSLC': [40.7884, -111.9778],  // Salt Lake City
  'KSAN': [32.7336, -117.1897],  // San Diego
  'KTPA': [27.9755, -82.5332],   // Tampa
  'KPDX': [45.5898, -122.5951],  // Portland OR
  'KSTL': [38.7487, -90.3700],   // St Louis
  'KCLT': [35.2140, -80.9431],   // Charlotte
  'KBNA': [36.1263, -86.6774],   // Nashville
  'KAUS': [30.1975, -97.6664],   // Austin
  'KRDU': [35.8776, -78.7875],   // Raleigh-Durham
  'KPIT': [40.4915, -80.2329],   // Pittsburgh
  'KCLE': [41.4117, -81.8498],   // Cleveland
  'KIND': [39.7173, -86.2944],   // Indianapolis
  'KCMH': [39.9980, -82.8919],   // Columbus OH
  'KSMF': [38.6954, -121.5908],  // Sacramento
  'KSJC': [37.3626, -121.9291],  // San Jose
  'KOAK': [37.7213, -122.2208],  // Oakland
  'KMKE': [42.9472, -87.8966],   // Milwaukee
  'KSAT': [29.5337, -98.4698],   // San Antonio
  'KMCI': [39.2976, -94.7139],   // Kansas City
  'KMSY': [29.9934, -90.2580],   // New Orleans
  'KPBI': [26.6832, -80.0956],   // West Palm Beach
  'KHOB': [32.6875, -103.2170],  // Hobbs NM
  'KHOU': [29.6454, -95.2789],   // Houston Hobby
  'KMDW': [41.7868, -87.7522],   // Chicago Midway
  'KONT': [34.0560, -117.6012],  // Ontario CA
  'KBUR': [34.2007, -118.3585],  // Burbank
  'KABQ': [35.0402, -106.6091],  // Albuquerque
  'KANC': [61.1743, -149.9963],  // Anchorage
  'PHNL': [21.3187, -157.9224],  // Honolulu
  'PHOG': [20.8986, -156.4305],  // Maui Kahului
  'PAFA': [64.8151, -147.8561],  // Fairbanks
  'PHKO': [19.7388, -156.0456],  // Kona
  'PHJR': [21.3074, -158.0703],  // Kalaeloa (Barbers Pt)

  // --- Regional US ---
  'KJAN': [32.3112, -90.0759],   // Jackson MS
  'KRIC': [37.5052, -77.3197],   // Richmond VA
  'KBDL': [41.9389, -72.6832],   // Hartford/Bradley
  'KPVD': [41.7246, -71.4282],   // Providence
  'KBUF': [42.9405, -78.7322],   // Buffalo
  'KSYR': [43.1112, -76.1063],   // Syracuse
  'KROC': [43.1189, -77.6724],   // Rochester NY
  'KALB': [42.7483, -73.8017],   // Albany NY
  'KPWM': [43.6462, -70.3093],   // Portland ME
  'KBTV': [44.4720, -73.1533],   // Burlington VT
  'KGSB': [35.3394, -77.9606],   // Seymour Johnson AFB
  'KCHS': [32.8986, -80.0405],   // Charleston SC
  'KSAV': [32.1276, -81.2021],   // Savannah
  'KJAX': [30.4941, -81.6879],   // Jacksonville FL
  'KRSW': [26.5362, -81.7552],   // Fort Myers
  'KTLH': [30.3965, -84.3503],   // Tallahassee
  'KGSO': [36.0978, -79.9373],   // Greensboro NC
  'KMYR': [33.6797, -78.9283],   // Myrtle Beach
  'KLEX': [38.0365, -84.6059],   // Lexington KY
  'KSDF': [38.1744, -85.7360],   // Louisville
  'KBHM': [33.5629, -86.7535],   // Birmingham AL
  'KHSV': [34.6372, -86.7751],   // Huntsville AL
  'KMEM': [35.0424, -89.9767],   // Memphis
  'KLIT': [34.7294, -92.2243],   // Little Rock
  'KTUL': [36.1984, -95.8881],   // Tulsa
  'KOKC': [35.3931, -97.6007],   // Oklahoma City
  'KOMA': [41.3032, -95.8941],   // Omaha
  'KDSM': [41.5340, -93.6631],   // Des Moines
  'KICT': [37.6499, -97.4331],   // Wichita
  'KCOS': [38.8058, -104.7009],  // Colorado Springs
  'KBOI': [43.5644, -116.2228],  // Boise
  'KGEG': [47.6199, -117.5338],  // Spokane
  'KPHX': [33.4373, -112.0078],  // Phoenix
  'KTUS': [32.1161, -110.9410],  // Tucson
  'KELP': [31.8072, -106.3776],  // El Paso
  'KRNO': [39.4991, -119.7681],  // Reno
  'KSJT': [31.3577, -100.4963],  // San Angelo TX
  'KMAF': [31.9425, -102.2019],  // Midland TX
  'KAMA': [35.2194, -101.7059],  // Amarillo
  'KLBB': [33.6636, -101.8228],  // Lubbock
  'KCID': [41.8847, -91.7108],   // Cedar Rapids
  'KFAR': [46.9207, -96.8158],   // Fargo
  'KBIS': [46.7727, -100.7468],  // Bismarck
  'KRAP': [44.0453, -103.0574],  // Rapid City
  'KFSD': [43.5820, -96.7419],   // Sioux Falls
  'KGRR': [42.8808, -85.5228],   // Grand Rapids MI
  'KLAN': [42.7787, -84.5874],   // Lansing MI
  'KDAY': [39.9024, -84.2194],   // Dayton OH
  'KCVG': [39.0488, -84.6678],   // Cincinnati
  'KTYS': [35.8110, -83.9940],   // Knoxville TN
  'KCRW': [38.3731, -81.5932],   // Charleston WV
  'KPSP': [33.8297, -116.5067],  // Palm Springs
  'KFAT': [36.7762, -119.7181],  // Fresno
  'KSBP': [35.2368, -120.6424],  // San Luis Obispo
  'KMFR': [42.3742, -122.8735],  // Medford OR
  'KEUG': [44.1246, -123.2119],  // Eugene OR
  'KBZN': [45.7775, -111.1530],  // Bozeman MT
  'KMSO': [46.9163, -114.0906],  // Missoula MT
  'KGTF': [47.4820, -111.3707],  // Great Falls MT
  'KBIL': [45.8077, -108.5430],  // Billings MT
  'KSUN': [43.5044, -114.2956],  // Sun Valley / Hailey ID
  'KJAC': [43.6073, -110.7377],  // Jackson Hole WY

  // ========================
  // CANADA (25)
  // ========================
  'CYYZ': [43.6777, -79.6248],   // Toronto Pearson
  'CYVR': [49.1947, -123.1792],  // Vancouver
  'CYUL': [45.4706, -73.7408],   // Montreal Trudeau
  'CYYC': [51.1215, -114.0076],  // Calgary
  'CYEG': [53.3097, -113.5797],  // Edmonton
  'CYOW': [45.3225, -75.6692],   // Ottawa
  'CYWG': [49.9100, -97.2399],   // Winnipeg
  'CYHZ': [44.8808, -63.5085],   // Halifax
  'CYQB': [46.7911, -71.3934],   // Quebec City
  'CYXE': [52.1708, -106.6997],  // Saskatoon
  'CYQR': [50.4319, -104.6658],  // Regina
  'CYYJ': [48.6469, -123.4258],  // Victoria
  'CYYT': [47.6186, -52.7519],   // St. John's NL
  'CYQM': [46.1122, -64.6786],   // Moncton
  'CYFC': [45.8689, -66.5372],   // Fredericton
  'CYQI': [43.8269, -66.0881],   // Yarmouth
  'CYHM': [43.1736, -79.9350],   // Hamilton ON
  'CYTZ': [43.6275, -79.3962],   // Toronto Billy Bishop
  'CYLW': [49.9561, -119.3778],  // Kelowna
  'CYXU': [43.0356, -81.1539],   // London ON
  'CYAM': [46.4850, -84.5094],   // Sault Ste Marie
  'CYDF': [49.2108, -57.3914],   // Deer Lake NL
  'CYXY': [60.7096, -135.0677],  // Whitehorse
  'CYZF': [62.4628, -114.4403],  // Yellowknife
  'CYFB': [63.7561, -68.5558],   // Iqaluit

  // ========================
  // MEXICO (15)
  // ========================
  'MMMX': [19.4363, -99.0721],   // Mexico City
  'MMUN': [21.0365, -86.8771],   // Cancun
  'MMGL': [20.5218, -103.3113],  // Guadalajara
  'MMMY': [25.7785, -100.1069],  // Monterrey
  'MMTJ': [32.5411, -116.9700],  // Tijuana
  'MMPR': [20.6801, -105.2543],  // Puerto Vallarta
  'MMCN': [23.1524, -109.7213],  // San Jose del Cabo
  'MMHO': [29.0959, -111.0480],  // Hermosillo
  'MMCU': [28.7029, -105.9645],  // Chihuahua
  'MMMD': [20.9370, -89.6577],   // Merida
  'MMPN': [19.1581, -96.1867],   // Poza Rica
  'MMVR': [19.1459, -96.1873],   // Veracruz
  'MMSD': [23.1514, -109.7215],  // Los Cabos
  'MMTO': [19.3371, -99.5660],   // Toluca
  'MMCZ': [20.5224, -86.9255],   // Cozumel

  // ========================
  // CENTRAL AMERICA & CARIBBEAN (20)
  // ========================
  'TNCM': [18.0410, -63.1089],   // St Maarten Princess Juliana
  'MKJP': [17.9357, -76.7875],   // Kingston Jamaica
  'TBPB': [13.0746, -59.4925],   // Barbados
  'TFFR': [16.2653, -61.5318],   // Guadeloupe
  'TFFF': [14.5910, -61.0032],   // Martinique
  'TTPP': [10.5954, -61.3372],   // Trinidad Piarco
  'MPTO': [9.0714, -79.3835],    // Panama City Tocumen
  'MROC': [9.9939, -84.2088],    // San Jose Costa Rica
  'MGGT': [14.5833, -90.5275],   // Guatemala City
  'MHLM': [15.4526, -87.9236],   // San Pedro Sula Honduras
  'MHTG': [14.0611, -87.2172],   // Tegucigalpa
  'MSLP': [13.4409, -89.0557],   // San Salvador
  'MNMG': [12.1415, -86.1682],   // Managua
  'MDPC': [18.5674, -68.3634],   // Punta Cana
  'MDSD': [18.4297, -69.6689],   // Santo Domingo
  'MUHA': [22.9892, -82.4091],   // Havana
  'MBPV': [21.7361, -72.2659],   // Providenciales (Turks & Caicos)
  'MYNN': [25.0390, -77.4662],   // Nassau Bahamas
  'TAPA': [17.1367, -61.7928],   // Antigua VC Bird
  'TKPK': [17.3112, -62.7187],   // St Kitts

  // ========================
  // SOUTH AMERICA (30)
  // ========================
  'SBGR': [-23.4356, -46.4731],  // Sao Paulo Guarulhos
  'SBGL': [-22.8100, -43.2506],  // Rio de Janeiro Galeao
  'SBBR': [-15.8711, -47.9186],  // Brasilia
  'SBCF': [-19.6244, -43.9719],  // Belo Horizonte Confins
  'SBSP': [-23.6261, -46.6564],  // Sao Paulo Congonhas
  'SBSV': [-12.9086, -38.3225],  // Salvador
  'SBRF': [-8.1264, -34.9236],   // Recife
  'SBPA': [-29.9944, -51.1714],  // Porto Alegre
  'SBCT': [-25.5285, -49.1758],  // Curitiba
  'SBFL': [-27.6703, -48.5525],  // Florianopolis
  'SCEL': [-33.3930, -70.7858],  // Santiago Chile
  'SABE': [-34.5592, -58.4156],  // Buenos Aires Aeroparque
  'SAEZ': [-34.8222, -58.5358],  // Buenos Aires Ezeiza
  'SACO': [-31.3236, -64.2080],  // Cordoba Argentina
  'SAME': [-32.8317, -68.7929],  // Mendoza
  'SKBO': [4.7016, -74.1469],    // Bogota
  'SKMR': [7.9275, -75.5131],    // Monteria Colombia
  'SKCL': [3.5432, -76.3816],    // Cali
  'SKRG': [6.1645, -75.4231],    // Medellin
  'SEQM': [-0.1292, -78.3575],   // Quito
  'SEGU': [-2.1574, -79.8837],   // Guayaquil
  'SPJC': [-12.0219, -77.1143],  // Lima
  'SLLP': [-16.5133, -68.1923],  // La Paz
  'SLVR': [-17.6448, -63.1354],  // Santa Cruz Bolivia
  'SUMU': [-34.8384, -56.0308],  // Montevideo
  'SGAS': [-25.2400, -57.5191],  // Asuncion
  'SVMI': [10.6012, -66.9906],   // Caracas
  'SMJP': [5.4528, -55.1871],    // Paramaribo Suriname
  'SYCJ': [6.4985, -58.2541],    // Georgetown Guyana
  'SOCA': [4.8192, -52.3604],    // Cayenne French Guiana

  // ========================
  // UNITED KINGDOM & IRELAND (20)
  // ========================
  'EGLL': [51.4700, -0.4543],    // London Heathrow
  'EGKK': [51.1537, -0.1821],    // London Gatwick
  'EGSS': [51.8860, 0.2389],     // London Stansted
  'EGLC': [51.5053, 0.0553],     // London City
  'EGCC': [53.3537, -2.2750],    // Manchester
  'EGPH': [55.9500, -3.3725],    // Edinburgh
  'EGPF': [55.8719, -4.4331],    // Glasgow
  'EGBB': [52.4539, -1.7480],    // Birmingham
  'EGGW': [51.8747, -0.3683],    // London Luton
  'EGNX': [52.8311, -1.3281],    // East Midlands
  'EGGD': [51.3827, -2.7191],    // Bristol
  'EGHI': [50.9503, -1.3568],    // Southampton
  'EGNT': [55.0374, -1.6917],    // Newcastle
  'EGNM': [53.8659, -1.6606],    // Leeds Bradford
  'EGGP': [53.3336, -2.8497],    // Liverpool
  'EGAA': [54.6575, -6.2158],    // Belfast International
  'EIDW': [53.4213, -6.2701],    // Dublin
  'EICK': [51.8413, -8.4911],    // Cork
  'EINN': [52.7020, -8.9248],    // Shannon
  'EGPD': [57.2019, -2.1978],    // Aberdeen

  // ========================
  // WESTERN EUROPE (50+)
  // ========================

  // --- France ---
  'LFPG': [49.0097, 2.5479],     // Paris CDG
  'LFPO': [48.7233, 2.3794],     // Paris Orly
  'LFML': [43.4393, 5.2214],     // Marseille
  'LFLL': [45.7256, 5.0811],     // Lyon
  'LFMN': [43.6584, 7.2159],     // Nice
  'LFBD': [44.8283, -0.7156],    // Bordeaux
  'LFRS': [47.1532, -1.6107],    // Nantes
  'LFBO': [43.6291, 1.3638],     // Toulouse
  'LFST': [48.5383, 7.6282],     // Strasbourg

  // --- Germany ---
  'EDDF': [50.0379, 8.5622],     // Frankfurt
  'EDDM': [48.3538, 11.7861],    // Munich
  'EDDB': [52.3667, 13.5033],    // Berlin Brandenburg
  'EDDL': [51.2895, 6.7668],     // Dusseldorf
  'EDDH': [53.6304, 9.9882],     // Hamburg
  'EDDS': [48.6899, 9.2220],     // Stuttgart
  'EDDK': [50.8659, 7.1427],     // Cologne/Bonn
  'EDDP': [51.4324, 12.2416],    // Leipzig
  'EDDW': [53.0475, 8.7867],     // Bremen
  'EDDN': [49.4987, 11.0669],    // Nuremberg

  // --- Netherlands / Belgium / Luxembourg ---
  'EHAM': [52.3086, 4.7639],     // Amsterdam Schiphol
  'EHRD': [51.9569, 4.4372],     // Rotterdam
  'EHEH': [51.4501, 5.3743],     // Eindhoven
  'EBBR': [50.9014, 4.4844],     // Brussels
  'EBCI': [50.4592, 4.4538],     // Charleroi
  'ELLX': [49.6233, 6.2044],     // Luxembourg

  // --- Spain ---
  'LEMD': [40.4936, -3.5668],    // Madrid Barajas
  'LEBL': [41.2971, 2.0785],     // Barcelona
  'LEPA': [39.5517, 2.7388],     // Palma de Mallorca
  'LEMG': [36.6749, -4.4991],    // Malaga
  'LEAL': [38.2822, -0.5582],    // Alicante
  'GCTS': [28.0445, -16.5725],   // Tenerife South
  'GCLP': [27.9319, -15.3866],   // Gran Canaria
  'GCFV': [28.4527, -13.8638],   // Fuerteventura
  'LEZL': [37.4180, -5.8932],    // Seville
  'LEVX': [42.2318, -8.6268],    // Vigo
  'LEVC': [39.4893, -0.4816],    // Valencia

  // --- Portugal ---
  'LPPT': [38.7813, -9.1359],    // Lisbon
  'LPPR': [41.2481, -8.6814],    // Porto
  'LPFR': [37.0144, -7.9659],    // Faro

  // --- Italy ---
  'LIRF': [41.8003, 12.2389],    // Rome Fiumicino
  'LIMC': [45.6306, 8.7231],     // Milan Malpensa
  'LIME': [45.6739, 9.7042],     // Milan Bergamo
  'LIPZ': [45.5053, 12.3519],    // Venice
  'LIRN': [40.8860, 14.2908],    // Naples
  'LICC': [37.4668, 15.0664],    // Catania
  'LICJ': [38.1760, 13.0910],    // Palermo
  'LIPE': [44.5354, 11.2887],    // Bologna
  'LIPX': [45.3957, 10.8885],    // Verona
  'LIRP': [43.6839, 10.3927],    // Pisa

  // --- Switzerland / Austria ---
  'LSZH': [47.4647, 8.5492],     // Zurich
  'LSGG': [46.2381, 6.1089],     // Geneva
  'LOWW': [48.1103, 16.5697],    // Vienna
  'LOWI': [47.2602, 11.3440],    // Innsbruck
  'LOWG': [46.9911, 15.4396],    // Graz
  'LOWS': [47.7933, 13.0043],    // Salzburg

  // ========================
  // NORTHERN EUROPE (20)
  // ========================

  // --- Scandinavia ---
  'EKCH': [55.6180, 12.6560],    // Copenhagen
  'EKBI': [55.7402, 9.1518],     // Billund
  'ENGM': [60.1939, 11.1004],    // Oslo Gardermoen
  'ENBR': [60.2934, 5.2181],     // Bergen
  'ENZV': [58.8767, 5.6378],     // Stavanger
  'ENVA': [63.4578, 10.9240],    // Trondheim
  'ESSA': [59.6519, 17.9186],    // Stockholm Arlanda
  'ESGG': [57.6628, 12.2798],    // Gothenburg
  'ESMS': [55.5303, 13.3762],    // Malmo
  'EFHK': [60.3172, 24.9633],    // Helsinki
  'EFRO': [66.5648, 25.8304],    // Rovaniemi
  'BIRK': [63.9850, -22.6056],   // Reykjavik Keflavik

  // --- Baltic ---
  'EETU': [59.4133, 24.8328],    // Tallinn
  'EVRA': [56.9236, 23.9711],    // Riga
  'EYVI': [54.6341, 25.2858],    // Vilnius

  // ========================
  // EASTERN EUROPE (25)
  // ========================
  'EPWA': [52.1657, 20.9671],    // Warsaw
  'EPKK': [50.0777, 19.7848],    // Krakow
  'LKPR': [50.1008, 14.2600],    // Prague
  'LZIB': [48.1702, 17.2127],    // Bratislava
  'LHBP': [47.4369, 19.2556],    // Budapest
  'LROP': [44.5711, 26.0850],    // Bucharest Otopeni
  'LBSF': [42.6952, 23.4114],    // Sofia
  'LWSK': [41.9616, 21.6214],    // Skopje
  'BKPR': [42.5728, 21.0358],    // Pristina
  'LATI': [41.4147, 19.7206],    // Tirana
  'LDZA': [45.7429, 16.0688],    // Zagreb
  'LDSB': [43.2854, 16.6797],    // Split (Brac nearby)
  'LDDU': [42.5614, 18.2682],    // Dubrovnik
  'LJLJ': [46.2237, 14.4576],    // Ljubljana
  'LYBE': [44.8184, 20.3091],    // Belgrade
  'LGAV': [37.9364, 23.9445],    // Athens
  'LGTS': [40.5197, 22.9709],    // Thessaloniki
  'LGKR': [39.6019, 19.9117],    // Corfu
  'LGIR': [35.3397, 25.1803],    // Heraklion Crete
  'LTFM': [41.2753, 28.7519],    // Istanbul
  'LTAI': [36.8987, 30.8005],    // Antalya
  'LTAC': [39.9498, 32.6886],    // Ankara Esenboga
  'LTBA': [40.9769, 28.8146],    // Istanbul Ataturk (old)
  'LTBJ': [38.2924, 27.1570],    // Izmir
  'LTCG': [40.9951, 39.7897],    // Trabzon

  // ========================
  // RUSSIA & CIS (10)
  // ========================
  'UUEE': [55.9726, 37.4146],    // Moscow Sheremetyevo
  'UUDD': [55.4088, 37.9063],    // Moscow Domodedovo
  'UUWW': [55.5994, 37.2681],    // Moscow Vnukovo
  'ULLI': [59.8003, 30.2625],    // St Petersburg Pulkovo
  'UNNT': [55.0126, 82.6507],    // Novosibirsk
  'USSS': [56.7431, 60.8027],    // Yekaterinburg
  'UWWW': [53.5040, 50.1643],    // Samara
  'URKK': [45.0347, 39.1705],    // Krasnodar
  'URSS': [43.4499, 39.9566],    // Sochi
  'UHWW': [43.3960, 132.1483],   // Vladivostok

  // ========================
  // MIDDLE EAST (25)
  // ========================
  'OMDB': [25.2528, 55.3644],    // Dubai
  'OMDW': [24.8967, 55.1614],    // Al Maktoum / Dubai World Central
  'OMAA': [24.4440, 54.6511],    // Abu Dhabi
  'OMSJ': [25.3286, 55.5172],    // Sharjah
  'OTHH': [25.2731, 51.6081],    // Doha Hamad
  'OBBI': [26.2708, 50.6336],    // Bahrain
  'OKBK': [29.2267, 47.9689],    // Kuwait
  'OERK': [24.9576, 46.6988],    // Riyadh
  'OEJN': [21.6796, 39.1565],    // Jeddah
  'OEDF': [26.4712, 49.7979],    // Dammam
  'OEMD': [24.5534, 39.7051],    // Madinah
  'OOMS': [23.5933, 58.2844],    // Muscat
  'OYAA': [15.4793, 44.2197],    // Sana'a (Yemen)
  'OIIE': [35.4161, 51.1522],    // Tehran Imam Khomeini
  'OIII': [35.6892, 51.3134],    // Tehran Mehrabad
  'OISS': [29.5392, 52.5898],    // Shiraz
  'OIKB': [27.2183, 56.3778],    // Bandar Abbas
  'ORBI': [33.2625, 44.2346],    // Baghdad
  'ORER': [36.2376, 44.0015],    // Erbil
  'OJAM': [31.7226, 35.9932],    // Amman Queen Alia
  'OLBA': [33.8209, 35.4884],    // Beirut
  'OSDI': [33.4115, 36.5156],    // Damascus
  'LLBG': [32.0114, 34.8867],    // Tel Aviv Ben Gurion
  'OETF': [21.4831, 40.5434],    // Taif
  'OEAB': [20.2961, 41.6403],    // Al Baha

  // ========================
  // SOUTH ASIA / INDIA (20)
  // ========================
  'VIDP': [28.5562, 77.1000],    // Delhi Indira Gandhi
  'VABB': [19.0896, 72.8656],    // Mumbai
  'VOBL': [13.1986, 77.7066],    // Bangalore Kempegowda
  'VOMM': [12.9941, 80.1709],    // Chennai
  'VECC': [22.6547, 88.4467],    // Kolkata
  'VOHS': [17.2403, 78.4294],    // Hyderabad
  'VOCI': [10.1520, 76.4019],    // Kochi
  'VAAH': [23.0772, 72.6347],    // Ahmedabad
  'VOGO': [15.3809, 73.8314],    // Goa
  'VAJJ': [26.8242, 75.8122],    // Jaipur
  'VEPT': [25.5913, 85.0880],    // Patna
  'VILK': [26.7606, 80.8893],    // Lucknow
  'VOCL': [11.1368, 75.9553],    // Calicut / Kozhikode
  'VOTV': [8.4821, 76.9201],     // Trivandrum
  'VOPB': [11.6412, 92.7297],    // Port Blair
  'OPKC': [24.9065, 67.1608],    // Karachi
  'OPLA': [31.5216, 74.4036],    // Lahore
  'OPIS': [33.6161, 72.8526],    // Islamabad
  'VCBI': [7.1808, 79.8841],     // Colombo Bandaranaike
  'VRMM': [4.1918, 73.5291],     // Male Maldives

  // ========================
  // CHINA & MONGOLIA (30)
  // ========================
  'ZBAA': [40.0799, 116.6031],   // Beijing Capital
  'ZSPD': [31.1443, 121.8083],   // Shanghai Pudong
  'ZSSS': [31.1979, 121.3363],   // Shanghai Hongqiao
  'ZGGG': [23.3924, 113.2988],   // Guangzhou Baiyun
  'VHHH': [22.3080, 113.9185],   // Hong Kong
  'ZGSZ': [22.6393, 113.8107],   // Shenzhen
  'ZUUU': [30.5785, 103.9471],   // Chengdu Shuangliu
  'ZPPP': [25.1022, 102.9292],   // Kunming
  'ZHCC': [34.5197, 113.8408],   // Zhengzhou
  'ZLXY': [34.4471, 108.7516],   // Xian Xianyang
  'ZUCK': [29.7192, 106.6422],   // Chongqing
  'ZWWW': [43.9071, 87.4742],    // Urumqi
  'ZSHC': [30.2295, 120.4344],   // Hangzhou
  'ZSNJ': [31.7420, 118.8620],   // Nanjing
  'ZSAM': [24.5440, 118.1278],   // Xiamen
  'ZUGY': [26.5385, 106.8012],   // Guiyang
  'ZGHA': [28.1892, 113.2197],   // Changsha
  'ZSJN': [36.8572, 117.2156],   // Jinan
  'ZBHH': [40.8519, 111.8243],   // Hohhot
  'ZYTX': [41.6398, 123.4833],   // Shenyang
  'ZYHB': [45.6234, 126.2503],   // Harbin
  'ZYCC': [43.9962, 125.6852],   // Changchun
  'ZLDH': [40.1610, 94.6817],    // Dunhuang
  'ZSOF': [31.7780, 117.2975],   // Hefei
  'ZBTJ': [39.1244, 117.3462],   // Tianjin
  'VMMC': [22.1496, 113.5920],   // Macau
  'ZSWZ': [27.9122, 120.8522],   // Wenzhou
  'ZSFZ': [25.9351, 119.6631],   // Fuzhou
  'ZLLL': [36.5152, 103.6207],   // Lanzhou
  'ZBOW': [39.9568, 119.8603],   // Qinhuangdao

  // ========================
  // JAPAN (15)
  // ========================
  'RJTT': [35.5533, 139.7811],   // Tokyo Haneda
  'RJAA': [35.7647, 140.3864],   // Tokyo Narita
  'RJBB': [34.4273, 135.2441],   // Osaka Kansai
  'RJOO': [34.7855, 135.4383],   // Osaka Itami
  'RJCC': [42.7752, 141.6925],   // Sapporo New Chitose
  'RJFF': [33.5859, 130.4511],   // Fukuoka
  'RJGG': [34.8584, 136.8124],   // Nagoya Chubu
  'RJSS': [38.1397, 140.9170],   // Sendai
  'ROAH': [26.1958, 127.6459],   // Okinawa Naha
  'RJFK': [33.5461, 131.7372],   // Kagoshima
  'RJNK': [36.3946, 136.4068],   // Kanazawa / Komatsu
  'RJOT': [34.1328, 134.2706],   // Takamatsu
  'RJNS': [34.7958, 137.7072],   // Hamamatsu / Shizuoka
  'RJSN': [37.9559, 139.1065],   // Niigata
  'RJOM': [33.8272, 132.6996],   // Matsuyama

  // ========================
  // SOUTH KOREA (8)
  // ========================
  'RKSI': [37.4691, 126.4505],   // Seoul Incheon
  'RKSS': [37.5583, 126.7906],   // Seoul Gimpo
  'RKPK': [35.1795, 128.9382],   // Busan Gimhae
  'RKPC': [33.5113, 126.4929],   // Jeju
  'RKTN': [35.8941, 128.6586],   // Daegu
  'RKJJ': [35.1264, 126.8089],   // Gwangju
  'RKNY': [37.7528, 128.6690],   // Yangyang
  'RKTU': [36.7172, 127.4990],   // Cheongju

  // ========================
  // SOUTHEAST ASIA (25)
  // ========================
  'WSSS': [1.3502, 103.9940],    // Singapore Changi
  'WMKK': [2.7456, 101.7099],    // Kuala Lumpur KLIA
  'WMKP': [5.2973, 100.2768],    // Penang
  'WMKL': [6.3297, 99.7287],     // Langkawi
  'VTBS': [13.6900, 100.7501],   // Bangkok Suvarnabhumi
  'VTBD': [13.9126, 100.6068],   // Bangkok Don Mueang
  'VTSP': [8.1132, 98.3169],     // Phuket
  'VTCC': [18.7669, 98.9625],    // Chiang Mai
  'VVNB': [21.2212, 105.8070],   // Hanoi Noi Bai
  'VVTS': [10.8188, 106.6520],   // Ho Chi Minh Tan Son Nhat
  'VVDN': [16.0440, 108.1990],   // Da Nang
  'VDPP': [11.5466, 104.8441],   // Phnom Penh
  'VDSR': [13.4117, 103.8133],   // Siem Reap
  'VLVT': [17.9883, 102.5633],   // Vientiane
  'RPLL': [14.5086, 121.0197],   // Manila NAIA
  'RPVM': [10.3075, 123.9794],   // Cebu Mactan
  'WIII': [-6.1256, 106.6558],   // Jakarta Soekarno-Hatta
  'WADD': [-8.7482, 115.1672],   // Bali Ngurah Rai
  'WARR': [-7.3797, 112.7871],   // Surabaya
  'WICC': [-6.9006, 107.5764],   // Bandung
  'WIMM': [3.5580, 98.6716],     // Medan
  'WBKK': [5.9372, 116.0503],    // Kota Kinabalu
  'WBGG': [1.4847, 110.3471],    // Kuching
  'VYYY': [16.9073, 96.1332],    // Yangon
  'VYBM': [21.1788, 94.8731],    // Bagan / Nyaung U

  // ========================
  // TAIWAN (5)
  // ========================
  'RCTP': [25.0777, 121.2325],   // Taipei Taoyuan
  'RCSS': [25.0694, 121.5525],   // Taipei Songshan
  'RCKH': [22.5771, 120.3500],   // Kaohsiung
  'RCMQ': [24.2646, 120.6208],   // Taichung
  'RCNN': [22.9503, 121.1018],   // Taitung

  // ========================
  // AUSTRALIA & NEW ZEALAND (20)
  // ========================
  'YSSY': [-33.9461, 151.1772],  // Sydney
  'YMML': [-37.6690, 144.8410],  // Melbourne Tullamarine
  'YBBN': [-27.3842, 153.1175],  // Brisbane
  'YPPH': [-31.9403, 115.9672],  // Perth
  'YPAD': [-34.9450, 138.5306],  // Adelaide
  'YSCB': [-35.3069, 149.1950],  // Canberra
  'YBCG': [-28.1644, 153.5075],  // Gold Coast / Coolangatta
  'YBCS': [-16.8858, 145.7553],  // Cairns
  'YBTL': [-19.2525, 146.7656],  // Townsville
  'YPDN': [-12.4147, 130.8769],  // Darwin
  'YMHB': [-42.8361, 147.5103],  // Hobart
  'YMAV': [-38.0339, 144.4697],  // Avalon (near Melbourne)
  'YAYE': [12.0508, 96.8342],    // Ayers Rock (Uluru)
  'NZAA': [-37.0082, 174.7850],  // Auckland
  'NZWN': [-41.3272, 174.8053],  // Wellington
  'NZCH': [-43.4894, 172.5322],  // Christchurch
  'NZQN': [-45.0211, 168.7392],  // Queenstown
  'NZDN': [-45.9281, 170.1986],  // Dunedin
  'NZHN': [-37.8667, 175.3320],  // Hamilton NZ
  'NZPM': [-39.0086, 174.9891],  // Palmerston North

  // ========================
  // PACIFIC ISLANDS (8)
  // ========================
  'NFFN': [-17.7554, 177.4431],  // Fiji Nadi
  'NSFA': [-13.8299, -171.9977], // Samoa Faleolo
  'NTAA': [-17.5537, -149.6073], // Tahiti Faaa
  'PGUM': [13.4834, 144.7961],   // Guam
  'NWWW': [-22.0146, 166.2128],  // Noumea New Caledonia
  'PLCH': [1.9862, -157.3500],   // Christmas Island Kiribati
  'NVVV': [-17.6993, 168.3199],  // Vanuatu Port Vila
  'NFTF': [-21.2411, -175.1497], // Tonga Fua'amotu

  // ========================
  // AFRICA — NORTH (12)
  // ========================
  'HECA': [30.1219, 31.4056],    // Cairo
  'HEGN': [27.1784, 33.7994],    // Hurghada
  'HESH': [27.9773, 34.3950],    // Sharm El Sheikh
  'GMMN': [33.3675, -7.5898],    // Casablanca Mohammed V
  'GMME': [34.0515, -6.7515],    // Rabat
  'GMFF': [33.9273, -4.9780],    // Fes
  'DAAG': [36.6910, 3.2154],     // Algiers
  'DTTA': [36.8510, 10.2272],    // Tunis
  'DTNH': [35.7581, 10.7547],    // Monastir
  'HLLT': [32.6920, 13.1590],    // Tripoli
  'HDAM': [11.5472, 43.1594],    // Djibouti
  'HAAB': [8.9779, 38.7993],     // Addis Ababa Bole

  // ========================
  // AFRICA — SUB-SAHARAN (20)
  // ========================
  'FAOR': [-26.1392, 28.2460],   // Johannesburg OR Tambo
  'FACT': [-33.9649, 18.6017],   // Cape Town
  'FALE': [-29.6144, 31.1197],   // Durban King Shaka
  'HKJK': [-1.3192, 36.9278],    // Nairobi Jomo Kenyatta
  'HTDA': [-6.8781, 39.2026],    // Dar es Salaam
  'HTJR': [-6.0310, 37.3279],    // Kilimanjaro
  'FMEE': [-20.4247, 57.6836],   // Mauritius
  'FMCH': [-11.5336, 43.2719],   // Comoros Moroni
  'HRYR': [-1.9686, 30.1395],    // Kigali
  'HUEN': [0.0424, 32.4435],     // Entebbe Uganda
  'DNMM': [6.5774, 3.3211],      // Lagos Murtala Muhammed
  'DNAA': [9.0068, 7.2632],      // Abuja
  'DGAA': [5.6052, -0.1668],     // Accra Kotoka
  'DIAP': [5.2614, -3.9262],     // Abidjan
  'GOOY': [14.7397, -17.4902],   // Dakar Blaise Diagne
  'GABS': [13.4730, -16.6522],   // Banjul
  'FLKK': [-15.3305, 28.4526],   // Lusaka
  'FVHA': [-17.9318, 31.0928],   // Harare
  'FWKI': [-13.7895, 33.7811],   // Lilongwe
  'FQMA': [-25.9208, 32.5726],   // Maputo

};

/**
 * Look up airport coordinates by ICAO code.
 * @param {string} icao - 4-letter ICAO airport code (e.g. 'KJFK')
 * @returns {{ lat: number, lon: number } | null}
 */
export function getAirportCoords(icao) {
  if (!icao) return null;
  const coords = AIRPORTS[icao.toUpperCase()];
  if (!coords) return null;
  return { lat: coords[0], lon: coords[1] };
}

/**
 * Find the nearest airport to a given lat/lon.
 * @param {number} lat
 * @param {number} lon
 * @param {number} [maxNm=10] — max distance in nautical miles (default 10)
 * @returns {{ icao: string, distNm: number } | null}
 */
export function getNearestAirport(lat, lon, maxNm = 10) {
  const DEG_TO_NM = 60; // 1 degree latitude ≈ 60nm
  let best = null;
  let bestDist = Infinity;
  for (const [icao, coords] of Object.entries(AIRPORTS)) {
    const dLat = coords[0] - lat;
    const dLon = (coords[1] - lon) * Math.cos(lat * Math.PI / 180);
    const distNm = Math.sqrt(dLat * dLat + dLon * dLon) * DEG_TO_NM;
    if (distNm < bestDist) {
      bestDist = distNm;
      best = icao;
    }
  }
  if (bestDist > maxNm) return null;
  return { icao: best, distNm: Math.round(bestDist * 10) / 10 };
}
