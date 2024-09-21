import argparse

import prov.model as prov
from prov.dot import prov_to_dot


def main(json_file, output_format):
    with open(json_file, "r") as f:
        doc = prov.ProvDocument.deserialize(content=f.read(), format="json")
        dot = prov_to_dot(
            doc,
            show_nary=False,
            show_relation_attributes=False,
            show_element_attributes=False,
        )
        dot.set("dpi", "300")

        output_file = f"prov.{output_format}"

        if output_format in ["png", "pdf", "svg"]:
            getattr(dot, f"write_{output_format}")(output_file)
        else:
            raise ValueError(f"Unsupported output format: {output_format}")

        print(f"Graph saved as {output_file}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Generate a graph image from a PROV-JSON file."
    )
    parser.add_argument("json_file", type=str, help="Path to the PROV-JSON file.")
    parser.add_argument(
        "-f", "--format",
        type=str,
        choices=["png", "pdf", "svg"],
        default="pdf",
        help="Output format (default: pdf)"
    )
    args = parser.parse_args()
    main(args.json_file, args.format)
