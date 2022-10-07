# Import data from csv, serve pages and data requests
from flask import Flask, render_template, send_file
from typing import OrderedDict
import csv, json

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route('/sound_changes', methods=['GET'])
def give_sc_data():
    return send_file("data/sound_changes.json")


# Accept a CSV file (former excel sheet) and save it as json
# Formatting see documentation (TODO)
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
    out_dict = OrderedDict()
    # "utf-8-sig" removes the BOM at the beginning of file (added by Excel). 
    # Unsure if this will cause problems with files that don't have a BOM. 
    with open(infile_path, encoding="utf-8-sig") as infile:
        # Default reader takes field names from first row 
        csv_reader = csv.DictReader(infile, dialect="excel")
        for row in csv_reader:
            example = {}
            for field in row:
                if row[field] != "":
                    example[field] = row[field]
            out_dict[row["russian"]] = example
    
    with open(outfile_path, mode="w+", encoding="utf-8") as outfile:
        outfile.write(json.dumps(out_dict))

if __name__ == "__main__":
    import_csv_sound_changes(
        infile_path = "data/sound_changes.csv", 
        outfile_path = "data/sound_changes.json", 
        n_of_sound_changes = 71
    )
    import_csv_examples(
        infile_path = "data/examples.csv",
        outfile_path = "data/examples.json"
    )
    app.run(debug=True, use_reloader=True)