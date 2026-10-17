const fs = require("fs");
const path = require("path");

const CK = "https://api.cryptokitties.co/v3/kitties";
const OUT_DIR = path.join(__dirname, "data");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Fancy types (not exclusive / special edition). #1 counts even if that kitty is shiny.
// Kittypedia 110 + post-2021 types (Tarun and later).
const FANCY_SEARCH_KEYS = [
    "ellie", "dave", "holly", "catfrost", "abby", "dart", "boris", "mibbles",
    "reeves", "pickett", "joan", "starchild", "travis", "steel", "pawvril", "janis",
    "kunst", "kitiovanni", "hunter", "vince", "zelig", "billie", "bodhi", "cindi",
    "potricia", "cai", "missmatheson", "felis", "meuwn", "lilpurrfect", "mars",
    "cosmocat", "pepito", "chitten", "puuurrot", "shoopadoop", "bartholomeow",
    "gwendolion", "catseye", "skeletonne", "furmione", "purrzival", "jack",
    "pawderick", "robin", "kittyformerlyknownasprince", "djmeowlody", "poisonorchid",
    "catyrax", "catamari", "magmeow", "kitijira", "whisper", "curdlin", "krakitten",
    "furbeard", "glitter", "clover", "glasswalker", "ande", "al", "pizzazz",
    "misspurrfect", "squib", "tallythepurrocious", "genedough", "pawrula", "draco",
    "dracojunior", "dreggo", "pickles", "dukecat", "sheilapurren", "pawzilla",
    "meowstro", "atlas", "purrity", "squiddlesworth", "purrspero", "catbury",
    "lulu", "boot", "raspoutine", "kittypride", "furrmingo", "page",
    "schrödingerscat", "schrodingerscat", "chatplongeur", "docpurr", "swish",
    "flutterbee", "vernon", "berry", "pussforprogress", "fortunecat", "liondance",
    "dogcat", "tabby", "yuricatsuki", "misterpurrfect", "earnie", "momo-chan",
    "negato", "stitches", "phuziqaat", "santaclaws", "mistletoe", "dracula",
    "ducat", "shipcat", "tarun",
    "红包喵", "咚咚锵", "汪星爷",
];

async function getJson(url) {
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return res.json();
}

async function fetchFirstFancy(searchKey) {
    // Oldest kitty of this fancy type, shiny or otherwise — #1 is #1.
    const url = `${CK}?include=sale,sire,other&search=${encodeURIComponent(`fancy:${searchKey}`)}&orderBy=age&orderDirection=asc&limit=1`;
    const data = await getJson(url);
    const kitty = data.kitties && data.kitties[0];
    return { searchKey, total: data.total, exact: data.exact_total, kitty };
}

async function scrapeGrandmasters() {
    const rows = [];
    const missing = [];
    for (let i = 0; i < FANCY_SEARCH_KEYS.length; i++) {
        const key = FANCY_SEARCH_KEYS[i];
        process.stdout.write(`[${i + 1}/${FANCY_SEARCH_KEYS.length}] fancy:${key} `);
        try {
            const { kitty, total } = await fetchFirstFancy(key);
            if (!kitty) {
                console.log("NO RESULTS");
                missing.push(key);
            } else {
                const skip = kitty.is_exclusive || kitty.is_special_edition;
                const hatcher = (kitty.hatcher && kitty.hatcher.address) || null;
                console.log(
                    `#${kitty.id} type=${kitty.fancy_type} ranking=${kitty.fancy_ranking} kitty_type=${kitty.kitty_type} hatcher=${hatcher} skip=${skip} pool=${total}`
                );
                rows.push({
                    searchKey: key,
                    kittyId: kitty.id,
                    fancyType: kitty.fancy_type,
                    fancyRanking: kitty.fancy_ranking,
                    kittyType: kitty.kitty_type,
                    isExclusive: kitty.is_exclusive,
                    isSpecialEdition: kitty.is_special_edition,
                    hatcher,
                    hatcherNickname: kitty.hatcher && kitty.hatcher.nickname,
                    skip,
                });
            }
        } catch (err) {
            console.log("ERROR", err.message);
            missing.push(key);
        }
        await sleep(400);
    }
    return { rows, missing };
}

async function scrapeGilded() {
    const ids = [];
    const limit = 20;
    let offset = 0;
    let pages = 0;
    while (true) {
        const url = `${CK}?include=sale,sire,other&search=${encodeURIComponent("mewtation:gilded")}&orderBy=id&orderDirection=asc&limit=${limit}&offset=${offset}`;
        const data = await getJson(url);
        const batch = (data.kitties || []).map((k) => k.id);
        pages += 1;
        console.log(`gilded page ${pages} offset=${offset} got=${batch.length} reportedTotal=${data.total} exact=${data.exact_total} collected=${ids.length + batch.length}`);
        if (batch.length === 0) break;
        for (const id of batch) {
            if (!ids.includes(id)) ids.push(id);
        }
        if (batch.length < limit) break;
        offset += limit;
        await sleep(400);
        if (pages > 200) {
            console.log("stopping gilded scrape at 200 pages");
            break;
        }
    }
    ids.sort((a, b) => a - b);
    return ids;
}

async function main() {
    fs.mkdirSync(OUT_DIR, { recursive: true });

    const skipFancies = process.argv.includes("--gilded-only");
    let rows = [];
    let missing = [];
    if (skipFancies && fs.existsSync(path.join(OUT_DIR, "grandmasters.json"))) {
        const prev = JSON.parse(fs.readFileSync(path.join(OUT_DIR, "grandmasters.json"), "utf8"));
        rows = prev.all || [];
        console.log(`reusing ${rows.length} fancy rows from grandmasters.json`);
    } else {
        console.log("=== Grandmasters (#1 fancy hatchers, shiny or otherwise) ===");
        ({ rows, missing } = await scrapeGrandmasters());
    }
    const KITTY_CORE = "0x06012c8cf97bead5deae237070f9587f8e7a266d";
    const eligible = rows.filter(
        (r) =>
            r.fancyRanking === 1 &&
            (r.kittyType === "fancy" || r.kittyType === "shinyfancy") &&
            !r.isExclusive &&
            !r.isSpecialEdition &&
            r.hatcher &&
            r.hatcher.toLowerCase() !== KITTY_CORE
    );
    const uniqueHatchers = [...new Set(eligible.map((r) => r.hatcher.toLowerCase()))];

    console.log("\n=== Gilded kitty IDs ===");
    const gildedIds = await scrapeGilded();

    const summary = {
        gildedCount: gildedIds.length,
        gildedPurr: gildedIds.length * 100,
        grandmasterFancies: eligible.length,
        uniqueGrandmasterAddresses: uniqueHatchers.length,
        grandmasterPurrIfPerFancy: eligible.length * 1000,
        grandmasterPurrIfUniqueAddress: uniqueHatchers.length * 1000,
        totalIfUniqueAddresses: gildedIds.length * 100 + uniqueHatchers.length * 1000,
        totalIfPerFancy: gildedIds.length * 100 + eligible.length * 1000,
        missingSearchKeys: missing,
        skipped: rows.filter((r) => r.skip || r.fancyRanking !== 1),
        note: "Grandmasters are hatchers of ranking-1 of each fancy type (shiny counts). Unique addresses claim 1000 once.",
    };

    fs.writeFileSync(path.join(OUT_DIR, "grandmasters.json"), JSON.stringify({ eligible, all: rows, uniqueHatchers }, null, 2));
    fs.writeFileSync(path.join(OUT_DIR, "gilded.json"), JSON.stringify(gildedIds, null, 2));
    fs.writeFileSync(path.join(OUT_DIR, "claim2-summary.json"), JSON.stringify(summary, null, 2));

    console.log("\n=== SUMMARY ===");
    console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
