from flask import Flask, render_template, request, jsonify
import pandas as pd
import os

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, "data", "wikimedia_dataset.csv")

print("\n========================================")
print("WIKICONNECT DATA CHECK")
print("========================================")
print("Looking for:")
print(DATA_FILE)

if not os.path.exists(DATA_FILE):
    print("❌ FILE NOT FOUND")
    df = None
else:
    print("✅ FILE FOUND")

    try:
        df = pd.read_csv(DATA_FILE)

        print("Rows:", len(df))
        print("Columns:", list(df.columns))

        if "name" in df.columns:
            print("\nAVAILABLE ARTICLES:")
            print(df["name"].astype(str).tolist())

            nasa = df[
                df["name"]
                .astype(str)
                .str.strip()
                .str.lower()
                == "nasa"
            ]

            print("\nNASA TEST:")
            print("NASA records found:", len(nasa))

        else:
            print("❌ 'name' column does not exist")

    except Exception as e:
        print("❌ DATASET ERROR:")
        print(e)
        df = None

print("========================================\n")


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/search")
def search():

    topic = request.args.get("topic", "").strip()

    print(f"Search received: {topic}")

    if df is None:
        return jsonify({
            "success": False,
            "message": "Dataset failed to load."
        })

    if not topic:
        return jsonify({
            "success": False,
            "message": "Please enter a topic."
        })

    matches = df[
        df["name"]
        .astype(str)
        .str.contains(
            topic,
            case=False,
            na=False,
            regex=False
        )
    ]

    print("Matches:", len(matches))

    if matches.empty:
        return jsonify({
            "success": False,
            "message": f"Article not found for '{topic}'."
        })

    article = matches.iloc[0]

    description = str(article.get("description", ""))
    abstract = str(article.get("abstract", ""))

    if description == "nan":
        description = ""

    if abstract == "nan":
        abstract = ""

    summary = abstract if abstract else description

    return jsonify({
        "success": True,
        "article": {
            "title": str(article.get("name", "")),
            "description": description,
            "summary": summary,
            "url": str(article.get("url", "")),
            "language": str(article.get("in_language", "English"))
        }
    })


if __name__ == "__main__":
    app.run(
        debug=True,
        host="127.0.0.1",
        port=5000
    )