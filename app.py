from flask import Flask, render_template, request
from TrainPinecone import ask_openai_with_context

app = Flask(__name__)


@app.route("/", methods=["GET", "POST"])
def index():
    user_input = ""
    if request.method == "POST":
        # Get input from the user via POST request
        user_input = request.form.get("user_input", "")
        output = ask_openai_with_context(user_input)
    # Render the web page
    return render_template("index.html", user_input=output)
