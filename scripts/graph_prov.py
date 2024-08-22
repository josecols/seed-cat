import argparse

import prov.model as prov
from prov.dot import prov_to_dot


def main(json_file):
    with open(json_file, "r") as f:
        doc = prov.ProvDocument.deserialize(content=f.read(), format="json")
        dot = prov_to_dot(
            doc,
            show_nary=False,
            show_relation_attributes=False,
            show_element_attributes=False,
        )
        dot.set("dpi", "300")
        dot.write_png("prov.png")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Generate a graph image from a PROV-JSON file."
    )
    parser.add_argument("json_file", type=str, help="Path to the PROV-JSON file.")
    args = parser.parse_args()
    main(args.json_file)
