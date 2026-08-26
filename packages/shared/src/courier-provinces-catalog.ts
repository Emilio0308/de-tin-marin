/** Static province lists for courier seed / admin catalog (provinces never change). */

export type CourierProvinceCatalogEntry = {
  slug: string;
  name: string;
};

export type CourierDepartmentCatalogEntry = {
  name: string;
  sortOrder: number;
  provinces: readonly CourierProvinceCatalogEntry[];
};

export const COURIER_DEPARTMENT_CATALOG: readonly CourierDepartmentCatalogEntry[] =
  [
    {
      name: "Amazonas",
      sortOrder: 10,
      provinces: [
        {
          slug: "chachapoyas",
          name: "Chachapoyas",
        },
        {
          slug: "bagua",
          name: "Bagua",
        },
        {
          slug: "bongara",
          name: "Bongara",
        },
        {
          slug: "condorcanqui",
          name: "Condorcanqui",
        },
        {
          slug: "luya",
          name: "Luya",
        },
        {
          slug: "rodriguez-de-mendoza",
          name: "Rodriguez de Mendoza",
        },
        {
          slug: "utcubamba",
          name: "Utcubamba",
        },
      ],
    },
    {
      name: "Ancash",
      sortOrder: 20,
      provinces: [
        {
          slug: "huaraz",
          name: "Huaraz",
        },
        {
          slug: "aija",
          name: "Aija",
        },
        {
          slug: "antonio-raymondi",
          name: "Antonio Raymondi",
        },
        {
          slug: "asuncion",
          name: "Asuncion",
        },
        {
          slug: "bolognesi",
          name: "Bolognesi",
        },
        {
          slug: "carhuaz",
          name: "Carhuaz",
        },
        {
          slug: "carlos-fermin-fitzcarrald",
          name: "Carlos Fermin Fitzcarrald",
        },
        {
          slug: "casma",
          name: "Casma",
        },
        {
          slug: "corongo",
          name: "Corongo",
        },
        {
          slug: "huari",
          name: "Huari",
        },
        {
          slug: "huarmey",
          name: "Huarmey",
        },
        {
          slug: "huaylas",
          name: "Huaylas",
        },
        {
          slug: "mariscal-luzuriaga",
          name: "Mariscal Luzuriaga",
        },
        {
          slug: "ocros",
          name: "Ocros",
        },
        {
          slug: "pallasca",
          name: "Pallasca",
        },
        {
          slug: "pomabamba",
          name: "Pomabamba",
        },
        {
          slug: "recuay",
          name: "Recuay",
        },
        {
          slug: "santa",
          name: "Santa",
        },
        {
          slug: "sihuas",
          name: "Sihuas",
        },
        {
          slug: "yungay",
          name: "Yungay",
        },
      ],
    },
    {
      name: "Apurimac",
      sortOrder: 30,
      provinces: [
        {
          slug: "abancay",
          name: "Abancay",
        },
        {
          slug: "andahuaylas",
          name: "Andahuaylas",
        },
        {
          slug: "antabamba",
          name: "Antabamba",
        },
        {
          slug: "aymaraes",
          name: "Aymaraes",
        },
        {
          slug: "cotabambas",
          name: "Cotabambas",
        },
        {
          slug: "chincheros",
          name: "Chincheros",
        },
        {
          slug: "grau",
          name: "Grau",
        },
      ],
    },
    {
      name: "Arequipa",
      sortOrder: 40,
      provinces: [
        {
          slug: "arequipa",
          name: "Arequipa",
        },
        {
          slug: "camana",
          name: "Camana",
        },
        {
          slug: "caraveli",
          name: "Caraveli",
        },
        {
          slug: "castilla",
          name: "Castilla",
        },
        {
          slug: "caylloma",
          name: "Caylloma",
        },
        {
          slug: "condesuyos",
          name: "Condesuyos",
        },
        {
          slug: "islay",
          name: "Islay",
        },
        {
          slug: "la-union",
          name: "La Union",
        },
      ],
    },
    {
      name: "Ayacucho",
      sortOrder: 50,
      provinces: [
        {
          slug: "huamanga",
          name: "Huamanga",
        },
        {
          slug: "cangallo",
          name: "Cangallo",
        },
        {
          slug: "huanca-sancos",
          name: "Huanca Sancos",
        },
        {
          slug: "huanta",
          name: "Huanta",
        },
        {
          slug: "la-mar",
          name: "La Mar",
        },
        {
          slug: "lucanas",
          name: "Lucanas",
        },
        {
          slug: "parinacochas",
          name: "Parinacochas",
        },
        {
          slug: "paucar-del-sara-sara",
          name: "Paucar del Sara Sara",
        },
        {
          slug: "sucre",
          name: "Sucre",
        },
        {
          slug: "victor-fajardo",
          name: "Victor Fajardo",
        },
        {
          slug: "vilcas-huaman",
          name: "Vilcas Huaman",
        },
      ],
    },
    {
      name: "Cajamarca",
      sortOrder: 60,
      provinces: [
        {
          slug: "cajamarca",
          name: "Cajamarca",
        },
        {
          slug: "cajabamba",
          name: "Cajabamba",
        },
        {
          slug: "celendin",
          name: "Celendin",
        },
        {
          slug: "chota",
          name: "Chota",
        },
        {
          slug: "contumaza",
          name: "Contumaza",
        },
        {
          slug: "cutervo",
          name: "Cutervo",
        },
        {
          slug: "hualgayoc",
          name: "Hualgayoc",
        },
        {
          slug: "jaen",
          name: "Jaen",
        },
        {
          slug: "san-ignacio",
          name: "San Ignacio",
        },
        {
          slug: "san-marcos",
          name: "San Marcos",
        },
        {
          slug: "san-miguel",
          name: "San Miguel",
        },
        {
          slug: "san-pablo",
          name: "San Pablo",
        },
        {
          slug: "santa-cruz",
          name: "Santa Cruz",
        },
      ],
    },
    {
      name: "Callao",
      sortOrder: 70,
      provinces: [
        {
          slug: "callao",
          name: "Callao",
        },
      ],
    },
    {
      name: "Cusco",
      sortOrder: 80,
      provinces: [
        {
          slug: "cusco",
          name: "Cusco",
        },
        {
          slug: "acomayo",
          name: "Acomayo",
        },
        {
          slug: "anta",
          name: "Anta",
        },
        {
          slug: "calca",
          name: "Calca",
        },
        {
          slug: "canas",
          name: "Canas",
        },
        {
          slug: "canchis",
          name: "Canchis",
        },
        {
          slug: "chumbivilcas",
          name: "Chumbivilcas",
        },
        {
          slug: "espinar",
          name: "Espinar",
        },
        {
          slug: "la-convencion",
          name: "La Convencion",
        },
        {
          slug: "paruro",
          name: "Paruro",
        },
        {
          slug: "paucartambo",
          name: "Paucartambo",
        },
        {
          slug: "quispicanchi",
          name: "Quispicanchi",
        },
        {
          slug: "urubamba",
          name: "Urubamba",
        },
      ],
    },
    {
      name: "Huancavelica",
      sortOrder: 90,
      provinces: [
        {
          slug: "huancavelica",
          name: "Huancavelica",
        },
        {
          slug: "acobamba",
          name: "Acobamba",
        },
        {
          slug: "angaraes",
          name: "Angaraes",
        },
        {
          slug: "castrovirreyna",
          name: "Castrovirreyna",
        },
        {
          slug: "churcampa",
          name: "Churcampa",
        },
        {
          slug: "huaytara",
          name: "Huaytara",
        },
        {
          slug: "tayacaja",
          name: "Tayacaja",
        },
      ],
    },
    {
      name: "Huanuco",
      sortOrder: 100,
      provinces: [
        {
          slug: "huanuco",
          name: "Huanuco",
        },
        {
          slug: "ambo",
          name: "Ambo",
        },
        {
          slug: "dos-de-mayo",
          name: "Dos de Mayo",
        },
        {
          slug: "huacaybamba",
          name: "Huacaybamba",
        },
        {
          slug: "huamalies",
          name: "Huamalies",
        },
        {
          slug: "leoncio-prado",
          name: "Leoncio Prado",
        },
        {
          slug: "maranon",
          name: "Marañon",
        },
        {
          slug: "pachitea",
          name: "Pachitea",
        },
        {
          slug: "puerto-inca",
          name: "Puerto Inca",
        },
        {
          slug: "lauricocha",
          name: "Lauricocha",
        },
        {
          slug: "yarowilca",
          name: "Yarowilca",
        },
      ],
    },
    {
      name: "Ica",
      sortOrder: 110,
      provinces: [
        {
          slug: "ica",
          name: "Ica",
        },
        {
          slug: "chincha",
          name: "Chincha",
        },
        {
          slug: "nazca",
          name: "Nazca",
        },
        {
          slug: "palpa",
          name: "Palpa",
        },
        {
          slug: "pisco",
          name: "Pisco",
        },
      ],
    },
    {
      name: "Junin",
      sortOrder: 120,
      provinces: [
        {
          slug: "huancayo",
          name: "Huancayo",
        },
        {
          slug: "concepcion",
          name: "Concepcion",
        },
        {
          slug: "chanchamayo",
          name: "Chanchamayo",
        },
        {
          slug: "jauja",
          name: "Jauja",
        },
        {
          slug: "junin",
          name: "Junin",
        },
        {
          slug: "satipo",
          name: "Satipo",
        },
        {
          slug: "tarma",
          name: "Tarma",
        },
        {
          slug: "yauli",
          name: "Yauli",
        },
        {
          slug: "chupaca",
          name: "Chupaca",
        },
      ],
    },
    {
      name: "La Libertad",
      sortOrder: 130,
      provinces: [
        {
          slug: "trujillo",
          name: "Trujillo",
        },
        {
          slug: "ascope",
          name: "Ascope",
        },
        {
          slug: "bolivar",
          name: "Bolivar",
        },
        {
          slug: "chepen",
          name: "Chepen",
        },
        {
          slug: "julcan",
          name: "Julcan",
        },
        {
          slug: "otuzco",
          name: "Otuzco",
        },
        {
          slug: "pacasmayo",
          name: "Pacasmayo",
        },
        {
          slug: "pataz",
          name: "Pataz",
        },
        {
          slug: "sanchez-carrion",
          name: "Sanchez Carrion",
        },
        {
          slug: "santiago-de-chuco",
          name: "Santiago de Chuco",
        },
        {
          slug: "gran-chimu",
          name: "Gran Chimu",
        },
        {
          slug: "viru",
          name: "Viru",
        },
      ],
    },
    {
      name: "Lambayeque",
      sortOrder: 140,
      provinces: [
        {
          slug: "chiclayo",
          name: "Chiclayo",
        },
        {
          slug: "ferrenafe",
          name: "Ferreñafe",
        },
        {
          slug: "lambayeque",
          name: "Lambayeque",
        },
      ],
    },
    {
      name: "Lima",
      sortOrder: 150,
      provinces: [
        {
          slug: "lima",
          name: "Lima",
        },
        {
          slug: "barranca",
          name: "Barranca",
        },
        {
          slug: "cajatambo",
          name: "Cajatambo",
        },
        {
          slug: "canta",
          name: "Canta",
        },
        {
          slug: "canete",
          name: "Cañete",
        },
        {
          slug: "huaral",
          name: "Huaral",
        },
        {
          slug: "huarochiri",
          name: "Huarochirí",
        },
        {
          slug: "huaura",
          name: "Huaura",
        },
        {
          slug: "oyon",
          name: "Oyón",
        },
        {
          slug: "yauyos",
          name: "Yauyos",
        },
      ],
    },
    {
      name: "Loreto",
      sortOrder: 160,
      provinces: [
        {
          slug: "maynas",
          name: "Maynas",
        },
        {
          slug: "alto-amazonas",
          name: "Alto Amazonas",
        },
        {
          slug: "loreto",
          name: "Loreto",
        },
        {
          slug: "mariscal-ramon-castilla",
          name: "Mariscal Ramon Castilla",
        },
        {
          slug: "requena",
          name: "Requena",
        },
        {
          slug: "ucayali",
          name: "Ucayali",
        },
        {
          slug: "datem-del-maranon",
          name: "Datem del Marañon",
        },
        {
          slug: "putumayo",
          name: "Putumayo",
        },
      ],
    },
    {
      name: "Madre de Dios",
      sortOrder: 170,
      provinces: [
        {
          slug: "tambopata",
          name: "Tambopata",
        },
        {
          slug: "manu",
          name: "Manu",
        },
        {
          slug: "tahuamanu",
          name: "Tahuamanu",
        },
      ],
    },
    {
      name: "Moquegua",
      sortOrder: 180,
      provinces: [
        {
          slug: "mariscal-nieto",
          name: "Mariscal Nieto",
        },
        {
          slug: "general-sanchez-cerro",
          name: "General Sanchez Cerro",
        },
        {
          slug: "ilo",
          name: "Ilo",
        },
      ],
    },
    {
      name: "Pasco",
      sortOrder: 190,
      provinces: [
        {
          slug: "pasco",
          name: "Pasco",
        },
        {
          slug: "daniel-alcides-carrion",
          name: "Daniel Alcides Carrion",
        },
        {
          slug: "oxapampa",
          name: "Oxapampa",
        },
      ],
    },
    {
      name: "Piura",
      sortOrder: 200,
      provinces: [
        {
          slug: "ayabaca",
          name: "Ayabaca",
        },
        {
          slug: "huancabamba",
          name: "Huancabamba",
        },
        {
          slug: "morropon",
          name: "Morropón",
        },
        {
          slug: "paita",
          name: "Paita",
        },
        {
          slug: "sechura",
          name: "Sechura",
        },
        {
          slug: "sullana",
          name: "Sullana",
        },
        {
          slug: "talara",
          name: "Talara",
        },
      ],
    },
    {
      name: "Puno",
      sortOrder: 210,
      provinces: [
        {
          slug: "puno",
          name: "Puno",
        },
        {
          slug: "azangaro",
          name: "Azangaro",
        },
        {
          slug: "carabaya",
          name: "Carabaya",
        },
        {
          slug: "chucuito",
          name: "Chucuito",
        },
        {
          slug: "el-collao",
          name: "El Collao",
        },
        {
          slug: "huancane",
          name: "Huancane",
        },
        {
          slug: "lampa",
          name: "Lampa",
        },
        {
          slug: "melgar",
          name: "Melgar",
        },
        {
          slug: "moho",
          name: "Moho",
        },
        {
          slug: "san-antonio-de-putina",
          name: "San Antonio de Putina",
        },
        {
          slug: "san-roman",
          name: "San Roman",
        },
        {
          slug: "sandia",
          name: "Sandia",
        },
        {
          slug: "yunguyo",
          name: "Yunguyo",
        },
      ],
    },
    {
      name: "San Martin",
      sortOrder: 220,
      provinces: [
        {
          slug: "moyobamba",
          name: "Moyobamba",
        },
        {
          slug: "bellavista",
          name: "Bellavista",
        },
        {
          slug: "el-dorado",
          name: "El Dorado",
        },
        {
          slug: "huallaga",
          name: "Huallaga",
        },
        {
          slug: "lamas",
          name: "Lamas",
        },
        {
          slug: "mariscal-caceres",
          name: "Mariscal Caceres",
        },
        {
          slug: "picota",
          name: "Picota",
        },
        {
          slug: "rioja",
          name: "Rioja",
        },
        {
          slug: "san-martin",
          name: "San Martin",
        },
        {
          slug: "tocache",
          name: "Tocache",
        },
      ],
    },
    {
      name: "Tacna",
      sortOrder: 230,
      provinces: [
        {
          slug: "tacna",
          name: "Tacna",
        },
        {
          slug: "candarave",
          name: "Candarave",
        },
        {
          slug: "jorge-basadre",
          name: "Jorge Basadre",
        },
        {
          slug: "tarata",
          name: "Tarata",
        },
      ],
    },
    {
      name: "Tumbes",
      sortOrder: 240,
      provinces: [
        {
          slug: "tumbes",
          name: "Tumbes",
        },
        {
          slug: "contralmirante-villar",
          name: "Contralmirante Villar",
        },
        {
          slug: "zarumilla",
          name: "Zarumilla",
        },
      ],
    },
    {
      name: "Ucayali",
      sortOrder: 250,
      provinces: [
        {
          slug: "coronel-portillo",
          name: "Coronel Portillo",
        },
        {
          slug: "atalaya",
          name: "Atalaya",
        },
        {
          slug: "padre-abad",
          name: "Padre Abad",
        },
        {
          slug: "purus",
          name: "Purus",
        },
      ],
    },
  ] as const;

export function buildDefaultCourierProvinces(
  catalog: readonly CourierProvinceCatalogEntry[],
): Array<{ slug: string; name: string; enabled: boolean }> {
  return catalog.map((entry) => ({
    slug: entry.slug,
    name: entry.name,
    enabled: false,
  }));
}

export function findCourierCatalogDepartment(name: string) {
  return (
    COURIER_DEPARTMENT_CATALOG.find((entry) => entry.name === name) ?? null
  );
}

export function listCourierCatalogDepartmentsNotInDb(
  existingNames: readonly string[],
) {
  const existing = new Set(existingNames.map((name) => name.toLowerCase()));
  return COURIER_DEPARTMENT_CATALOG.filter(
    (entry) => !existing.has(entry.name.toLowerCase()),
  );
}
