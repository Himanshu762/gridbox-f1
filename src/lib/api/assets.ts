// 2026 F1 Season — Static image URL mappings

const DRIVER_BASE = "https://media.formula1.com/image/upload/c_lfill,w_440/q_auto/d_common:f1:2026:fallback:driver:2026fallbackdriverright.webp/v1740000000/common/f1/2026";
const CAR_BASE = "https://media.formula1.com/image/upload/c_lfill,h_224/q_auto/d_common:f1:2026:fallback:car:2026fallbackcarright.webp/v1740000000/common/f1/2026";

export const DRIVER_PORTRAITS: Record<string, string> = {
    // Red Bull Racing
    "VER": `${DRIVER_BASE}/redbullracing/maxver01/2026redbullracingmaxver01right.webp`,
    "HAD": `${DRIVER_BASE}/redbullracing/isahad01/2026redbullracingisahad01right.webp`,
    // McLaren
    "NOR": `${DRIVER_BASE}/mclaren/lannor01/2026mclarenlannor01right.webp`,
    "PIA": `${DRIVER_BASE}/mclaren/oscpia01/2026mclarenoscpia01right.webp`,
    // Ferrari
    "LEC": `${DRIVER_BASE}/ferrari/chalec01/2026ferrarichalec01right.webp`,
    "HAM": `${DRIVER_BASE}/ferrari/lewham01/2026ferrarilewham01right.webp`,
    // Mercedes
    "RUS": `${DRIVER_BASE}/mercedes/georus01/2026mercedesgeorus01right.webp`,
    "ANT": `${DRIVER_BASE}/mercedes/andant01/2026mercedesandant01right.webp`,
    // Aston Martin
    "ALO": `${DRIVER_BASE}/astonmartin/feralo01/2026astonmartinferalo01right.webp`,
    "STR": `${DRIVER_BASE}/astonmartin/lanstr01/2026astonmartinlanstr01right.webp`,
    // Alpine
    "GAS": `${DRIVER_BASE}/alpine/piegas01/2026alpinepiegas01right.webp`,
    "COL": `${DRIVER_BASE}/alpine/fracol01/2026alpinefracol01right.webp`,
    // Williams
    "SAI": `${DRIVER_BASE}/williams/carsai01/2026williamscarsai01right.webp`,
    "ALB": `${DRIVER_BASE}/williams/alealb01/2026williamsalealb01right.webp`,
    // Racing Bulls
    "LAW": `${DRIVER_BASE}/racingbulls/lialaw01/2026racingbullslialaw01right.webp`,
    "LIN": `${DRIVER_BASE}/racingbulls/arvlin01/2026racingbullsarvlin01right.webp`,
    // Audi
    "HUL": `${DRIVER_BASE}/audi/nichul01/2026audinichul01right.webp`,
    "BOR": `${DRIVER_BASE}/audi/gabbor01/2026audigabbor01right.webp`,
    // Haas
    "OCO": `${DRIVER_BASE}/haasf1team/estoco01/2026haasf1teamestoco01right.webp`,
    "BEA": `${DRIVER_BASE}/haasf1team/olibea01/2026haasf1teamolibea01right.webp`,
    // Cadillac
    "PER": `${DRIVER_BASE}/cadillac/serper01/2026cadillacserper01right.webp`,
    "BOT": `${DRIVER_BASE}/cadillac/valbot01/2026cadillacvalbot01right.webp`,
    // Fallback
    "generic": "https://media.formula1.com/image/upload/c_lfill,w_440/q_auto/d_common:f1:2026:fallback:driver:2026fallbackdriverright.webp/v1740000000/common/f1/2026/fallback/2026fallbackdriverright.webp"
};

export const TEAM_CARS: Record<string, string> = {
    "red_bull": `${CAR_BASE}/redbullracing/2026redbullracingcarright.webp`,
    "mclaren": `${CAR_BASE}/mclaren/2026mclarencarright.webp`,
    "ferrari": `${CAR_BASE}/ferrari/2026ferraricarright.webp`,
    "mercedes": `${CAR_BASE}/mercedes/2026mercedescarright.webp`,
    "aston_martin": `${CAR_BASE}/astonmartin/2026astonmartincarright.webp`,
    "alpine": `${CAR_BASE}/alpine/2026alpinecarright.webp`,
    "williams": `${CAR_BASE}/williams/2026williamscarright.webp`,
    "rb": `${CAR_BASE}/racingbulls/2026racingbullscarright.webp`,
    "racing_bulls": `${CAR_BASE}/racingbulls/2026racingbullscarright.webp`,
    "audi": `${CAR_BASE}/audi/2026audicarright.webp`,
    "sauber": `${CAR_BASE}/audi/2026audicarright.webp`,
    "kick_sauber": `${CAR_BASE}/audi/2026audicarright.webp`,
    "haas": `${CAR_BASE}/haasf1team/2026haasf1teamcarright.webp`,
    "cadillac": `${CAR_BASE}/cadillac/2026cadillaccarright.webp`,
    "generic": `${CAR_BASE}/fallback/2026fallbackcarright.webp`
};

const TRACK_BASE = "https://media.formula1.com/image/upload/f_auto/q_auto/v1677244985/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3";

export const TRACK_MAPS: Record<string, string> = {
    // Middle East
    "bahrain": `${TRACK_BASE}/Bahrain.png`,
    "jeddah": `${TRACK_BASE}/Saudi%20Arabia.png`,
    "saudi_arabia": `${TRACK_BASE}/Saudi%20Arabia.png`,
    "losail": `${TRACK_BASE}/Qatar.png`,
    "qatar": `${TRACK_BASE}/Qatar.png`,
    "yas_marina": `${TRACK_BASE}/Abu%20Dhabi.png`,
    "abu_dhabi": `${TRACK_BASE}/Abu%20Dhabi.png`,
    // Asia-Pacific
    "albert_park": `${TRACK_BASE}/Australia.png`,
    "australia": `${TRACK_BASE}/Australia.png`,
    "suzuka": `${TRACK_BASE}/Japan.png`,
    "japan": `${TRACK_BASE}/Japan.png`,
    "shanghai": `${TRACK_BASE}/China.png`,
    "china": `${TRACK_BASE}/China.png`,
    "marina_bay": `${TRACK_BASE}/Singapore.png`,
    "singapore": `${TRACK_BASE}/Singapore.png`,
    // Americas
    "miami": `${TRACK_BASE}/Miami.png`,
    "rodriguez": `${TRACK_BASE}/Mexico.png`,
    "mexico": `${TRACK_BASE}/Mexico.png`,
    "interlagos": `${TRACK_BASE}/Brazil.png`,
    "brazil": `${TRACK_BASE}/Brazil.png`,
    "americas": `${TRACK_BASE}/USA.png`,
    "austin": `${TRACK_BASE}/USA.png`,
    "las_vegas": `${TRACK_BASE}/Las%20Vegas.png`,
    "villeneuve": `${TRACK_BASE}/Canada.png`,
    "canada": `${TRACK_BASE}/Canada.png`,
    "montreal": `${TRACK_BASE}/Canada.png`,
    // Europe
    "monaco": `${TRACK_BASE}/Monaco.png`,
    "silverstone": `${TRACK_BASE}/Great%20Britain.png`,
    "great_britain": `${TRACK_BASE}/Great%20Britain.png`,
    "spa": `${TRACK_BASE}/Belgium.png`,
    "belgium": `${TRACK_BASE}/Belgium.png`,
    "monza": `${TRACK_BASE}/Italy.png`,
    "italy": `${TRACK_BASE}/Italy.png`,
    "imola": `${TRACK_BASE}/Emilia%20Romagna.png`,
    "emilia_romagna": `${TRACK_BASE}/Emilia%20Romagna.png`,
    "catalunya": `${TRACK_BASE}/Spain.png`,
    "spain": `${TRACK_BASE}/Spain.png`,
    "red_bull_ring": `${TRACK_BASE}/Austria.png`,
    "austria": `${TRACK_BASE}/Austria.png`,
    "hungaroring": `${TRACK_BASE}/Hungary.png`,
    "hungary": `${TRACK_BASE}/Hungary.png`,
    "zandvoort": `${TRACK_BASE}/Netherlands.png`,
    "netherlands": `${TRACK_BASE}/Netherlands.png`,
    "baku": `${TRACK_BASE}/Azerbaijan.png`,
    "azerbaijan": `${TRACK_BASE}/Azerbaijan.png`,
    // Fallback
    "generic": `${TRACK_BASE}/Italy.png`,
};
