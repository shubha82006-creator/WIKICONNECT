/* =====================================
   WIKICONNECT
   WikiKnowledge Explorer
===================================== */

let records = [];

let currentArticle = null;

let currentFilter = "all";


/* =====================================
   ELEMENT HELPER
===================================== */

function $(id) {

    return document.getElementById(id);

}


/* =====================================
   NORMALIZE COLUMN NAMES
===================================== */

function normalizeKey(value) {

    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, "_");

}


/* =====================================
   CSV PARSER
===================================== */

function parseCSV(text) {

    const rows = [];

    let row = [];

    let cell = "";

    let insideQuotes = false;


    for (let i = 0; i < text.length; i++) {

        const character = text[i];

        const nextCharacter = text[i + 1];


        if (
            character === '"' &&
            insideQuotes &&
            nextCharacter === '"'
        ) {

            cell += '"';

            i++;

            continue;

        }


        if (character === '"') {

            insideQuotes = !insideQuotes;

            continue;

        }


        if (
            character === "," &&
            !insideQuotes
        ) {

            row.push(cell);

            cell = "";

            continue;

        }


        if (
            (character === "\n" ||
             character === "\r") &&
            !insideQuotes
        ) {

            if (
                character === "\r" &&
                nextCharacter === "\n"
            ) {

                i++;

            }


            row.push(cell);

            cell = "";


            if (
                row.some(
                    value =>
                    value.trim() !== ""
                )
            ) {

                rows.push(row);

            }


            row = [];

            continue;

        }


        cell += character;

    }


    if (
        cell !== "" ||
        row.length
    ) {

        row.push(cell);

        if (
            row.some(
                value =>
                value.trim() !== ""
            )
        ) {

            rows.push(row);

        }

    }


    if (!rows.length) {

        return [];

    }


    const headers =
        rows[0].map(normalizeKey);


    return rows
        .slice(1)
        .map(row => {

            const object = {};

            headers.forEach(
                (header, index) => {

                    object[header] =
                        (row[index] || "")
                        .trim();

                }
            );

            return object;

        });

}


/* =====================================
   FIND COLUMN
===================================== */

function findColumn(object, possibleNames) {

    const keys =
        Object.keys(object);


    for (
        const name of possibleNames
    ) {

        const normalized =
            normalizeKey(name);


        const exact =
            keys.find(
                key =>
                key === normalized
            );


        if (exact) {

            return exact;

        }

    }


    return null;

}


/* =====================================
   FIELD DEFINITIONS
===================================== */

const fields = {

    people: [
        "people",
        "persons",
        "person"
    ],

    organizations: [
        "organizations",
        "organization",
        "orgs"
    ],

    places: [
        "places",
        "place",
        "locations",
        "location"
    ],

    topics: [
        "topics",
        "categories",
        "category"
    ],

    related: [
        "related_articles",
        "related articles",
        "related",
        "links",
        "internal_links"
    ]

};


/* =====================================
   GET VALUES
===================================== */

function getValues(article, type) {

    const column =
        findColumn(
            article,
            fields[type]
        );


    if (!column) {

        return [];

    }


    const value =
        article[column];


    if (
        !value ||
        value === "null" ||
        value === "undefined"
    ) {

        return [];

    }


    return value
        .split(/\s*;\s*|\s*\|\s*|\n+/)
        .map(
            value =>
            value.trim()
        )
        .filter(
            value =>
            value !== ""
        );

}


/* =====================================
   GET TITLE
===================================== */

function getTitle(article) {

    const column =
        findColumn(
            article,
            [
                "title",
                "name",
                "article",
                "article_title"
            ]
        );


    return column
        ? article[column]
        : "";

}


/* =====================================
   GET SUMMARY
===================================== */

function getSummary(article) {

    const column =
        findColumn(
            article,
            [
                "summary",
                "abstract",
                "description",
                "text"
            ]
        );


    return column
        ? article[column]
        : "";

}


/* =====================================
   GET URL
===================================== */

function getURL(article) {

    const column =
        findColumn(
            article,
            [
                "url",
                "wiki_url",
                "link"
            ]
        );


    return column
        ? article[column]
        : "";

}


/* =====================================
   SEARCH
===================================== */

function searchArticles(query) {

    query =
        query
        .trim()
        .toLowerCase();


    if (!query) {

        return [];

    }


    return records
        .map(
            (article, index) => {

                const title =
                    getTitle(article)
                    .toLowerCase();


                const summary =
                    getSummary(article)
                    .toLowerCase();


                let score = 0;


                if (
                    title === query
                ) {

                    score = 100;

                }

                else if (
                    title.startsWith(query)
                ) {

                    score = 85;

                }

                else if (
                    title.includes(query)
                ) {

                    score = 70;

                }

                else if (
                    summary.includes(query)
                ) {

                    score = 30;

                }


                return {

                    article,
                    index,
                    score

                };

            }
        )

        .filter(
            result =>
            result.score > 0
        )

        .sort(
            (a,b) =>
            b.score - a.score
        );

}


/* =====================================
   ESCAPE HTML
===================================== */

function escapeHTML(value) {

    return String(value || "")
        .replace(
            /[&<>"']/g,
            character => {

                const map = {

                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#039;"

                };

                return map[character];

            }
        );

}


/* =====================================
   DISPLAY ARTICLE
===================================== */

function displayArticle(article) {

    currentArticle = article;


    $("emptyState")
        .classList
        .add("hidden");


    $("notFound")
        .classList
        .add("hidden");


    $("articleView")
        .classList
        .remove("hidden");


    const title =
        getTitle(article);


    const summary =
        getSummary(article);


    const url =
        getURL(article);


    $("articleTitle")
        .textContent =
        title || "Untitled Article";


    $("articleSummary")
        .textContent =
        summary ||
        "No summary available in the dataset.";


    $("articleDescription")
        .textContent =
        "Structured information available in the Wikimedia dataset.";


    if (url) {

        $("sourceButton")
            .href = url;

        $("sourceButton")
            .classList
            .remove("hidden");

    }

    else {

        $("sourceButton")
            .classList
            .add("hidden");

    }


    buildInformationCards(article);


    buildRelatedArticles(article);


    buildGraph(article);


    updateCounts(article);


    applyFilter();

}


/* =====================================
   INFORMATION CARDS
===================================== */

function buildInformationCards(article) {

    const container =
        $("cards");


    container.innerHTML = "";


    const categories = [

        {
            type: "people",
            title: "People",
            icon: "◎"
        },

        {
            type: "organizations",
            title: "Organizations",
            icon: "▣"
        },

        {
            type: "places",
            title: "Places",
            icon: "⌖"
        },

        {
            type: "topics",
            title: "Topics",
            icon: "◇"
        }

    ];


    categories.forEach(
        category => {

            const values =
                [
                    ...new Set(
                        getValues(
                            article,
                            category.type
                        )
                    )
                ];


            let tags = "";


            if (values.length) {

                tags =
                    values
                    .map(
                        value => `

                            <button
                                class="tag"
                                data-query="${escapeHTML(value)}">

                                ${escapeHTML(value)}

                            </button>

                        `
                    )
                    .join("");

            }

            else {

                tags = `

                    <span class="tag">

                        No data available

                    </span>

                `;

            }


            container.innerHTML += `

                <div
                    class="info-card"
                    data-type="${category.type}">

                    <div class="card-top">

                        <div class="card-title">

                            ${category.icon}

                            ${category.title}

                        </div>


                        <span class="card-count">

                            ${values.length}

                        </span>

                    </div>


                    <div class="tag-list">

                        ${tags}

                    </div>

                </div>

            `;

        }
    );

}


/* =====================================
   RELATED ARTICLES
===================================== */

function buildRelatedArticles(article) {

    const container =
        $("relatedList");


    const related =
        [
            ...new Set(
                getValues(
                    article,
                    "related"
                )
            )
        ];


    if (!related.length) {

        container.innerHTML = `

            <div class="related-item">

                <span>
                    No related articles available
                    in this dataset record.
                </span>

            </div>

        `;

        return;

    }


    container.innerHTML =
        related
        .map(
            articleName => `

                <button
                    class="related-item"
                    data-query="${escapeHTML(articleName)}">

                    <span>

                        ${escapeHTML(articleName)}

                    </span>

                    <small>
                        Explore →
                    </small>

                </button>

            `
        )
        .join("");

}


/* =====================================
   UPDATE COUNTS
===================================== */

function updateCounts(article) {

    const people =
        getValues(
            article,
            "people"
        );


    const organizations =
        getValues(
            article,
            "organizations"
        );


    const places =
        getValues(
            article,
            "places"
        );


    const topics =
        getValues(
            article,
            "topics"
        );


    const related =
        getValues(
            article,
            "related"
        );


    $("peopleCount")
        .textContent =
        people.length;


    $("organizationCount")
        .textContent =
        organizations.length;


    $("placeCount")
        .textContent =
        places.length;


    $("topicCount")
        .textContent =
        topics.length;


    $("relatedCount")
        .textContent =
        related.length;


    $("allCount")
        .textContent =
        people.length +
        organizations.length +
        places.length +
        topics.length +
        related.length;

}


/* =====================================
   GRAPH
===================================== */

function buildGraph(article) {

    const graph =
        $("graph");


    graph.innerHTML =
        `<canvas id="graphCanvas"></canvas>`;


    const canvas =
        $("graphCanvas");


    const width =
        graph.clientWidth;


    const height =
        graph.clientHeight;


    const ratio =
        window.devicePixelRatio || 1;


    canvas.width =
        width * ratio;


    canvas.height =
        height * ratio;


    canvas.style.width =
        width + "px";


    canvas.style.height =
        height + "px";


    const context =
        canvas.getContext("2d");


    context.scale(
        ratio,
        ratio
    );


    const title =
        getTitle(article);


    let connections = [];


    ["people",
     "organizations",
     "places",
     "topics"]
        .forEach(
            type => {

                getValues(
                    article,
                    type
                )
                .forEach(
                    value => {

                        connections.push({

                            label: value,
                            type: type

                        });

                    }
                );

            }
        );


    getValues(
        article,
        "related"
    )
    .forEach(
        value => {

            connections.push({

                label: value,
                type: "related"

            });

        }
    );


    connections =
        connections.slice(
            0,
            25
        );


    if (!connections.length) {

        context.fillStyle =
            "#71839b";

        context.textAlign =
            "center";

        context.font =
            "13px DM Sans";

        context.fillText(
            "No relationships available in this dataset record.",
            width / 2,
            height / 2
        );

        return;

    }


    const nodes = [

        {
            label: title,
            type: "root",
            x: width / 2,
            y: height / 2,
            radius: 31
        }

    ];


    connections.forEach(
        (connection, index) => {

            const angle =
                (
                    Math.PI * 2 *
                    index /
                    connections.length
                )
                -
                Math.PI / 2;


            const radius =
                Math.min(
                    width,
                    height
                ) * 0.34;


            nodes.push({

                ...connection,

                x:
                    width / 2 +
                    Math.cos(angle) *
                    radius,

                y:
                    height / 2 +
                    Math.sin(angle) *
                    radius,

                radius:
                    18

            });

        }
    );


    const colors = {

        root: "#4f8cff",

        people: "#4fd1a5",

        organizations: "#9b7cff",

        places: "#f0a35b",

        topics: "#50b9d6",

        related: "#7187a8"

    };


    /* CONNECTION LINES */

    nodes.slice(1)
        .forEach(
            node => {

                context.beginPath();

                context.moveTo(
                    nodes[0].x,
                    nodes[0].y
                );

                context.lineTo(
                    node.x,
                    node.y
                );

                context.strokeStyle =
                    "rgba(120,150,200,.22)";

                context.lineWidth = 1;

                context.stroke();

            }
        );


    /* NODES */

    nodes.forEach(
        node => {

            context.beginPath();

            context.arc(
                node.x,
                node.y,
                node.radius,
                0,
                Math.PI * 2
            );


            context.fillStyle =
                colors[node.type];


            context.fill();


            context.font =
                node.type === "root"
                ? "700 11px DM Sans"
                : "600 10px DM Sans";


            context.fillStyle =
                "#ffffff";


            context.textAlign =
                "center";


            context.textBaseline =
                "middle";


            let label =
                node.label;


            const limit =
                node.type === "root"
                ? 25
                : 18;


            if (
                label.length > limit
            ) {

                label =
                    label.substring(
                        0,
                        limit - 1
                    )
                    + "…";

            }


            context.fillText(
                label,
                node.x,
                node.y
            );

        }
    );

}


/* =====================================
   FILTER
===================================== */

function applyFilter() {

    document
        .querySelectorAll(
            ".info-card"
        )
        .forEach(
            card => {

                if (
                    currentFilter === "all" ||
                    currentFilter ===
                    card.dataset.type
                ) {

                    card.style.display =
                        "block";

                }

                else {

                    card.style.display =
                        "none";

                }

            }
        );


    $("relatedList").style.display =

        (
            currentFilter === "all" ||
            currentFilter === "related"
        )

        ? "grid"

        : "none";

}


/* =====================================
   PERFORM SEARCH
===================================== */

function performSearch(query) {

    const results =
        searchArticles(query);


    $("suggestions")
        .innerHTML = "";


    if (!results.length) {

        $("emptyState")
            .classList
            .add("hidden");


        $("articleView")
            .classList
            .add("hidden");


        $("notFound")
            .classList
            .remove("hidden");


        return;

    }


    displayArticle(
        results[0].article
    );

}


/* =====================================
   SEARCH SUGGESTIONS
===================================== */

function showSuggestions() {

    const query =
        $("searchInput")
        .value
        .trim();


    if (!query) {

        $("suggestions")
            .innerHTML = "";

        return;

    }


    const results =
        searchArticles(query)
        .slice(0, 5);


    $("suggestions")
        .innerHTML =


        results
        .map(
            result => `

                <button
                    class="suggestion"
                    data-query="${escapeHTML(
                        getTitle(
                            result.article
                        )
                    )}">

                    ${escapeHTML(
                        getTitle(
                            result.article
                        )
                    )}

                </button>

            `
        )
        .join("");

}


/* =====================================
   LOAD DATASET
===================================== */

async function loadDataset() {

    try {

        const response =
            await fetch(
                "data/wikimedia_dataset.csv"
            );


        if (!response.ok) {

            throw new Error(
                "Dataset not found"
            );

        }


        const csv =
            await response.text();


        records =
            parseCSV(csv);


        if (!records.length) {

            throw new Error(
                "Dataset is empty"
            );

        }


        $("datasetStatus")
            .textContent =
            `${records.length.toLocaleString()} dataset records loaded`;


    }

    catch (error) {

        $("datasetStatus")
            .textContent =
            "Dataset not loaded. Use Load CSV to select your Wikimedia dataset.";

    }

}


/* =====================================
   SEARCH BUTTON
===================================== */

$("searchButton")
    .addEventListener(
        "click",
        () => {

            performSearch(
                $("searchInput").value
            );

        }
    );


/* =====================================
   ENTER KEY
===================================== */

$("searchInput")
    .addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {

                performSearch(
                    event.target.value
                );

            }

        }
    );


/* =====================================
   LIVE SUGGESTIONS
===================================== */

$("searchInput")
    .addEventListener(
        "input",
        showSuggestions
    );


/* =====================================
   CSV UPLOAD
===================================== */

$("csvInput")
    .addEventListener(
        "change",
        async event => {

            const file =
                event.target.files[0];


            if (!file) {

                return;

            }


            const text =
                await file.text();


            records =
                parseCSV(text);


            $("datasetStatus")
                .textContent =
                `${records.length.toLocaleString()} records loaded from ${file.name}`;

        }
    );


/* =====================================
   QUICK BUTTONS
===================================== */

document
    .querySelectorAll(
        "[data-query]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const query =
                        button.dataset.query;


                    $("searchInput")
                        .value =
                        query;


                    performSearch(
                        query
                    );


                    $("articleView")
                        .scrollIntoView({
                            behavior: "smooth",
                            block: "start"
                        });

                }
            );

        }
    );


/* =====================================
   DYNAMIC BUTTONS
===================================== */

document.addEventListener(
    "click",
    event => {

        const element =
            event.target.closest(
                "[data-query]"
            );


        if (
            !element ||
            element.classList.contains(
                "quick-button"
            )
        ) {

            return;

        }


        const query =
            element.dataset.query;


        $("searchInput")
            .value =
            query;


        performSearch(
            query
        );

    }
);


/* =====================================
   SIDEBAR FILTER
===================================== */

document
    .querySelectorAll(
        ".sidebar-item"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".sidebar-item"
                        )
                        .forEach(
                            item =>
                            item.classList
                                .remove("active")
                        );


                    button
                        .classList
                        .add("active");


                    currentFilter =
                        button.dataset.filter;


                    applyFilter();

                }
            );

        }
);


/* =====================================
   START
===================================== */

loadDataset();