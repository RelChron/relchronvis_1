# Import data from csv, serve pages and data requests
from flask import Flask, render_template, send_file
import csv, json

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route('/dummy_data', methods=['GET'])
def give_dummy_data():
    return send_file("data/dummy_data.json")

@app.route('/sound_changes', methods=['GET'])
def give_sc_data():
    return send_file("data/sound_changes.json")


# Accept a TSV (.txt) file (former excel sheet) and save it as json
# Formatting see documentation (TODO)
def import_sound_changes(infile_path, outfile_path, n_of_sound_changes):
    with open(infile_path, encoding="utf-8") as infile:
        csv_reader = csv.DictReader(infile, dialect="excel",
            # Makes first col "0", and the rest "1", "2", ..., "71" 
            fieldnames=[str(n) for n in range(0, n_of_sound_changes + 1)])

        out_dict = {"changes": [], "relations": []}

        # Remember what row (i.e. source) we're at, start counting after headers
        source_id = 1

        for row in csv_reader:
            # Extract sound changes
            if csv_reader.line_num == 1:
                for i in range(1, n_of_sound_changes + 1):
                    sound_change = {
                        "id": i, 
                        "name": row[str(i)]
                    }
                    out_dict["changes"].append(sound_change)
                continue

            # Skip label row
            elif csv_reader.line_num == 2:
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

    with open(outfile_path, mode="w+", encoding="utf-8") as outfile:
        outfile.write(json.dumps(out_dict))
      

if __name__ == "__main__":
    import_sound_changes(
        infile_path="data/sound_changes.csv", 
        outfile_path="data/sound_changes.json", 
        n_of_sound_changes=71
    )
    app.run(debug=True, use_reloader=True)