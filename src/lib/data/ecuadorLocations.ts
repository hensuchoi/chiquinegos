interface City {
  id: string;
  name: string;
}

interface Province {
  id: string;
  name: string;
  cities: City[];
}

export const provinces: Province[] = [
  {
    id: "azuay",
    name: "Azuay",
    cities: [
      { id: "cuenca", name: "Cuenca" },
      { id: "gualaceo", name: "Gualaceo" },
      { id: "paute", name: "Paute" }
    ]
  },
  {
    id: "bolivar",
    name: "Bolívar",
    cities: [
      { id: "guaranda", name: "Guaranda" },
      { id: "chimbo", name: "Chimbo" },
      { id: "san-miguel", name: "San Miguel" }
    ]
  },
  {
    id: "canar",
    name: "Cañar",
    cities: [
      { id: "azogues", name: "Azogues" },
      { id: "biblian", name: "Biblián" },
      { id: "la-troncal", name: "La Troncal" }
    ]
  },
  {
    id: "carchi",
    name: "Carchi",
    cities: [
      { id: "tulcan", name: "Tulcán" },
      { id: "montufar", name: "Montúfar" },
      { id: "espejo", name: "Espejo" }
    ]
  },
  {
    id: "chimborazo",
    name: "Chimborazo",
    cities: [
      { id: "riobamba", name: "Riobamba" },
      { id: "alausi", name: "Alausí" },
      { id: "guano", name: "Guano" }
    ]
  },
  {
    id: "cotopaxi",
    name: "Cotopaxi",
    cities: [
      { id: "latacunga", name: "Latacunga" },
      { id: "salcedo", name: "Salcedo" },
      { id: "pujili", name: "Pujilí" }
    ]
  },
  {
    id: "el-oro",
    name: "El Oro",
    cities: [
      { id: "machala", name: "Machala" },
      { id: "pasaje", name: "Pasaje" },
      { id: "santa-rosa", name: "Santa Rosa" }
    ]
  },
  {
    id: "esmeraldas",
    name: "Esmeraldas",
    cities: [
      { id: "esmeraldas-city", name: "Esmeraldas" },
      { id: "quininde", name: "Quinindé" },
      { id: "atacames", name: "Atacames" }
    ]
  },
  {
    id: "galapagos",
    name: "Galápagos",
    cities: [
      { id: "puerto-baquerizo", name: "Puerto Baquerizo Moreno" },
      { id: "puerto-ayora", name: "Puerto Ayora" },
      { id: "puerto-villamil", name: "Puerto Villamil" }
    ]
  },
  {
    id: "guayas",
    name: "Guayas",
    cities: [
      { id: "guayaquil", name: "Guayaquil" },
      { id: "duran", name: "Durán" },
      { id: "samborondon", name: "Samborondón" }
    ]
  },
  {
    id: "imbabura",
    name: "Imbabura",
    cities: [
      { id: "ibarra", name: "Ibarra" },
      { id: "otavalo", name: "Otavalo" },
      { id: "cotacachi", name: "Cotacachi" }
    ]
  },
  {
    id: "loja",
    name: "Loja",
    cities: [
      { id: "loja-city", name: "Loja" },
      { id: "catamayo", name: "Catamayo" },
      { id: "macara", name: "Macará" }
    ]
  },
  {
    id: "los-rios",
    name: "Los Ríos",
    cities: [
      { id: "babahoyo", name: "Babahoyo" },
      { id: "quevedo", name: "Quevedo" },
      { id: "ventanas", name: "Ventanas" }
    ]
  },
  {
    id: "manabi",
    name: "Manabí",
    cities: [
      { id: "portoviejo", name: "Portoviejo" },
      { id: "manta", name: "Manta" },
      { id: "chone", name: "Chone" }
    ]
  },
  {
    id: "morona-santiago",
    name: "Morona Santiago",
    cities: [
      { id: "macas", name: "Macas" },
      { id: "sucua", name: "Sucúa" },
      { id: "gualaquiza", name: "Gualaquiza" }
    ]
  },
  {
    id: "napo",
    name: "Napo",
    cities: [
      { id: "tena", name: "Tena" },
      { id: "archidona", name: "Archidona" },
      { id: "el-chaco", name: "El Chaco" }
    ]
  },
  {
    id: "orellana",
    name: "Orellana",
    cities: [
      { id: "coca", name: "Francisco de Orellana (Coca)" },
      { id: "sacha", name: "La Joya de los Sachas" },
      { id: "loreto", name: "Loreto" }
    ]
  },
  {
    id: "pastaza",
    name: "Pastaza",
    cities: [
      { id: "puyo", name: "Puyo" },
      { id: "mera", name: "Mera" },
      { id: "santa-clara", name: "Santa Clara" }
    ]
  },
  {
    id: "pichincha",
    name: "Pichincha",
    cities: [
      { id: "quito", name: "Quito" },
      { id: "cayambe", name: "Cayambe" },
      { id: "mejia", name: "Mejía" }
    ]
  },
  {
    id: "santa-elena",
    name: "Santa Elena",
    cities: [
      { id: "santa-elena-city", name: "Santa Elena" },
      { id: "la-libertad", name: "La Libertad" },
      { id: "salinas", name: "Salinas" }
    ]
  },
  {
    id: "santo-domingo",
    name: "Santo Domingo de los Tsáchilas",
    cities: [
      { id: "santo-domingo-city", name: "Santo Domingo" },
      { id: "la-concordia", name: "La Concordia" }
    ]
  },
  {
    id: "sucumbios",
    name: "Sucumbíos",
    cities: [
      { id: "nueva-loja", name: "Nueva Loja (Lago Agrio)" },
      { id: "shushufindi", name: "Shushufindi" },
      { id: "gonzalo-pizarro", name: "Gonzalo Pizarro" }
    ]
  },
  {
    id: "tungurahua",
    name: "Tungurahua",
    cities: [
      { id: "ambato", name: "Ambato" },
      { id: "banos", name: "Baños" },
      { id: "pelileo", name: "Pelileo" }
    ]
  },
  {
    id: "zamora-chinchipe",
    name: "Zamora Chinchipe",
    cities: [
      { id: "zamora", name: "Zamora" },
      { id: "yantzaza", name: "Yantzaza" },
      { id: "centinela-del-condor", name: "Centinela del Cóndor" }
    ]
  }
];

export type { Province, City }; 