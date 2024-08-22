import json
from io import BytesIO

import prov.model as prov
from flask import Flask, request, send_file
from prov.dot import prov_to_dot

app = Flask(__name__)


@app.route("/", methods=["POST"])
def prov_graph():
    payload = request.get_json()
    prov_json = payload.get("prov", {})

    try:
        doc = prov.ProvDocument.deserialize(content=json.dumps(prov_json), format="json")
        dot = prov_to_dot(
            doc,
            show_nary=False,
            show_relation_attributes=False,
            show_element_attributes=False,
        )
    except Exception:
        return "Bad Request", 400

    return send_file(BytesIO(dot.create(format="png")), mimetype="image/png")


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
