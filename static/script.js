const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");


// Search when Enter is pressed
searchInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        searchArticle();
    }
});


// Quick search buttons
function quickSearch(topic) {
    searchInput.value = topic;
    searchArticle();
}


// Main search function
async function searchArticle() {

    const topic = searchInput.value.trim();

    if (!topic) {
        alert("Please enter a topic.");
        return;
    }

    console.log("Searching:", topic);

    // Hide previous states
    document.getElementById("emptyState").style.display = "none";
    document.getElementById("notFound").style.display = "none";
    document.getElementById("articleView").style.display = "none";

    // Show loading
    const loading = document.getElementById("loading");

    if (loading) {
        loading.style.display = "block";
    }

    try {

        const response = await fetch(
            "/api/search?topic=" + encodeURIComponent(topic)
        );

        console.log("HTTP status:", response.status);

        const data = await response.json();

        console.log("API response:", data);


        // Article not found
        if (!data.success) {

            if (loading) {
                loading.style.display = "none";
            }

            document.getElementById("notFound").style.display = "block";

            document.getElementById("notFoundMessage").textContent =
                data.message || "Article not found.";

            return;
        }


        // Display article
        displayArticle(data);

    }

    catch (error) {

        console.error("Search error:", error);

        document.getElementById("notFound").style.display = "block";

        document.getElementById("notFoundMessage").textContent =
            "Unable to connect to the WikiConnect server.";

    }

    finally {

        if (loading) {
            loading.style.display = "none";
        }

    }
}


// Display article data
function displayArticle(data) {

    const article = data.article;

    console.log("Displaying article:", article);


    // Title
    const title =
        document.getElementById("articleTitle");

    if (title) {
        title.textContent =
            article.title || "Untitled Article";
    }


    // Description
    const description =
        document.getElementById("articleDescription");

    if (description) {
        description.textContent =
            article.description ||
            "No description available.";
    }


    // Summary
    const summary =
        document.getElementById("articleSummary");

    if (summary) {
        summary.textContent =
            article.summary ||
            "No summary available.";
    }


    // Language
    const language =
        document.getElementById("articleLanguage");

    if (language) {
        language.textContent =
            article.language ||
            "English";
    }


    // Wikipedia source
    const source =
        document.getElementById("sourceButton");

    if (source) {

        if (article.url) {

            source.href = article.url;
            source.style.display = "inline-block";

        } else {

            source.style.display = "none";

        }
    }


    // Quiz
    if (data.quiz) {

        const question =
            document.getElementById("quizQuestion");

        const answer =
            document.getElementById("quizAnswer");


        if (question) {
            question.textContent =
                data.quiz.question;
        }


        if (answer) {
            answer.textContent =
                "Answer: " + data.quiz.answer;
        }
    }


    // Related articles
    const relatedList =
        document.getElementById("relatedList");

    if (relatedList) {

        relatedList.innerHTML = "";

        if (
            data.related &&
            data.related.length > 0
        ) {

            data.related.forEach(function (item) {

                const div =
                    document.createElement("div");

                div.className = "related-item";

                const heading =
                    document.createElement("h3");

                heading.textContent =
                    item.title;

                const paragraph =
                    document.createElement("p");

                paragraph.textContent =
                    item.description || "";

                div.appendChild(heading);
                div.appendChild(paragraph);

                relatedList.appendChild(div);

            });

        } else {

            relatedList.textContent =
                "No related articles found.";

        }
    }


    // Hide empty state
    document.getElementById("emptyState").style.display =
        "none";


    // Show article
    document.getElementById("articleView").style.display =
        "block";


    // Scroll to article
    document.getElementById("articleView").scrollIntoView({
        behavior: "smooth"
    });
}


// Dataset status
const datasetStatus =
    document.getElementById("datasetStatus");

if (datasetStatus) {

    datasetStatus.textContent =
        "✓ Wikimedia dataset connected";

}