# Import data from csv, serve pages and data requests
from flask import Flask, render_template, send_file, request
from typing import OrderedDict
from pathlib import Path
import csv, json

app = Flask(__name__)

@app.route("/")
def landing():
    return render_template("landing.html.jinja")

@app.route("/ru")
def ru():
    oldest_variety, newest_variety = get_abbr("data/examples_ru.csv")
    return render_template(
        "arc_diagram.html.jinja", 
        data = {
            "oldest_variety": oldest_variety,
            "newest_variety": newest_variety,
            "language": "Russian",
        }
    )

@app.route("/hr")
def hr():
    # oldest_variety, newest_variety = get_abbr("data/examples_hr.csv")
    oldest_variety, newest_variety = "", ""
    return render_template(
        "arc_diagram.html.jinja", 
        data = {
            "oldest_variety": oldest_variety,
            "newest_variety": newest_variety,
            "language": "Croatian",
        }
    )

@app.route('/sound_changes', methods=['GET'])
def give_sc_data():
    language = request.args.get("lang")
    if language == "Russian":
        return send_file("data/sound_changes_ru.json")
    elif language == "Croatian":
        return send_file("data/sound_changes_hr.json")

@app.route('/examples', methods=['GET'])
def give_example_data():
    language = request.args.get("lang")
    if language == "Russian":
        if Path("data/examples_ru.json").exists():
            return send_file("data/examples_ru.json")
        else:
            return {"error": "Error getting Russian example data: "
                    "file 'data/examples_ru.json' does not exist."}
    elif language == "Croatian":
        if Path("data/examples_hr.json").exists():
            return send_file("data/examples_hr.json")
        else:
            return {"error": "Error getting Croatian example data: "
                    "file 'data/examples_hr.json' does not exist."}
    else:
        return {"error": "Error getting example data"}

@app.route('/sc_template', methods=['GET'])
def give_sc_template():
    return send_file("data/sound_changes_ru.csv")

@app.route('/ex_template', methods=['GET'])
def give_ex_template():
    return send_file("data/examples_ru.csv")

# Accept a CSV file (former excel sheet) and save it as json
# Formatting see documentation
def import_csv_sound_changes(infile_path, outfile_path, n_of_sound_changes):
    with open(infile_path, encoding="utf-8") as infile:
        csv_reader = csv.DictReader(infile, dialect="excel",
            # Makes first col "0", and the rest "1", "2", ..., "71" 
            fieldnames=[str(n) for n in range(0, n_of_sound_changes + 1)])

        out_dict = {"changes": [], "relations": []}

        # Remember what row (i.e. source) we're at, start counting after headers
        source_id = 1
        # Use a line num counter because csv_reader.line_num is buggy
        line_num = 0

        for row in csv_reader:
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
                cell_content = ""
                cell_content = row[str(target_id)]
                
                if cell_content:
                    relation = {
                        "source": source_id,
                        "target": target_id,
                        "d_reason": cell_content.replace("?", ""),
                        "d_conf": not "?" in cell_content
                    }
                    out_dict["relations"].append(relation)

            source_id = source_id + 1
            line_num = line_num + 1

    with open(outfile_path, mode="w+", encoding="utf-8") as outfile:
        outfile.write(json.dumps(out_dict))

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
    # with open(examples_file_path, encoding="utf-8-sig", newline='') as infile:
    #     csv_reader = csv.reader(infile, dialect="excel")

    #     for row in csv_reader:
    #         oldest_variety = row[1]
    #         newest_variety = row[0]
    #         break

    #     return oldest_variety, newest_variety
    return "", ""

if __name__ == "__main__":
    import_csv_sound_changes(
        infile_path = "data/sound_changes_hr.csv", 
        outfile_path = "data/sound_changes_hr.json", 
        n_of_sound_changes = 71
    )
    import_csv_examples(
        infile_path = "data/examples_ru.csv",
        outfile_path = "data/examples_ru.json"
    )
    app.run(debug=True, use_reloader=True)