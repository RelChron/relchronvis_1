# Import data from csv, serve pages and data requests
from flask import Flask, render_template, send_file, request
from collections import Counter
from typing import OrderedDict
from pathlib import Path
import json, csv, os

# This should run only when deployed. Running this script directly changes 
# the working directory.
BASE_DIR = Path(os.getcwd()) / "relchron_1"

app = Flask(__name__)

@app.route("/")
def landing():
    return render_template("landing.html.jinja")

@app.route("/arc_diagram", methods=["GET"])
def arc_diagram():
    language = request.args.get("lang")
    data = {"diagram_type": "arc_diagram"}
    if language == "Russian":
        data["language"] = "Russian"
        try:
            oldest_variety, newest_variety = get_abbr("data/examples_ru.csv")
        except FileNotFoundError as e:
            data["error"] = ("Error getting Russian language varieties:", str(e))
            oldest_variety, newest_variety = "", ""

        data["oldest_variety"] = oldest_variety
        data["newest_variety"] = newest_variety
    elif language == "Croatian":
        data["language"] = "Croatian"
        try:
            oldest_variety, newest_variety = get_abbr("data/examples_hr.csv")
        except FileNotFoundError as e:
            data["error"] = ("Error getting Croatian language varieties from 'data/examples_hr.csv'", e.strerror)
            oldest_variety, newest_variety = "", ""

        data["oldest_variety"] = oldest_variety
        data["newest_variety"] = newest_variety
    else:
        data["error"] = ("Error parsing language for arc diagram", "")

    return render_template("arc_diagram.html.jinja", data=data)

@app.route("/chord_diagram", methods=["GET"])
def chord_diagram():
    language = request.args.get("lang")
    data = {"diagram_type": "chord_diagram"}
    if language == "Russian":
        data["language"] = "Russian"
        try:
            oldest_variety, newest_variety = get_abbr("data/examples_ru.csv")
        except FileNotFoundError as e:
            data["error"] = ("Error getting Russian language varieties from 'data/examples_ru.csv'", e.strerror)
            oldest_variety, newest_variety = "", ""

        data["oldest_variety"] = oldest_variety
        data["newest_variety"] = newest_variety
    elif language == "Croatian":
        data["language"] = "Croatian"
        try:
            oldest_variety, newest_variety = get_abbr("data/examples_hr.csv")
        except FileNotFoundError as e:
            data["error"] = ("Error getting Croatian language varieties from 'data/examples_hr.csv'", e.strerror)
            oldest_variety, newest_variety = "", ""

        data["oldest_variety"] = oldest_variety
        data["newest_variety"] = newest_variety
    else:
        data["error"] = ("Error parsing language for chord diagram", "")

    return render_template("chord_diagram.html.jinja", data=data)

@app.route('/sound_changes', methods=["GET"])
def give_sc_data():
    language = request.args.get("lang")
    if language == "Russian":
        if Path(BASE_DIR / "data/data_ru.json").exists():
            return send_file("data/data_ru.json")
        else:
            return {"error": ("Error getting Russian sound change data",
                    "File 'data/data_ru.json' does not exist")}
    elif language == "Croatian":
        if Path(BASE_DIR / "data/data_hr.json").exists():
            return send_file("data/data_hr.json")
        else:
            return {"error": ("Error getting Croatian sound change data",
                    "File 'data/data_hr.json' does not exist")}

@app.route('/examples', methods=["GET"])
def give_example_data():
    language = request.args.get("lang")
    if language == "Russian":
        if Path(BASE_DIR / "data/examples_ru.json").exists():
            return send_file("data/examples_ru.json")
        else:
            return {"error": ("Error getting Russian example data",
                    "File 'data/examples_ru.json' does not exist")}
    elif language == "Croatian":
        if Path(BASE_DIR / "data/examples_hr.json").exists():
            return send_file("data/examples_hr.json")
        else:
            return {"error": ("Error getting Croatian example data",
                    "File 'data/examples_hr.json' does not exist")}
    else:
        return {"error": "Error getting example data"}

@app.route("/matrix", methods=["GET"])
def give_matrix_data():
    language = request.args.get("lang")
    if language == "Russian":
        if Path(BASE_DIR / "data/matrix_ru.json").exists():
            return send_file("data/matrix_ru.json")
        else:
            return {"error": ("Error getting Russian matrix data",
                    "File 'data/matrix_ru.json' does not exist")}
    elif language == "Croatian":
        if Path(BASE_DIR / "data/matrix_hr.json").exists():
            return send_file("data/matrix_hr.json")
        else:
            return {"error": ("Error getting Croatian matrix data",
                    "File 'data/matrix_hr.json' does not exist")}
    else:
        return {"error": "Error getting matrix data"}

@app.route('/sc_template', methods=["GET"])
def give_sc_template():
    return send_file("data/sound_changes_ru.csv")

@app.route('/ex_template', methods=["GET"])
def give_ex_template():
    return send_file("data/examples_ru.csv")

@app.route('/rel_template', methods=["GET"])
def give_rel_template():
    return send_file("data/relations_ru.csv")

def import_csv_sound_changes(sc_infile_path, relations_infile_path, 
                             outfile_path, matrix_outfile_path, 
                             n_of_sound_changes):
    # with open(sc_infile_path, encoding="utf-8-sig") as sc_infile:
    with (open(sc_infile_path, encoding="utf-8-sig") as sc_infile,
          open(relations_infile_path, encoding="utf-8-sig") as rel_infile):
        out_dict = OrderedDict({
            "changes": list(csv.DictReader(sc_infile, dialect="excel")), 
            "relations": list(csv.DictReader(rel_infile, dialect="excel"))
        })

        # Convert some strings to ints and booleans
        for sc in out_dict["changes"]:
            sc["id"] = int(sc["id"])

        for relation in out_dict["relations"]:
            relation["source"] = int(relation["source"])
            relation["target"] = int(relation["target"])
            if relation["confident"] == "TRUE":
                relation["confident"] = True
            elif relation["confident"] == "FALSE":
                relation["confident"] = False

    with open(outfile_path, mode="w+", encoding="utf-8") as outfile:
        outfile.write(json.dumps(out_dict))

    # Save matrix needed for chord diagram
    matrix = []
    # For each sound change...
    for sc in out_dict["changes"]:
        matrix_row = []
        connected_ids = set()
        # Make default dict that sets everything to 0 probably
        multi_connected_ids = Counter()

        # ...check relations and get all connections...
        for relation in out_dict["relations"]:
            if relation["source"] == sc["id"]:
                # If we're looking at a double relation
                if relation["target"] in connected_ids:
                    # print(f"Double relation found: {relation['source']}-{relation['target']}")
                    # double_connected_ids.add(relation["source"])
                    # I think it will work if I only add this

                    # Add +1 to multi_connected_ids entry
                    # Add an extra count if at 0, because the smallest 
                    # "multi connection" is 2
                    if multi_connected_ids[relation["target"]] == 0:
                        multi_connected_ids[relation["target"]] += 1
                    multi_connected_ids[relation["target"]] += 1
                connected_ids.add(relation["target"])

            if relation["target"] == sc["id"]:
                if relation["source"] in connected_ids:
                    # print(f"Double relation found: {relation['source']}-{relation['target']}")
                    if multi_connected_ids[relation["source"]] == 0:
                        multi_connected_ids[relation["source"]] += 1
                    multi_connected_ids[relation["source"]] += 1
                connected_ids.add(relation["source"])

            # MAYBE: check if the current source and target are both already in connected_ids
            # Does this hold true only for double relations, as I am assuming?

            # if ((relation["source"] in connected_ids) 
            #         and (relation["target"] in connected_ids)):
            #     print(f"Double relation found: {relation['source']}-{relation['target']}")

            # BUT: I need to know in which place to place the 2 instead of the 1.
            # In some cases I will need to place multiple 2s.

            # Do I always add target and source?
            # If I do, the "origin" of any sc connected to other sc's by double relation will be 2
            # I think the answer is "yes". Actually, I changed it now, to follow how the 1's work.

        # ...and add 1s in the corresponding place in the matrix row.
        for i in range(1, len(out_dict["changes"]) + 1):
            if i in multi_connected_ids:
                matrix_row.append(multi_connected_ids[i])
            elif i in connected_ids:
                matrix_row.append(1)
            else:
                matrix_row.append(0)

        matrix.append(matrix_row)
    
    with open(matrix_outfile_path, mode="w+", encoding="utf-8") as outfile:
        outfile.write(json.dumps(matrix))

def import_csv_examples(infile_path, outfile_path):
    out_list = []
    # "utf-8-sig" removes the BOM at the beginning of file (added by Excel). 
    # Unsure if this will cause problems with files that don't have a BOM. 
    with open(infile_path, encoding="utf-8-sig") as infile:
        # Default reader takes field names from first row 
        csv_reader = csv.DictReader(infile, dialect="excel")
        for row in csv_reader:
            example = OrderedDict()
            for field in row:
                if row[field] != "":
                    example[field] = row[field]
            out_list.append(example)
    
    with open(outfile_path, mode="w+", encoding="utf-8") as outfile:
        # outfile.write(json.dumps(out_list, sort_keys=True))
        outfile.write(json.dumps(out_list))

def get_abbr(examples_file_path):
    absolute_path = BASE_DIR / examples_file_path
    with absolute_path.open(encoding="utf-8-sig", newline="") as infile:
        first_row = next(csv.reader(infile, dialect="excel"))
        oldest_variety = first_row[1]
        newest_variety = first_row[0]
    
    return oldest_variety, newest_variety


if __name__ == "__main__":
    # When running directly, cwd == base dir (as opposed to on pythonanywhere)
    BASE_DIR = Path(os.getcwd())
    import_csv_sound_changes(
        sc_infile_path = "data/sound_changes_hr.csv", 
        relations_infile_path = "data/relations_hr.csv", 
        outfile_path = "data/data_hr.json", 
        matrix_outfile_path = "data/matrix_hr.json",
        n_of_sound_changes = 71
    )
    import_csv_sound_changes(
        sc_infile_path = "data/sound_changes_ru.csv", 
        relations_infile_path = "data/relations_ru.csv", 
        outfile_path = "data/data_ru.json", 
        matrix_outfile_path = "data/matrix_ru.json",
        n_of_sound_changes = 71
    )
    # import_csv_examples(
    #     infile_path = "data/examples_hr.csv",
    #     outfile_path = "data/examples_hr.json"
    # )
    # import_csv_examples(
    #     infile_path = "data/examples_ru.csv",
    #     outfile_path = "data/examples_ru.json"
    # )
    app.run(debug=True, use_reloader=True, port="5001")