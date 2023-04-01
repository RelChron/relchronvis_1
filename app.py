# Import data from csv, serve pages and data requests
from flask import Flask, render_template, send_file, request
from typing import OrderedDict
from pathlib import Path
import csv, json
import os

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
    data = {}
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
        data["error"] = "Error parsing language for arc diagram"

    return render_template("arc_diagram.html.jinja", data=data)

@app.route("/chord_diagram", methods=["GET"])
def chord_diagram():
    language = request.args.get("lang")
    data = {}
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
        data["error"] = "Error parsing language for chord diagram"

    return render_template("chord_diagram.html.jinja", data=data)

@app.route('/sound_changes', methods=["GET"])
def give_sc_data():
    language = request.args.get("lang")
    if language == "Russian":
        if Path(BASE_DIR / "data/sound_changes_ru.json").exists():
            return send_file("data/sound_changes_ru.json")
        else:
            return {"error": ("Error getting Russian sound change data",
                    "File 'data/sound_changes_ru.json' does not exist")}
    elif language == "Croatian":
        if Path(BASE_DIR / "data/sound_changes_hr.json").exists():
            return send_file("data/sound_changes_hr.json")
        else:
            return {"error": ("Error getting Croatian sound change data",
                    "File 'data/sound_changes_hr.json' does not exist")}

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

# Accept a CSV file (former excel sheet) and save it as json
# Formatting see documentation
def import_csv_sound_changes(sc_infile_path, relations_infile_path, 
                             outfile_path, matrix_outfile_path, 
                             n_of_sound_changes):
    # with open(sc_infile_path, encoding="utf-8-sig") as sc_infile:
    with (open(sc_infile_path, encoding="utf-8-sig") as sc_infile,
          open(relations_infile_path, encoding="utf-8-sig") as rel_infile):
        sc_reader = csv.DictReader(sc_infile, dialect="excel",
            # Makes first col "0", and the rest "1", "2", ..., "71" 
            fieldnames=[str(n) for n in range(0, n_of_sound_changes + 1)])
        
        rel_reader = list(csv.DictReader(rel_infile, dialect="excel"))

        # Used to be regular dict, check if it works still (at some point)
        out_dict = OrderedDict({"changes": [], "relations": []})

        # Remember what row (i.e. source) we're at, start counting after headers
        source_id = 1
        # Use a line num counter because csv_reader.line_num is buggy
        line_num = 0

        for row in sc_reader:
            # Extract sound changes
            if line_num == 0:
                for i in range(1, n_of_sound_changes + 1):
                    sound_change = {
                        "id": i, 
                        "name": row[str(i)]
                    }
                    out_dict["changes"].append(sound_change)
                line_num = line_num + 1
                continue

            # Extract sound change descriptions
            elif line_num == 1:
                for i in range(n_of_sound_changes):
                    out_dict["changes"][i]["descr"] = row[str(i+1)]
                line_num = line_num + 1
                continue

            # Skip label row
            elif line_num == 2:
                line_num = line_num + 1
                continue

            # Extract relations
            for target_id in range(1, n_of_sound_changes + 1):
                cell_content = row[str(target_id)]
                
                if cell_content:
                    relation = {
                        "source": source_id,
                        "target": target_id,
                        "type": cell_content.replace("?", ""),
                        "conf": not "?" in cell_content,
                        "descr": []
                    }
                    for rel in rel_reader:
                        if (rel["source_id"] == str(source_id)
                                and rel["target_id"] == str(target_id)):
                            relation["descr"].append(rel["description"])
                    out_dict["relations"].append(relation)

            source_id = source_id + 1
            line_num = line_num + 1

    with open(outfile_path, mode="w+", encoding="utf-8") as outfile:
        outfile.write(json.dumps(out_dict))

    # Save matrix needed for chord diagram
    matrix = []
    # For each sound change..
    for sc in out_dict["changes"]:
        matrix_row = []
        connected_ids = set()

        # ...check relations and get all connections...
        for relation in out_dict["relations"]:
            if relation["source"] == sc["id"]:
                connected_ids.add(relation["target"])
            if relation["target"] == sc["id"]:
                connected_ids.add(relation["source"])
        # ...and add 1s in the corresponding place in the matrix row.
        for i in range(1, len(out_dict["changes"]) + 1):
            if i in connected_ids:
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
    # import_csv_sound_changes(
    #     sc_infile_path = "data/sound_changes_hr.csv", 
    #     relations_infile_path = "", 
    #     outfile_path = "data/sound_changes_hr.json", 
    #     n_of_sound_changes = 71
    # )
    # import_csv_sound_changes(
    #     sc_infile_path = "data/sound_changes_ru.csv", 
    #     relations_infile_path = "data/relations_ru.csv", 
    #     outfile_path = "data/sound_changes_ru.json", 
    #     matrix_outfile_path = "data/matrix_ru.json",
    #     n_of_sound_changes = 71
    # )
    # import_csv_examples(
    #     infile_path = "data/examples_hr.csv",
    #     outfile_path = "data/examples_hr.json"
    # )
    # import_csv_examples(
    #     infile_path = "data/examples_ru.csv",
    #     outfile_path = "data/examples_ru.json"
    # )
    app.run(debug=True, use_reloader=True, port="5002")