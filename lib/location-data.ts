// Shipping zone: 1 = West Bengal (₹50), 2 = nearby states (₹90),
// 3 = mid-distance (₹100), 4 = far/rest of India (₹120)

export type IndianState = { name: string; zone: 1 | 2 | 3 | 4 };

export const INDIAN_STATES: IndianState[] = [
  { name: 'West Bengal', zone: 1 },
  { name: 'Jharkhand', zone: 2 },
  { name: 'Bihar', zone: 2 },
  { name: 'Odisha', zone: 2 },
  { name: 'Assam', zone: 2 },
  { name: 'Sikkim', zone: 2 },
  { name: 'Tripura', zone: 2 },
  { name: 'Uttar Pradesh', zone: 3 },
  { name: 'Delhi', zone: 3 },
  { name: 'Madhya Pradesh', zone: 3 },
  { name: 'Chhattisgarh', zone: 3 },
  { name: 'Rajasthan', zone: 3 },
  { name: 'Maharashtra', zone: 4 },
  { name: 'Gujarat', zone: 4 },
  { name: 'Karnataka', zone: 4 },
  { name: 'Kerala', zone: 4 },
  { name: 'Tamil Nadu', zone: 4 },
  { name: 'Andhra Pradesh', zone: 4 },
  { name: 'Telangana', zone: 4 },
  { name: 'Punjab', zone: 4 },
  { name: 'Haryana', zone: 4 },
  { name: 'Himachal Pradesh', zone: 4 },
  { name: 'Uttarakhand', zone: 4 },
  { name: 'Goa', zone: 4 },
  { name: 'Jammu & Kashmir', zone: 4 },
  { name: 'Ladakh', zone: 4 },
  { name: 'Manipur', zone: 4 },
  { name: 'Meghalaya', zone: 4 },
  { name: 'Mizoram', zone: 4 },
  { name: 'Nagaland', zone: 4 },
  { name: 'Arunachal Pradesh', zone: 4 },
  { name: 'Andaman & Nicobar Islands', zone: 4 },
  { name: 'Chandigarh', zone: 3 },
  { name: 'Puducherry', zone: 4 },
];

export function getShippingCharge(stateName: string): number {
  const state = INDIAN_STATES.find((s) => s.name === stateName);
  if (!state) return 0;
  return state.zone === 1 ? 50 : state.zone === 2 ? 90 : state.zone === 3 ? 100 : 120;
}

export const WB_DISTRICTS: Record<string, string[]> = {
  Kolkata: [
    'Park Street', 'Ballygunge', 'Behala', 'Tollygunge', 'Jadavpur',
    'Barrackpore (Kolkata)', 'Alipore', 'Ultadanga', 'Garia', 'Baguihati',
  ],
  'South 24 Parganas': [
    'Diamond Harbour', 'Baruipur', 'Kakdwip', 'Canning', 'Budge Budge',
    'Sonarpur', 'Jaynagar', 'Mathurapur', 'Maheshtala', 'Thakurpukur',
  ],
  'North 24 Parganas': [
    'Barasat', 'Barrackpore', 'Basirhat', 'Bongaon', 'Bidhannagar',
    'Rajarhat', 'Habra', 'Ashoknagar', 'Gobardanga', 'Bagda',
  ],
  Howrah: [
    'Howrah Sadar', 'Uluberia', 'Amta', 'Bagnan', 'Jagatballavpur',
    'Sankrail', 'Domjur', 'Panchla', 'Shyampur', 'Bally',
  ],
  Hooghly: [
    'Chinsurah', 'Chandannagar', 'Serampore', 'Arambagh', 'Tarakeswar',
    'Baidyabati', 'Rishra', 'Konnagar', 'Dhaniakhali', 'Pandua',
  ],
  Murshidabad: [
    'Berhampore', 'Kandi', 'Jangipur', 'Lalbagh', 'Domkal',
    'Raninagar', 'Naoda', 'Sagardighi', 'Suti', 'Samserganj',
  ],
  Nadia: [
    'Krishnanagar', 'Kalyani', 'Ranaghat', 'Shantipur', 'Habra (Nadia)',
    'Nabadwip', 'Chakdaha', 'Haringhata', 'Karimpur', 'Tehatta',
  ],
  Birbhum: [
    'Suri', 'Bolpur (Santiniketan)', 'Rampurhat', 'Dubrajpur', 'Nalhati',
    'Mayureswar', 'Sainthia', 'Khoyrasole', 'Mohammad Bazar', 'Labhpur',
  ],
  Bankura: [
    'Bankura Sadar', 'Bishnupur', 'Sonamukhi', 'Belpahari', 'Onda',
    'Chhatna', 'Indas', 'Patrasayer', 'Saltora', 'Ranibandh',
  ],
  'Purba Bardhaman': [
    'Burdwan Sadar', 'Katwa', 'Kalna', 'Memari', 'Guskara',
    'Mongalkot', 'Ketugram', 'Purbasthali', 'Raina', 'Jamalpur',
  ],
  'Paschim Bardhaman': [
    'Asansol', 'Durgapur', 'Kulti', 'Raniganj', 'Jamuria',
    'Barabani', 'Salanpur', 'Faridpur', 'Pandaveswar', 'Andal',
  ],
  Purulia: [
    'Purulia Sadar', 'Raghunathpur', 'Manbazar', 'Jhalda', 'Bandwan',
    'Kotshila', 'Bundwan', 'Hura', 'Santuri', 'Para',
  ],
  'Paschim Medinipur': [
    'Midnapore Sadar', 'Kharagpur', 'Jhargram', 'Ghatal', 'Dantan',
    'Narayangarh', 'Debra', 'Pingla', 'Sabang', 'Chandrakona',
  ],
  'Purba Medinipur': [
    'Tamluk', 'Haldia', 'Contai', 'Egra', 'Mahishadal',
    'Panskura', 'Moyna', 'Bhagwanpur', 'Ramnagar', 'Potashpur',
  ],
  Malda: [
    'English Bazar', 'Old Malda', 'Habibpur', 'Gazole', 'Chanchal',
    'Harishchandrapur', 'Kaliachak', 'Manikchak', 'Ratua', 'Bamangola',
  ],
  'Uttar Dinajpur': [
    'Raiganj', 'Islampur', 'Goalpokhar', 'Chopra', 'Karandighi',
    'Itahar', 'Kaliaganj', 'Hemtabad', 'Bansihari', 'Dalkhola',
  ],
  'Dakshin Dinajpur': [
    'Balurghat', 'Gangarampur', 'Tapan', 'Bansihari (DK)', 'Kumarganj',
    'Harirampur', 'Kushmandi', 'Hili', 'Puncha', 'Bhatpara (DK)',
  ],
  Jalpaiguri: [
    'Jalpaiguri Sadar', 'Malbazar', 'Alipurduar', 'Falakata', 'Dhupguri',
    'Rajganj', 'Maynaguri', 'Nagrakata', 'Banarhat', 'Birpara',
  ],
  'Alipurduar': [
    'Alipurduar Sadar', 'Falakata (AD)', 'Madarihat', 'Kalchini', 'Kumargram',
    'Boxirhat', 'Samuktala', 'Hamiltonganj', 'Bengdubi', 'Chalsa',
  ],
  'Cooch Behar': [
    'Cooch Behar Sadar', 'Dinhata', 'Mathabhanga', 'Mekliganj', 'Tufanganj',
    'Nishchintapur', 'Sitalkuchi', 'Gitaldaha', 'Bamanhat', 'Pundibari',
  ],
  Darjeeling: [
    'Darjeeling Sadar', 'Siliguri', 'Kurseong', 'Mirik', 'Kalimpong',
    'Gorubathan', 'Sukhiapokhri', 'Rangli Rangliot', 'Pedong', 'Lava',
  ],
  Kalimpong: [
    'Kalimpong Sadar', 'Gorubathan (KP)', 'Pedong (KP)', 'Algarah', 'Lava (KP)',
    'Relli', 'Samthar', 'Gitdabling', 'Kumai', 'Teesta Valley',
  ],
};

export const OTHER_STATES_DISTRICTS: Record<string, string[]> = {
  Jharkhand: ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Hazaribagh', 'Giridih', 'Ramgarh'],
  Bihar: ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur', 'Darbhanga', 'Purnia', 'Nalanda', 'Saran'],
  Odisha: ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Puri', 'Balasore', 'Sambalpur', 'Berhampur'],
  Assam: ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Tezpur', 'Bongaigaon'],
  Sikkim: ['Gangtok', 'Namchi', 'Gyalshing', 'Mangan'],
  Tripura: ['Agartala', 'Udaipur', 'Dharmanagar', 'Kailashahar'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Varanasi', 'Agra', 'Prayagraj', 'Noida', 'Gorakhpur'],
  Delhi: ['New Delhi', 'Central Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain'],
  Chhattisgarh: ['Raipur', 'Bilaspur', 'Durg', 'Korba'],
  Rajasthan: ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer'],
  Maharashtra: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane', 'Aurangabad'],
  Gujarat: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar'],
  Karnataka: ['Bengaluru', 'Mysuru', 'Hubli', 'Mangaluru', 'Belagavi'],
  Kerala: ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem'],
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati'],
  Telangana: ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar'],
  Punjab: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Mohali'],
  Haryana: ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Karnal'],
  'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Mandi', 'Solan'],
  Uttarakhand: ['Dehradun', 'Haridwar', 'Rishikesh', 'Nainital'],
  Goa: ['Panaji', 'Margao', 'Vasco da Gama'],
  'Jammu & Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla'],
  Ladakh: ['Leh', 'Kargil'],
  Manipur: ['Imphal', 'Thoubal', 'Churachandpur'],
  Meghalaya: ['Shillong', 'Tura', 'Jowai'],
  Mizoram: ['Aizawl', 'Lunglei', 'Champhai'],
  Nagaland: ['Kohima', 'Dimapur', 'Mokokchung'],
  'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat'],
  'Andaman & Nicobar Islands': ['Port Blair', 'Havelock', 'Car Nicobar'],
  Chandigarh: ['Chandigarh City'],
  Puducherry: ['Puducherry', 'Karaikal', 'Mahe', 'Yanam'],
};

// Police stations for major WB districts; other districts get a generic "PS" list.
export const POLICE_STATIONS: Record<string, string[]> = {
  'Kolkata:Park Street': ['Park Street PS', 'Taltala PS', 'Entally PS', 'Karaya PS'],
  'Kolkata:Ballygunge': ['Ballygunge PS', 'Gariahat PS', 'Lake PS', 'Kalighat PS'],
  'Kolkata:Behala': ['Behala PS', 'Thakurpukur PS', 'Parnasree PS', 'Sarkarpool PS'],
  'Kolkata:Tollygunge': ['Tollygunge PS', 'Charu Market PS', 'Jadavpur PS', 'Patuli PS'],
  'Kolkata:Jadavpur': ['Jadavpur PS', 'Baghajatin PS', 'Patuli PS', 'Panchpota PS'],
  'South 24 Parganas:Baruipur': ['Baruipur PS', 'Sonarpur PS', 'Nodakhali PS', 'Amtala PS'],
  'South 24 Parganas:Diamond Harbour': ['Diamond Harbour PS', 'Falahar PS', 'Sarisha PS', 'Khariberia PS'],
  'South 24 Parganas:Canning': ['Canning PS', 'Basanti PS', 'Gosaba PS', 'Jibantala PS'],
  'South 24 Parganas:Kakdwip': ['Kakdwip PS', 'Namkhana PS', 'Patharpratima PS', 'Sagar PS'],
  'North 24 Parganas:Barasat': ['Barasat PS', 'Duttapukur PS', 'Habra PS', 'Ashoknagar PS'],
  'North 24 Parganas:Barrackpore': ['Barrackpore PS', 'Titagarh PS', 'Khardah PS', 'Panihati PS'],
  'North 24 Parganas:Rajarhat': ['Rajarhat PS', 'New Town PS', 'Baguiati PS', 'Chinar Park PS'],
  'North 24 Parganas:Bidhannagar': ['Bidhannagar North PS', 'Bidhannagar South PS', 'Salt Lake PS', 'Baguihati PS'],
  'Howrah:Howrah Sadar': ['Howrah PS', 'Golabari PS', 'Maidan PS', 'Bantra PS'],
  'Howrah:Uluberia': ['Uluberia PS', 'Bagnan PS', 'Amta PS', 'Shyampur PS'],
  'Hooghly:Chinsurah': ['Chinsurah PS', 'Bandal PS', 'Baidyabati PS', 'Konnagar PS'],
  'Hooghly:Serampore': ['Serampore PS', 'Rishra PS', 'Chandannagar PS', 'Bhadreswar PS'],
  'Murshidabad:Berhampore': ['Berhampore PS', 'Daulatabad PS', 'Hariharpara PS', 'Beldanga PS'],
  'Nadia:Krishnanagar': ['Krishnanagar PS', 'Kotwali PS', 'Nabadwip PS', 'Chakdaha PS'],
  'Nadia:Kalyani': ['Kalyani PS', 'Haringhata PS', 'Gayespur PS', 'Chakdaha PS'],
  'Birbhum:Suri': ['Suri PS', 'Dubrajpur PS', 'Khayrasole PS', 'Sainthia PS'],
  'Birbhum:Bolpur (Santiniketan)': ['Bolpur PS', 'Santiniketan PS', 'Sriniketan PS', 'Ilambazar PS'],
  'Malda:English Bazar': ['English Bazar PS', 'Malda Town PS', 'Old Malda PS', 'Kaliachak PS'],
  'Darjeeling:Siliguri': ['Siliguri PS', 'Bhaktinagar PS', 'Pradhan Nagar PS', 'Matigara PS'],
  'Jalpaiguri:Jalpaiguri Sadar': ['Jalpaiguri PS', 'Kotwali PS', 'Raiganj PS', 'Belakoba PS'],
  'Cooch Behar:Cooch Behar Sadar': ['Cooch Behar PS', 'Kotwali PS', 'Dinhata PS', 'Mathabhanga PS'],
};

// Areas / villages for key police stations; others fall back to generic area list.
export const AREAS: Record<string, string[]> = {
  'Jadavpur PS': ['Jadavpur', 'Baghajatin', 'Santoshpur', 'Garia', 'Panchpota'],
  'Baghajatin PS': ['Baghajatin', 'Patuli', 'Panchpota', 'Hiland Park', 'Nayabad'],
  'Baruipur PS': ['Baruipur Town', 'Champahati', 'Solgohalia', 'Piyali', 'Subhasgram'],
  'Sonarpur PS': ['Sonarpur', 'Rajpur', 'Narendrapur', 'Kamalgazi', 'Khardaha (Sonarpur)'],
  'Bolpur PS': ['Bolpur Town', 'Sian', 'Rupsa', 'Kankalitala', 'Satpota'],
  'Siliguri PS': ['Siliguri Town', 'Sevoke Road', 'Hill Cart Road', 'Dagapur', 'Ashrampara'],
  'Rajarhat PS': ['Rajarhat', 'Bhangar', 'Jota', 'Mahisbathan', 'Hatisala'],
  'New Town PS': ['Action Area 1', 'Action Area 2', 'Action Area 3', 'Chinar Park', 'Chandpur'],
  'Howrah PS': ['Howrah Maidan', 'Pilkhana', 'Salkia', 'Kasundia', 'Liluah'],
  'Uluberia PS': ['Uluberia Town', 'Kalyanpur', 'Ranapur', 'Basudevpur', 'Panchita'],
  'Krishnanagar PS': ['Krishnanagar Town', 'Churni', 'Ghurni', 'Barakhanda', 'Betna'],
  'Kalyani PS': ['Kalyani Central', 'Kalyani East', 'Kalyani West', 'Gayespur', 'Siddheswari'],
  'Berhampore PS': ['Berhampore Court', 'Khagra', 'Gora Bazar', 'Nasipur', 'Haridasmati'],
  'English Bazar PS': ['English Bazar', 'Sahapur', 'Malda Bus Stand Area', 'Jhaljhalia', 'Milki'],
  'Serampore PS': ['Serampore Town', 'Mahesh', 'Chattawar', 'Ghoramara', 'Rajbalhat'],
};

export function getDistrictsForState(stateName: string): string[] {
  if (stateName === 'West Bengal') return Object.keys(WB_DISTRICTS);
  return OTHER_STATES_DISTRICTS[stateName] ?? [];
}

export function getPoliceStationsForDistrict(stateName: string, district: string): string[] {
  if (stateName !== 'West Bengal') {
    // generic list for non-WB states
    return [
      `${district} Main PS`,
      `${district} Town PS`,
      `${district} Rural PS`,
      `${district} North PS`,
      `${district} South PS`,
    ];
  }
  const stations = new Set<string>();
  for (const key of Object.keys(POLICE_STATIONS)) {
    if (key.startsWith(`${district}:`)) {
      for (const ps of POLICE_STATIONS[key as keyof typeof POLICE_STATIONS]) {
        stations.add(ps);
      }
    }
  }
  // fall back: use the district name itself as a PS option plus generic ones
  if (stations.size === 0) {
    return [
      `${district} PS`,
      `${district} Sadar PS`,
      `${district} Town PS`,
      `${district} Rural PS`,
    ];
  }
  return Array.from(stations);
}

export function getAreasForPoliceStation(stateName: string, ps: string): string[] {
  const areas = AREAS[ps];
  if (areas) return areas;
  const label = ps.replace(/\s*PS$/, '');
  return [
    `${label} Town`,
    `${label} Market Area`,
    `${label} North Para`,
    `${label} South Para`,
    `${label} Rural`,
  ];
}
